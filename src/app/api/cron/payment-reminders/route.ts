import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { addDays, tashkentDay } from "@/lib/format";
import { remindOrder } from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Har kuni ertalab (vercel.json): to'lov muddati bugun (yoki o'tib ketgan, lekin eslatma hali ketmagan) Kutilmoqda to'lovlar egasiga
// emailga eslatma yuboradi. Faqat Vercel Cron chaqiradi: CRON_SECRET env orqali himoyalangan.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // Doimiy vaqtli taqqoslash: javob vaqtidan kalitni harfma-harf topib bo'lmasin
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (!secret || given.length !== want.length || !timingSafeEqual(given, want)) return new Response("Ruxsat yo'q", { status: 401 });

  const today = tashkentDay();
  const due = await prisma.order.findMany({
    // Juda eski muddatlarga (7 kundan oshgan) eslatma yuborilmaydi
    where: { status: "PENDING", reminderSentAt: null, dueDay: { not: null, lte: today, gte: addDays(today, -7) } },
    select: { id: true },
    take: 200,
  });
  let sent = 0;
  const errors: string[] = [];
  for (const o of due) {
    const r = await remindOrder(o.id);
    if (r.ok) sent += 1;
    else if (r.error) errors.push(r.error);
  }
  return Response.json({ day: today, due: due.length, sent, errors: [...new Set(errors)] });
}
