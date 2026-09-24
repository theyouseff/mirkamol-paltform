import { prisma } from "./db";
import { tashkentDay } from "./format";

// Kirgan kunlar yozuvi shu kundan boshlangan: undan oldingi kunlarni "kirmagan" deb bo'lmaydi.
const TRACKING_START = "2026-09-24";

// Kalendarda "kirmagan kun" (qizil) hisoblanadigan birinchi kun: akkaunt ochilgan kun yoki yozuv boshlangan kun (qaysi biri keyin bo'lsa).
export function missedFrom(createdAt: Date) {
  const created = tashkentDay(createdAt);
  return created > TRACKING_START ? created : TRACKING_START;
}

// Foydalanuvchi bugun platformaga kirganini belgilaydi (kuniga bir marta; takror chaqirilsa zarar yo'q).
export async function recordVisit(userId: string) {
  try {
    await prisma.loginDay.createMany({ data: [{ userId, day: tashkentDay() }], skipDuplicates: true });
  } catch {
    // Kalendar uchun yordamchi yozuv: xato bo'lsa sahifani to'xtatmaymiz
  }
}
