"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fulfillOrder } from "@/lib/access";
import bcrypt from "bcryptjs";
import { normalizeEmail } from "@/lib/format";
import { isHexColor } from "@/lib/brand";
import { generatePassword } from "@/lib/password";
import { sendCourseOpened, sendCredentials, sendNewPassword, type MailResult } from "@/lib/mail";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const int = (fd: FormData, key: string, fallback = 0) => {
  const n = parseInt(str(fd, key).replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
};

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[ʻʼ'`‘’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "kurs"
  );
}

// "2026-10-01T10:00" (Toshkent vaqti) -> Date
function parseTashkent(value: string) {
  return value ? new Date(`${value}:00+05:00`) : null;
}

// ---------- Kurslar ----------

export async function createCourse(formData: FormData) {
  await requireAdmin();
  const title = str(formData, "title");
  if (!title) return;
  let slug = slugify(title);
  if (await prisma.course.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const course = await prisma.course.create({ data: { title, slug } });
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourse(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const slug = slugify(str(formData, "slug"));
  const clash = await prisma.course.findFirst({ where: { slug, NOT: { id } } });
  await prisma.course.update({
    where: { id },
    data: {
      title: str(formData, "title"),
      subtitle: str(formData, "subtitle"),
      description: str(formData, "description"),
      coverUrl: str(formData, "coverUrl"),
      brandName: str(formData, "brandName"),
      logoUrl: str(formData, "logoUrl"),
      brandColor: isHexColor(str(formData, "brandColor")) ? str(formData, "brandColor") : "",
      authorId: str(formData, "authorId") || null,
      published: formData.get("published") === "on",
      ...(clash ? {} : { slug }),
    },
  });
  revalidatePath("/", "layout");
}

export async function deleteCourse(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (await prisma.order.count({ where: { tariff: { courseId: id }, status: "PAID" } })) {
    throw new Error("Bu kursda to'langan buyurtmalar bor — o'chirish o'rniga nashrdan oling.");
  }
  await prisma.order.deleteMany({ where: { tariff: { courseId: id } } });
  await prisma.enrollment.deleteMany({ where: { courseId: id } });
  await prisma.course.delete({ where: { id } });
  redirect("/admin/courses");
}

// ---------- Tariflar ----------

export async function saveTariff(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const oldPrice = int(formData, "oldPrice");
  const data = {
    name: str(formData, "name") || "Tarif",
    price: int(formData, "price"),
    oldPrice: oldPrice > 0 ? oldPrice : null,
    level: Math.max(1, int(formData, "level", 1)),
    features: str(formData, "features"),
    active: formData.get("active") === "on",
  };
  if (id) await prisma.tariff.update({ where: { id }, data });
  else await prisma.tariff.create({ data: { ...data, courseId: str(formData, "courseId") } });
  revalidatePath("/", "layout");
}

export async function deleteTariff(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const used = (await prisma.order.count({ where: { tariffId: id } })) + (await prisma.enrollment.count({ where: { tariffId: id } }));
  // Buyurtmalar bog'langan tarifni o'chirmaymiz — faqat o'chirib qo'yamiz
  if (used) await prisma.tariff.update({ where: { id }, data: { active: false } });
  else await prisma.tariff.delete({ where: { id } });
  revalidatePath("/", "layout");
}

// ---------- Modullar ----------

export async function createModule(formData: FormData) {
  await requireAdmin();
  const courseId = str(formData, "courseId");
  const count = await prisma.module.count({ where: { courseId } });
  await prisma.module.create({ data: { courseId, title: str(formData, "title") || `${count + 1}-modul`, order: count + 1 } });
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateModule(formData: FormData) {
  await requireAdmin();
  await prisma.module.update({
    where: { id: str(formData, "id") },
    data: { title: str(formData, "title"), description: str(formData, "description") },
  });
  revalidatePath("/", "layout");
}

// Ketma-ketlikda bir qadam yuqoriga/pastga suradi va tartib raqamlarini 1..n qilib tuzatadi.
async function reorder(ids: string[], id: string, dir: string, save: (id: string, order: number) => Promise<unknown>) {
  const from = ids.indexOf(id);
  const to = dir === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await Promise.all(ids.map((mid, i) => save(mid, i + 1)));
}

export async function moveModule(formData: FormData) {
  await requireAdmin();
  const m = await prisma.module.findUniqueOrThrow({ where: { id: str(formData, "id") } });
  const siblings = await prisma.module.findMany({ where: { courseId: m.courseId }, orderBy: [{ order: "asc" }, { id: "asc" }], select: { id: true } });
  await reorder(siblings.map((x) => x.id), m.id, str(formData, "dir"), (id, order) => prisma.module.update({ where: { id }, data: { order } }));
  revalidatePath("/", "layout");
}

export async function moveLesson(formData: FormData) {
  await requireAdmin();
  const l = await prisma.lesson.findUniqueOrThrow({ where: { id: str(formData, "id") } });
  const siblings = await prisma.lesson.findMany({ where: { moduleId: l.moduleId }, orderBy: [{ order: "asc" }, { id: "asc" }], select: { id: true } });
  await reorder(siblings.map((x) => x.id), l.id, str(formData, "dir"), (id, order) => prisma.lesson.update({ where: { id }, data: { order } }));
  revalidatePath("/", "layout");
}

export async function deleteModule(formData: FormData) {
  await requireAdmin();
  const m = await prisma.module.delete({ where: { id: str(formData, "id") } });
  revalidatePath(`/admin/courses/${m.courseId}`);
}

// ---------- Darslar ----------

export async function createLesson(formData: FormData) {
  await requireAdmin();
  const moduleId = str(formData, "moduleId");
  const count = await prisma.lesson.count({ where: { moduleId } });
  const lesson = await prisma.lesson.create({
    data: { moduleId, title: str(formData, "title") || "Yangi dars", order: count + 1 },
  });
  redirect(`/admin/lessons/${lesson.id}`);
}

export async function updateLesson(formData: FormData) {
  await requireAdmin();
  const lesson = await prisma.lesson.update({
    where: { id: str(formData, "id") },
    data: {
      title: str(formData, "title"),
      content: str(formData, "content"),
      videoUrl: str(formData, "videoUrl"),
      duration: str(formData, "duration"),
      order: int(formData, "order"),
      minLevel: Math.max(1, int(formData, "minLevel", 1)),
      openAt: parseTashkent(str(formData, "openAt")),
    },
    include: { module: true },
  });
  revalidatePath("/", "layout");
  redirect(`/admin/courses/${lesson.module.courseId}`);
}

export async function deleteLesson(formData: FormData) {
  await requireAdmin();
  const lesson = await prisma.lesson.delete({ where: { id: str(formData, "id") }, include: { module: true } });
  redirect(`/admin/courses/${lesson.module.courseId}`);
}

// ---------- Buyurtmalar va o'quvchilar ----------

export async function markOrderPaid(formData: FormData) {
  await requireAdmin();
  await fulfillOrder(str(formData, "id"), "manual");
  revalidatePath("/admin", "layout");
}

export async function cancelOrder(formData: FormData) {
  await requireAdmin();
  await prisma.order.updateMany({ where: { id: str(formData, "id"), status: "PENDING" }, data: { status: "CANCELED" } });
  revalidatePath("/admin", "layout");
}

export type MailStatus = "sent" | "failed" | "skipped";
export type AddStudentState = {
  error?: string;
  result?: { name: string; email: string; course: string; tariff: string; isNew: boolean; password: string | null; mail: MailStatus; mailReason?: string };
};

function mailStatus(r: MailResult | null): { mail: MailStatus; mailReason?: string } {
  if (!r) return { mail: "skipped" };
  return r.sent ? { mail: "sent" } : { mail: "failed", mailReason: r.reason };
}

// To'lov admin tomonidan tasdiqlangach: akkaunt ochadi (yoki mavjudini topadi), kursni ochadi, emailga login/parol yuboradi.
export async function addStudent(_: AddStudentState, formData: FormData): Promise<AddStudentState> {
  await requireAdmin();
  const email = normalizeEmail(str(formData, "email"));
  if (!email) return { error: "Email noto'g'ri" };
  const tariff = await prisma.tariff.findUnique({ where: { id: str(formData, "tariffId") }, include: { course: true } });
  if (!tariff) return { error: "Kurs va tarifni tanlang" };

  let user = await prisma.user.findUnique({ where: { email } });
  const isNew = !user;
  let password: string | null = null;

  if (user) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: tariff.courseId } },
      include: { tariff: true },
    });
    if (enrollment && enrollment.tariff.level >= tariff.level) {
      return { error: `${user.name} ga «${tariff.course.title}» allaqachon ochiq (${enrollment.tariff.name} tarifi).` };
    }
  } else {
    const name = str(formData, "name");
    if (name.length < 2) return { error: "Yangi o'quvchi uchun ism va familiyani yozing" };
    password = generatePassword();
    user = await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10) } });
  }

  const order = await prisma.$transaction(async (tx) => {
    const last = await tx.order.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
    return tx.order.create({
      data: {
        number: (last?.number ?? 1000) + 1,
        userId: user!.id,
        tariffId: tariff.id,
        amount: int(formData, "amount"),
        utmSource: str(formData, "source"),
        note: str(formData, "note"),
      },
    });
  });
  await fulfillOrder(order.id, "manual");

  let mail: MailResult | null = null;
  if (formData.get("sendMail") === "on") {
    mail = password
      ? await sendCredentials(email, user.name, tariff.course.title, password)
      : await sendCourseOpened(email, user.name, tariff.course.title);
  }
  revalidatePath("/admin", "layout");
  return {
    result: { name: user.name, email, course: tariff.course.title, tariff: tariff.name, isNew, password, ...mailStatus(mail) },
  };
}

