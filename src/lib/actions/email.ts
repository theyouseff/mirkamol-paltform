"use server";

import { prisma } from "@/lib/db";
import { requireCurator } from "@/lib/auth";
import { canManageStudent } from "@/lib/curator-scope";
import { isLimited, recordAttempt } from "@/lib/rate-limit";
import { mailConfigured, sendStaffMessage } from "@/lib/mail";

export type EmailResult = { ok: boolean; error?: string };

// Admin yoki kurator o'quvchiga email yozadi (kurator — faqat o'z o'quvchisiga). Javob xodimning emailiga keladi.
export async function emailStudent(studentId: string, message: string): Promise<EmailResult> {
  const user = await requireCurator();
  const text = message.trim().slice(0, 3000);
  if (!text) return { ok: false, error: "Xabar matnini yozing" };
  if (!(await canManageStudent(user, studentId))) return { ok: false, error: "Bu o'quvchi sizga biriktirilmagan" };
  if (!mailConfigured()) return { ok: false, error: "Email yuborish sozlanmagan (SMTP)" };

  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true, email: true, role: true } });
  if (!student || student.role !== "STUDENT") return { ok: false, error: "O'quvchi topilmadi" };

  // Spamdan himoya: 10 daqiqada 10 tadan ko'p emas
  const key = `mail:${user.id}`;
  if (await isLimited([{ key, max: 10 }], 10 * 60_000)) return { ok: false, error: "Juda ko'p xat yubordingiz, biroz kuting" };
  await recordAttempt([key]);

  const res = await sendStaffMessage(student.email, student.name, user.name, user.email, text);
  return res.sent ? { ok: true } : { ok: false, error: res.reason ?? "Yuborib bo'lmadi" };
}
