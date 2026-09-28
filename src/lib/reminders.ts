import { prisma } from "./db";
import { formatPrice } from "./format";
import { adminContactUrl } from "./config";
import { mailConfigured, sendPaymentReminder } from "./mail";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
// "2026-10-15" -> "15 oktabr 2026"
export const dueLabel = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return `${d} ${MONTHS[m - 1] ?? ""} ${y}`;
};

// Bitta to'lov uchun eslatma yuboradi va belgilaydi. Yuborilgan bo'lsa true.
export async function remindOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  if (!mailConfigured()) return { ok: false, error: "Email yuborish sozlanmagan (SMTP)" };
  const o = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, amount: true, dueDay: true, buyerName: true, buyerEmail: true, user: { select: { name: true, email: true } }, course: { select: { title: true } } },
  });
  if (!o || o.status !== "PENDING") return { ok: false, error: "To'lov kutilmoqda holatida emas" };
  const email = o.user?.email ?? o.buyerEmail;
  if (!email) return { ok: false, error: "O'quvchining emaili yo'q" };
  const res = await sendPaymentReminder(email, o.user?.name ?? (o.buyerName || "o'quvchi"), o.course.title, formatPrice(o.amount), o.dueDay ? dueLabel(o.dueDay) : "bugun", adminContactUrl);
  if (!res.sent) return { ok: false, error: res.reason ?? "Yuborib bo'lmadi" };
  await prisma.order.update({ where: { id: o.id }, data: { reminderSentAt: new Date() } });
  return { ok: true };
}
