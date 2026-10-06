"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { fulfillOrder } from "@/lib/access";
import { remindOrder } from "@/lib/reminders";
import { normalizeEmail } from "@/lib/format";
import { generatePassword, hashPassword } from "@/lib/password";
import { openPassword, sealPassword } from "@/lib/vault";
import { isLimited, recordAttempt } from "@/lib/rate-limit";
import { sendCourseOpened, sendCuratorAccess, sendNewPassword, sendStudentAccess, type MailResult } from "@/lib/mail";

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
    data: { title: str(formData, "title"), description: str(formData, "description"), iconUrl: str(formData, "iconUrl") },
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
      thumbUrl: str(formData, "thumbUrl"),
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

// To'lov holatini o'zgartiradi: To'langan / Kutilmoqda / Bekor qilingan (Qaytarildi ham shu bloka tushadi). To'langan bo'lganda kurs ochiladi;
// boshqa holatga o'tganda kursga kirish o'zgarmaydi (kerak bo'lsa o'quvchini kursdan chiqaring). Daromadga faqat To'langanlar kiradi.
export async function setOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!["PAID", "PENDING", "CANCELED"].includes(status)) return;
  const order = await prisma.order.findUnique({ where: { id }, select: { status: true, userId: true, provider: true } });
  if (!order || order.status === status) return;
  if (status === "PAID") await fulfillOrder(id, order.provider || "manual");
  else await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin", "layout");
}

// Kutilmoqda to'lov uchun to'lash kerak bo'lgan kun. Shu kuni (ertalab 09:00, Toshkent) o'quvchiga emailga eslatma avtomatik ketadi.
export async function setOrderDue(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const day = str(formData, "dueDay");
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(new Date(`${day}T00:00:00Z`).getTime());
  await prisma.order.updateMany({ where: { id, status: "PENDING" }, data: { dueDay: valid ? day : null, reminderSentAt: null } });
  revalidatePath("/admin", "layout");
}

// Eslatmani hozir qo'lda yuborish
export async function remindOrderNow(formData: FormData) {
  await requireAdmin();
  await remindOrder(str(formData, "id"));
  revalidatePath("/admin", "layout");
}

// To'lov yozuvini o'chiradi (daromad hisobotidan ham chiqadi). Kursga kirish o'zgarmaydi.
export async function deleteOrder(formData: FormData) {
  await requireAdmin();
  await prisma.order.deleteMany({ where: { id: str(formData, "id") } });
  revalidatePath("/admin", "layout");
}

export type MailStatus = "sent" | "failed" | "skipped";
export type AddStudentState = {
  error?: string;
  result?: { name: string; email: string; courses: string[]; skipped: string[]; isNew: boolean; password: string | null; mail: MailStatus; mailReason?: string };
};

function mailStatus(r: MailResult | null): { mail: MailStatus; mailReason?: string } {
  if (!r) return { mail: "skipped" };
  return r.sent ? { mail: "sent" } : { mail: "failed", mailReason: r.reason };
}

// Bitta kursni o'quvchiga ochadi: to'lov yozuvi (buyurtma) yaratadi va kursga kirishni beradi. Kurs allaqachon ochiq bo'lsa — false.
async function grantCourse(user: { id: string; name: string; email: string }, courseId: string, amount: number, source: string, note: string) {
  if (await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } }, select: { id: true } })) return false;
  const order = await prisma.$transaction(async (tx) => {
    const last = await tx.order.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
    return tx.order.create({
      data: { number: (last?.number ?? 1000) + 1, userId: user.id, buyerName: user.name, buyerEmail: user.email, courseId, amount: Math.max(0, amount), utmSource: source, note },
    });
  });
  await fulfillOrder(order.id, "manual");
  return true;
}

// To'lov admin tomonidan tasdiqlangach: akkaunt ochadi (yoki mavjudini topadi), BELGILANGAN BARCHA kurslarni ochadi (har biri uchun alohida
// to'lov yozuvi va summa) va yangi o'quvchiga emailga login va tayyor parol yuboradi.
export async function addStudent(_: AddStudentState, formData: FormData): Promise<AddStudentState> {
  await requireAdmin();
  const email = normalizeEmail(str(formData, "email"));
  if (!email) return { error: "Email noto'g'ri" };
  const ids = [...new Set(formData.getAll("courseId").map(String).filter(Boolean))];
  if (ids.length === 0) return { error: "Kamida bitta kursni belgilang" };
  const found = await prisma.course.findMany({ where: { id: { in: ids } }, orderBy: { title: "asc" } });
  if (found.length === 0) return { error: "Kursni tanlang" };

  let user = await prisma.user.findUnique({ where: { email } });
  const isNew = !user;
  let password: string | null = null; // faqat yangi akkaunt uchun: tayyor parol (emailga ketadi va panelda ko'rinadi)

  if (!user) {
    const name = str(formData, "name");
    if (name.length < 2) return { error: "Yangi o'quvchi uchun ism va familiyani yozing" };
    // Yangi o'quvchiga tayyor parol beriladi: email va shu parol bilan to'g'ridan-to'g'ri kiradi (keyin «Parol» bo'limida o'zgartiradi)
    password = generatePassword();
    user = await prisma.user.create({ data: { name, email, passwordHash: await hashPassword(password), vaultPassword: sealPassword(password) } });
  }

  const opened: string[] = [];
  const skipped: string[] = [];
  for (const c of found) {
    const ok = await grantCourse(user, c.id, int(formData, `amount_${c.id}`), str(formData, "source"), str(formData, "note"));
    (ok ? opened : skipped).push(c.title);
  }
  if (opened.length === 0) return { error: `${user.name} ga tanlangan kurslar allaqachon ochiq: ${skipped.join(", ")}.` };

  let mail: MailResult | null = null;
  if (formData.get("sendMail") === "on") {
    const titles = opened.join(", ");
    mail = password ? await sendStudentAccess(email, user.name, titles, password) : await sendCourseOpened(email, user.name, titles);
  }
  revalidatePath("/admin", "layout");
  return { result: { name: user.name, email, courses: opened, skipped, isNew, password, ...mailStatus(mail) } };
}

