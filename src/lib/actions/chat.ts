"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canManageStudent, curatorUnread } from "@/lib/curator-scope";
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

// Suhbat — (o'quvchi, kurator) juftligi. Kim kira oladi: o'quvchi — faqat o'zining va o'z kuratorlari bilan;
// kurator — faqat o'zining o'quvchilari bilan bo'lgan suhbatiga; admin — hammasini ko'radi (yoza olmaydi).
async function access(studentId: string, curatorId: string) {
  const user = await requireUser();
  if (user.role === "ADMIN") return { user, side: "OBSERVER" as const };
  if (user.role === "STUDENT") {
    if (user.id !== studentId) return null;
    const mine = await prisma.curatorCourse.findFirst({ where: { curatorId, course: { enrollments: { some: { userId: studentId } } } }, select: { curatorId: true } });
    return mine ? { user, side: "STUDENT" as const } : null;
  }
  if (isStaff(user.role) && user.id === curatorId && (await canManageStudent(user, studentId))) return { user, side: "STAFF" as const };
  return null;
}

// Suhbat xabarlari (after dan keyingilari). Qarshi tomon yozgan o'qilmagan xabarlar o'qilgan deb belgilanadi.
export async function fetchMessages(studentId: string, curatorId: string, after?: string): Promise<Result<{ messages: ChatMsg[] }>> {
  const ctx = await access(studentId, curatorId);
  if (!ctx) return { ok: false, error: "Ruxsat yo'q" };
  const since = after ? new Date(after) : null;
  const rows = await prisma.chatMessage.findMany({
    where: { studentId, curatorId, ...(since && !Number.isNaN(since.getTime()) ? { createdAt: { gt: since } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 300,
  });
  // Admin suhbatni faqat kuzatadi: uning ochishi xabarni "o'qildi" qilib qo'ymasligi kerak
  if (ctx.side !== "OBSERVER") {
    const other = ctx.side === "STUDENT" ? "STAFF" : "STUDENT";
    await prisma.chatMessage.updateMany({ where: { studentId, curatorId, authorRole: other, readAt: null }, data: { readAt: new Date() } });
  }
  return { ok: true, messages: rows.map(toMsg) };
}

export async function sendMessage(studentId: string, curatorId: string, body: string): Promise<Result<{ message: ChatMsg }>> {
  const ctx = await access(studentId, curatorId);
  if (!ctx) return { ok: false, error: "Ruxsat yo'q" };
  if (ctx.side === "OBSERVER") return { ok: false, error: "Admin suhbatni faqat ko'ra oladi" };
  const text = body.trim().slice(0, 1000);
  if (!text) return { ok: false, error: "Xabar bo'sh" };

  // Spamdan himoya: bir foydalanuvchi minutiga 20 tadan ko'p yubora olmaydi
  const recent = await prisma.chatMessage.count({ where: { authorId: ctx.user.id, createdAt: { gt: new Date(Date.now() - 60_000) } } });
  if (recent >= 20) return { ok: false, error: "Juda tez yozyapsiz, biroz kuting" };

  const m = await prisma.chatMessage.create({ data: { studentId, curatorId, authorId: ctx.user.id, authorRole: ctx.side, authorName: ctx.user.name, body: text } });
  return { ok: true, message: toMsg(m) };
}

// Menyudagi Chat belgisi: nechta o'quvchi yozgan (o'qilmagan). Brauzer vaqti-vaqti bilan so'raydi.
export async function unreadPeople(): Promise<number> {
  const user = await requireUser();
  return user.role === "CURATOR" ? curatorUnread(user) : 0;
}
