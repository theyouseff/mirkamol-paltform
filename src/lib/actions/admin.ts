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
import { sendActivation, sendCourseOpened, sendCuratorInvite, sendNewPassword, type MailResult } from "@/lib/mail";
import { createResetCode, INVITE_TTL_MS } from "@/lib/reset";

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
      price: Math.max(0, int(formData, "price")),
      ...(clash ? {} : { slug }),
    },
  });
  revalidatePath("/", "layout");
}

export async function deleteCourse(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (await prisma.order.count({ where: { courseId: id, status: "PAID" } })) {
    throw new Error("Bu kursda to'langan buyurtmalar bor — o'chirish o'rniga nashrdan oling.");
  }
  await prisma.order.deleteMany({ where: { courseId: id } });
  await prisma.enrollment.deleteMany({ where: { courseId: id } });
  await prisma.course.delete({ where: { id } });
  redirect("/admin/courses");
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
    data: { title: str(formData, "title"), description: str(formData, "description"), coverUrl: str(formData, "coverUrl") },
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
  result?: { name: string; email: string; course: string; isNew: boolean; activationCode: string | null; mail: MailStatus; mailReason?: string };
};

function mailStatus(r: MailResult | null): { mail: MailStatus; mailReason?: string } {
  if (!r) return { mail: "skipped" };
  return r.sent ? { mail: "sent" } : { mail: "failed", mailReason: r.reason };
}

// To'lov admin tomonidan tasdiqlangach: akkaunt ochadi (yoki mavjudini topadi), kursni ochadi va yangi o'quvchiga
// emailga bir martalik kod yuboradi — parolni o'quvchining o'zi qo'yadi.
export async function addStudent(_: AddStudentState, formData: FormData): Promise<AddStudentState> {
  await requireAdmin();
  const email = normalizeEmail(str(formData, "email"));
  if (!email) return { error: "Email noto'g'ri" };
  const course = await prisma.course.findUnique({ where: { id: str(formData, "courseId") } });
  if (!course) return { error: "Kursni tanlang" };

  let user = await prisma.user.findUnique({ where: { email } });
  const isNew = !user;
  let activationCode: string | null = null;

  if (user) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
    });
    if (enrollment) return { error: `${user.name} ga «${course.title}» allaqachon ochiq.` };
  } else {
    const name = str(formData, "name");
    if (name.length < 2) return { error: "Yangi o'quvchi uchun ism va familiyani yozing" };
    // Vaqtinchalik parol hech kimga ko'rsatilmaydi; o'quvchi kod orqali o'zi parol qo'yadi
    user = await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(generatePassword(24), 10) } });
    activationCode = await createResetCode(user.id, INVITE_TTL_MS);
  }

  const order = await prisma.$transaction(async (tx) => {
    const last = await tx.order.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
    return tx.order.create({
      data: {
        number: (last?.number ?? 1000) + 1,
        userId: user!.id,
        buyerName: user!.name,
        buyerEmail: user!.email,
        courseId: course.id,
        amount: int(formData, "amount"),
        utmSource: str(formData, "source"),
        note: str(formData, "note"),
      },
    });
  });
  await fulfillOrder(order.id, "manual");

  let mail: MailResult | null = null;
  if (formData.get("sendMail") === "on") {
    mail = activationCode
      ? await sendActivation(email, user.name, course.title, activationCode)
      : await sendCourseOpened(email, user.name, course.title);
  }
  revalidatePath("/admin", "layout");
  const status = mailStatus(mail);
  return {
    result: {
      name: user.name, email, course: course.title, isNew,
      // Xat ketgan bo'lsa kodni ko'rsatmaymiz; ketmasa admin uni Telegramda o'zi yuboradi
      activationCode: status.mail === "sent" ? null : activationCode,
      ...status,
    },
  };
}

// O'quvchini kursdan chiqaradi: kursga kirish yopiladi va kurator ro'yxatidan tushadi. Akkaunt, to'lov yozuvi va ko'rish natijalari saqlanadi
// (kursga qayta qo'shilsa, tarixi qaytadi).
export async function removeFromCourse(formData: FormData) {
  await requireAdmin();
  const userId = str(formData, "userId");
  const courseId = str(formData, "courseId");
  if (!userId || !courseId) return;
  await prisma.enrollment.deleteMany({ where: { userId, courseId } });
  revalidatePath("/admin", "layout");
  revalidatePath("/cabinet", "layout");
  revalidatePath("/curator", "layout");
}

