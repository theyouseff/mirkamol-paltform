import { prisma } from "./db";
import { tashkentDay } from "./format";

// Foydalanuvchi bugun platformaga kirganini belgilaydi (kuniga bir marta; takror chaqirilsa zarar yo'q).
export async function recordVisit(userId: string) {
  try {
    await prisma.loginDay.createMany({ data: [{ userId, day: tashkentDay() }], skipDuplicates: true });
  } catch {
    // Kalendar uchun yordamchi yozuv: xato bo'lsa sahifani to'xtatmaymiz
  }
}