export type ResetPasswordState = { error?: string; password?: string; mail?: MailStatus; mailReason?: string };

// Yangi parol yaratadi va emailga yuboradi (o'quvchi parolni yo'qotsa).
export async function resetStudentPassword(_: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: str(formData, "id") } });
  if (!user) return { error: "Foydalanuvchi topilmadi" };
  const password = generatePassword();
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  const mail = mailStatus(await sendNewPassword(user.email, user.name, password));
  return { password, ...mail };
}

// ---------- Mualliflar ----------

export async function createAuthor(formData: FormData) {
  await requireAdmin();
  const name = str(formData, "name");
  if (name) await prisma.author.create({ data: { name } });
  revalidatePath("/admin", "layout");
}

export async function updateAuthor(formData: FormData) {
  await requireAdmin();
  await prisma.author.update({ where: { id: str(formData, "id") }, data: { name: str(formData, "name") } });
  revalidatePath("/admin", "layout");
}

export async function deleteAuthor(formData: FormData) {
  await requireAdmin();
  await prisma.author.delete({ where: { id: str(formData, "id") } }); // kurslari "muallifsiz" bo'lib qoladi
  revalidatePath("/admin", "layout");
}

export async function setUserRole(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const role = str(formData, "role");
  if (id === admin.id || !["ADMIN", "CURATOR", "STUDENT"].includes(role)) return;
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/students");
}