// O'quvchi akkauntini butunlay o'chiradi: kirish, kurslar, ko'rish natijalari, kirgan kunlar va chat yozuvlari o'chadi.
// To'lov yozuvlari (daromad hisoboti) saqlanadi — ularda o'quvchining ismi va emaili nusxasi qoladi. Faqat o'quvchi (admin/kurator emas).
export async function deleteStudent(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  if (!id || id === admin.id) return;
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true, name: true, email: true } });
  if (!user || user.role !== "STUDENT") return;
  // Yozuvlar eski bo'lsa, nusxa yo'q bo'lishi mumkin — o'chirishdan oldin to'ldiramiz
  await prisma.order.updateMany({ where: { userId: id, buyerEmail: "" }, data: { buyerName: user.name, buyerEmail: user.email } });
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin", "layout");
  revalidatePath("/curator", "layout");
}

export type AddCuratorState = {
  error?: string;
  result?: { name: string; email: string; promoted: boolean; courses: number; activationCode: string | null; mail: MailStatus; mailReason?: string };
};

// Kuratorga kurslarni biriktiradi (eskilari almashadi): kurator shu kurslardagi hamma o'quvchini ko'radi.
async function assignCourses(curatorId: string, courseIds: string[]) {
  const valid = courseIds.length ? await prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true } }) : [];
  await prisma.$transaction([
    prisma.curatorCourse.deleteMany({ where: { curatorId } }),
    prisma.curatorCourse.createMany({ data: valid.map((c) => ({ curatorId, courseId: c.id })) }),
  ]);
  return valid.length;
}

export async function setCuratorCourses(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const curator = await prisma.user.findUnique({ where: { id } });
  if (!curator || curator.role !== "CURATOR") return;
  await assignCourses(id, formData.getAll("courseId").map(String));
  revalidatePath("/admin", "layout");
}

// Kurator qo'shadi: yangi email bo'lsa akkaunt ochiladi va emailiga bir martalik kod ketadi; mavjud foydalanuvchi bo'lsa roli kurator qilinadi.
export async function addCurator(_: AddCuratorState, formData: FormData): Promise<AddCuratorState> {
  await requireAdmin();
  const email = normalizeEmail(str(formData, "email"));
  if (!email) return { error: "Email noto'g'ri" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === "ADMIN") return { error: "Bu akkaunt admin, uni kurator qilib bo'lmaydi." };
    if (existing.role === "CURATOR") return { error: `${existing.name} allaqachon kurator.` };
    await prisma.user.update({ where: { id: existing.id }, data: { role: "CURATOR" } });
    const courses = await assignCourses(existing.id, formData.getAll("courseId").map(String));
    revalidatePath("/admin", "layout");
    return { result: { name: existing.name, email, promoted: true, courses, activationCode: null, mail: "skipped" } };
  }

  const name = str(formData, "name");
  if (name.length < 2) return { error: "Kurator ismini yozing" };
  const user = await prisma.user.create({ data: { name, email, role: "CURATOR", passwordHash: await bcrypt.hash(generatePassword(24), 10) } });
  const courses = await assignCourses(user.id, formData.getAll("courseId").map(String));
  const code = await createResetCode(user.id, INVITE_TTL_MS);
  const mail = formData.get("sendMail") === "on" ? await sendCuratorInvite(email, name, code) : null;
  const status = mailStatus(mail);
  revalidatePath("/admin", "layout");
  return { result: { name, email, promoted: false, courses, activationCode: status.mail === "sent" ? null : code, ...status } };
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

// Muallifga kurslarni biriktiradi: belgilanganlar shu muallifga o'tadi (boshqa muallifdagi bo'lsa ham),
// oldin shu muallifda bo'lib belgisi olib tashlanganlar muallifsiz bo'ladi.
async function assignAuthorCourses(authorId: string, courseIds: string[]) {
  await prisma.$transaction([
    prisma.course.updateMany({ where: { authorId, id: { notIn: courseIds } }, data: { authorId: null } }),
    prisma.course.updateMany({ where: { id: { in: courseIds } }, data: { authorId } }),
  ]);
}

export async function createAuthor(formData: FormData) {
  await requireAdmin();
  const name = str(formData, "name");
  if (name) {
    const author = await prisma.author.create({ data: { name } });
    const courseIds = formData.getAll("courseId").map(String);
    if (courseIds.length) await assignAuthorCourses(author.id, courseIds);
  }
  revalidatePath("/", "layout");
}

export async function setAuthorCourses(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!(await prisma.author.findUnique({ where: { id } }))) return;
  await assignAuthorCourses(id, formData.getAll("courseId").map(String));
  revalidatePath("/", "layout");
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
