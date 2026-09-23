"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fulfillOrder } from "@/lib/access";
import { normalizePhone } from "@/lib/format";

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
  const m = await prisma.module.update({
    where: { id: str(formData, "id") },
    data: { title: str(formData, "title"), order: int(formData, "order") },
  });
  revalidatePath(`/admin/courses/${m.courseId}`);
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

export type GrantState = { error?: string; ok?: string };

// Qo'lda kirish berish (naqd to'lov, bonus, jamoa a'zosi va h.k.)
export async function grantAccess(_: GrantState, formData: FormData): Promise<GrantState> {
  await requireAdmin();
  const phone = normalizePhone(str(formData, "phone"));
  if (!phone) return { error: "Telefon raqam noto'g'ri" };
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return { error: "Bu raqam bilan foydalanuvchi topilmadi. Avval u ro'yxatdan o'tishi kerak." };
  const tariff = await prisma.tariff.findUnique({ where: { id: str(formData, "tariffId") }, include: { course: true } });
  if (!tariff) return { error: "Tarifni tanlang" };

  const order = await prisma.$transaction(async (tx) => {
    const last = await tx.order.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
    return tx.order.create({
      data: { number: (last?.number ?? 1000) + 1, userId: user.id, tariffId: tariff.id, amount: int(formData, "amount") },
    });
  });
  await fulfillOrder(order.id, "manual");
  revalidatePath("/admin", "layout");
  return { ok: `${user.name} → «${tariff.course.title}» (${tariff.name}) ochildi` };
}

export async function setUserRole(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const role = str(formData, "role");
  if (id === admin.id || !["ADMIN", "CURATOR", "STUDENT"].includes(role)) return;
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/students");
}