export type AddCourseState = { error?: string; ok?: string };

// Kursi bor (yoki yo'q) o'quvchiga qo'shimcha kurs ochadi — eski kurslari o'z joyida qoladi (almashtirishdan farqli). Summa va email xabari ixtiyoriy.
export async function addCourseToStudent(_: AddCourseState, formData: FormData): Promise<AddCourseState> {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: str(formData, "userId") }, select: { id: true, name: true, email: true, role: true } });
  if (!user || user.role !== "STUDENT") return { error: "O'quvchi topilmadi" };
  const course = await prisma.course.findUnique({ where: { id: str(formData, "courseId") }, select: { id: true, title: true } });
  if (!course) return { error: "Kursni tanlang" };
  const ok = await grantCourse(user, course.id, int(formData, "amount"), "", "Qo'shimcha kurs");
  if (!ok) return { error: `«${course.title}» allaqachon ochiq` };
  if (formData.get("sendMail") === "on") await sendCourseOpened(user.email, user.name, course.title);
  revalidatePath("/admin", "layout");
  revalidatePath("/cabinet", "layout");
  revalidatePath("/curator", "layout");
  return { ok: `«${course.title}» ochildi` };
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

// O'quvchining kursini almashtiradi: eski kursdan chiqarib, yangisiga yozadi (kirgan sanasi saqlanadi). To'lov yozuvlari o'zgarmaydi.
export async function changeCourse(formData: FormData) {
  await requireAdmin();
  const userId = str(formData, "userId");
  const fromId = str(formData, "fromCourseId");
  const toId = str(formData, "toCourseId");
  if (!userId || !fromId || !toId || fromId === toId) return;
  const [from, target] = await Promise.all([
    prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: fromId } } }),
    prisma.course.findUnique({ where: { id: toId }, select: { id: true } }),
  ]);
  if (!from || !target) return;
  const already = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: toId } } });
  if (already) await prisma.enrollment.delete({ where: { id: from.id } }); // yangi kursga allaqachon yozilgan bo'lsa, eskisidan chiqariladi
  else await prisma.enrollment.update({ where: { id: from.id }, data: { courseId: toId } });
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
  result?: { name: string; email: string; promoted: boolean; courses: number; password: string | null; mail: MailStatus; mailReason?: string };
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
    return { result: { name: existing.name, email, promoted: true, courses, password: null, mail: "skipped" } };
  }

  const name = str(formData, "name");
  if (name.length < 2) return { error: "Kurator ismini yozing" };
  const password = generatePassword();
  const user = await prisma.user.create({ data: { name, email, role: "CURATOR", passwordHash: await hashPassword(password), vaultPassword: sealPassword(password) } });
  const courses = await assignCourses(user.id, formData.getAll("courseId").map(String));
  const mail = formData.get("sendMail") === "on" ? await sendCuratorAccess(email, name, password) : null;
  const status = mailStatus(mail);
  revalidatePath("/admin", "layout");
  return { result: { name, email, promoted: false, courses, password, ...status } };
}

export type ResetPasswordState = { error?: string; password?: string; mail?: MailStatus; mailReason?: string };

// Yangi parol yaratadi va emailga yuboradi (o'quvchi parolni yo'qotsa).
export async function resetStudentPassword(_: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: str(formData, "id") } });
  if (!user) return { error: "Foydalanuvchi topilmadi" };
  const password = generatePassword();
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password), vaultPassword: sealPassword(password) } });
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

// Admin o'quvchining parolini ko'radi: faqat platforma yaratgan parol (yangi akkaunt, "Yangi parol", kurator o'rnatgani) saqlanadi.
// O'quvchi o'zi o'zgartirgan yoki eski akkauntlarda parol yo'q — null (u holda "Yangi parol" tugmasi bilan yangisini yaratish mumkin).
// Parol sahifa bilan birga emas, faqat shu amal bilan, bosilganda olinadi.
export async function revealPassword(userId: string): Promise<{ password: string | null; error?: string }> {
  const admin = await requireAdmin();
  const key = `reveal:${admin.id}`;
  if (await isLimited([{ key, max: 120 }], 10 * 60_000)) return { password: null, error: "Juda ko'p so'rov, biroz kuting" };
  await recordAttempt([key]);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { vaultPassword: true } });
  return { password: openPassword(user?.vaultPassword) };
}
