"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurator } from "@/lib/auth";
import { addDays, tashkentDay } from "@/lib/format";
import { isDayStatus } from "@/lib/day-status";
import { MIN_PASSWORD } from "@/lib/constants";
import bcrypt from "bcryptjs";

// Kurator faqat o'ziga biriktirilgan kurslardagi o'quvchilarga yoza oladi; admin — hammaga.
async function assertCanManage(user: { id: string; role: string }, studentId: string) {
  if (user.role === "ADMIN") return true;
  const assigned = await prisma.curatorCourse.findMany({ where: { curatorId: user.id }, select: { courseId: true } });
  if (assigned.length === 0) return false;
  return !!(await prisma.enrollment.findFirst({ where: { userId: studentId, courseId: { in: assigned.map((a) => a.courseId) } } }));
}

const validDay = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day) && day <= addDays(tashkentDay(), -1); // faqat o'tgan kunlar

export async function saveDayNote(studentId: string, day: string, status: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireCurator();
  if (!validDay(day)) return { ok: false, error: "Kun noto'g'ri" };
  if (!isDayStatus(status)) return { ok: false, error: "Holatni tanlang" };
  if (!(await assertCanManage(user, studentId))) return { ok: false, error: "Bu o'quvchi sizga biriktirilmagan" };

  const text = reason.trim().slice(0, 500);
  await prisma.dayNote.upsert({
    where: { userId_day: { userId: studentId, day } },
    create: { userId: studentId, day, status, reason: text, authorName: user.name },
    update: { status, reason: text, authorName: user.name },
  });
  revalidatePath("/curator");
  revalidatePath("/admin/analytics");
  return { ok: true };
}

export async function clearDayNote(studentId: string, day: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireCurator();
  if (!validDay(day)) return { ok: false, error: "Kun noto'g'ri" };
  if (!(await assertCanManage(user, studentId))) return { ok: false, error: "Bu o'quvchi sizga biriktirilmagan" };
  await prisma.dayNote.deleteMany({ where: { userId: studentId, day } });
  revalidatePath("/curator");
  revalidatePath("/admin/analytics");
  return { ok: true };
}

// Kurator o'ziga biriktirilgan o'quvchiga yangi parol qo'yadi (hozirgi parol so'ralmaydi). Eski sessiyalar yopiladi.
export async function setStudentPassword(studentId: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireCurator();
  if (newPassword.length < MIN_PASSWORD) return { ok: false, error: `Parol kamida ${MIN_PASSWORD} ta belgidan iborat bo'lsin` };
  if (newPassword.length > 72) return { ok: false, error: "Parol juda uzun" };
  if (!(await assertCanManage(user, studentId))) return { ok: false, error: "Bu o'quvchi sizga biriktirilmagan" };
  const target = await prisma.user.findUnique({ where: { id: studentId } });
  if (!target || target.role !== "STUDENT") return { ok: false, error: "O'quvchi topilmadi" };

  // Parol o'zgargach sessiya izi (pv) o'zgaradi — o'quvchi hamma qurilmadan chiqib ketadi
  await prisma.user.update({ where: { id: studentId }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
  await prisma.passwordReset.deleteMany({ where: { userId: studentId } });
  return { ok: true };
}
