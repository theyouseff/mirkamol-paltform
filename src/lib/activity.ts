import { prisma } from "./db";
import { tashkentDay } from "./format";

// Kirgan kunlar yozuvi shu kundan boshlangan: undan oldingi kunlarni "kirmagan" deb bo'lmaydi.
const TRACKING_START = "2026-09-24";

// Kalendarda "kirmagan kun" (qizil) hisoblanadigan birinchi kun: akkaunt ochilgan kun yoki yozuv boshlangan kun (qaysi biri keyin bo'lsa).
export function missedFrom(createdAt: Date) {
  const created = tashkentDay(createdAt);
  return created > TRACKING_START ? created : TRACKING_START;
}

// "Online" — oxirgi 2 daqiqada faol (sahifa ochgan yoki video ko'rgan). "Kirish" — 10 daqiqadan ortiq nofaollikdan keyingi birinchi faollik.
export const ONLINE_MS = 2 * 60_000;
// "Tomosha qilyapti" — video ijro etilayotganda brauzer 15 soniyada bir uradi; 45 soniya jim bo'lsa (yopilgan/pauza) holat o'chadi.
export const WATCHING_MS = 45_000;
const ENTRY_GAP_MS = 10 * 60_000;
const SEEN_THROTTLE_MS = 45_000;

// O'quvchining faolligini belgilaydi (sahifa ochilganda va video ko'rilayotganda). Uzoq tanaffusdan keyin — "kirdi" yozuvi ham yaratiladi.
export async function markSeen(userId: string) {
  try {
    const now = Date.now();
    // Uzoq tanaffusdan keyingi birinchi faollik: bitta so'rov yutadi (parallel sahifalar ikki marta "kirdi" qo'shmaydi)
    const entered = await prisma.user.updateMany({
      where: { id: userId, role: "STUDENT", OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: new Date(now - ENTRY_GAP_MS) } }] },
      data: { lastSeenAt: new Date(now) },
    });
    if (entered.count > 0) {
      await prisma.platformEntry.create({ data: { userId } });
      return;
    }
    await prisma.user.updateMany({ where: { id: userId, lastSeenAt: { lt: new Date(now - SEEN_THROTTLE_MS) } }, data: { lastSeenAt: new Date(now) } });
  } catch {
    // Yordamchi yozuv: xato bo'lsa sahifani to'xtatmaymiz
  }
}

// Foydalanuvchi bugun platformaga kirganini belgilaydi (kuniga bir marta; takror chaqirilsa zarar yo'q).
export async function recordVisit(userId: string) {
  try {
    await prisma.loginDay.createMany({ data: [{ userId, day: tashkentDay() }], skipDuplicates: true });
    await markSeen(userId);
  } catch {
    // Kalendar uchun yordamchi yozuv: xato bo'lsa sahifani to'xtatmaymiz
  }
}
