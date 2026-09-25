"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurator } from "@/lib/auth";
import { addDays, tashkentDay } from "@/lib/format";
import { isDayStatus } from "@/lib/day-status";

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
