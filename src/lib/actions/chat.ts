"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canManageStudent } from "@/lib/curator-scope";
import { isStaff } from "@/lib/roles";

export type ChatMsg = { id: string; authorRole: "STUDENT" | "STAFF"; authorName: string; body: string; createdAt: string };
type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

const toMsg = (m: { id: string; authorRole: string; authorName: string; body: string; createdAt: Date }): ChatMsg => ({
  id: m.id,
  authorRole: m.authorRole === "STAFF" ? "STAFF" : "STUDENT",
  authorName: m.authorName,
  body: m.body,
  createdAt: m.createdAt.toISOString(),
});

// Kim qaysi suhbatga kira oladi: o'quvchi — faqat o'ziniki; kurator — biriktirilgan o'quvchilariniki; admin — hammasi.
async function access(studentId: string) {
  const user = await requireUser();
  if (user.role === "STUDENT") return user.id === studentId ? { user, side: "STUDENT" as const } : null;
  if (isStaff(user.role) && (await canManageStudent(user, studentId))) return { user, side: "STAFF" as const };
  return null;
}

// Suhbat xabarlari (after dan keyingilari). Qarshi tomon yozgan o'qilmagan xabarlar o'qilgan deb belgilanadi.
export async function fetchMessages(studentId: string, after?: string): Promise<Result<{ messages: ChatMsg[] }>> {
  const ctx = await access(studentId);
  if (!ctx) return { ok: false, error: "Ruxsat yo'q" };
  const since = after ? new Date(after) : null;
  const rows = await prisma.chatMessage.findMany({
    where: { studentId, ...(since && !Number.isNaN(since.getTime()) ? { createdAt: { gt: since } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 300,
  });
  const other = ctx.side === "STUDENT" ? "STAFF" : "STUDENT";
  await prisma.chatMessage.updateMany({ where: { studentId, authorRole: other, readAt: null }, data: { readAt: new Date() } });
  return { ok: true, messages: rows.map(toMsg) };
}

export async function sendMessage(studentId: string, body: string): Promise<Result<{ message: ChatMsg }>> {
  const ctx = await access(studentId);
  if (!ctx) return { ok: false, error: "Ruxsat yo'q" };
  const text = body.trim().slice(0, 1000);
  if (!text) return { ok: false, error: "Xabar bo'sh" };

  // Spamdan himoya: bir foydalanuvchi minutiga 20 tadan ko'p yubora olmaydi
  const recent = await prisma.chatMessage.count({ where: { authorId: ctx.user.id, createdAt: { gt: new Date(Date.now() - 60_000) } } });
  if (recent >= 20) return { ok: false, error: "Juda tez yozyapsiz, biroz kuting" };

  const m = await prisma.chatMessage.create({ data: { studentId, authorId: ctx.user.id, authorRole: ctx.side, authorName: ctx.user.name, body: text } });
  return { ok: true, message: toMsg(m) };
}
