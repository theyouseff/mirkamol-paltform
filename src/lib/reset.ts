import { createHash, randomInt } from "node:crypto";
import { prisma } from "./db";

export const RESET_TTL_MS = 60 * 60_000; // parolni tiklash kodi: 1 soat
export const INVITE_TTL_MS = 7 * 24 * 60 * 60_000; // yangi o'quvchi kodi: 7 kun

// O'xshash belgilarsiz (0/O, 1/I/L): kodni xatdan ko'chirish yoki yozishda adashilmasin. 31 belgi, 8 ta joy.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// "k7qm 4xpd" -> "K7QM4XPD"
export const normalizeCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

// Bazada faqat xesh saqlanadi; xesh egasiga bog'langan (boshqa odamning kodi bilan kirib bo'lmaydi).
const hashCode = (userId: string, code: string) => createHash("sha256").update(`${userId}:${normalizeCode(code)}`).digest("hex");

// Bir martalik kod: "K7QM-4XPD". Egasining eski kodlari o'chadi.
export async function createResetCode(userId: string, ttlMs: number) {
  const raw = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  await prisma.passwordReset.deleteMany({ where: { userId } });
  await prisma.passwordReset.create({ data: { userId, tokenHash: hashCode(userId, raw), expiresAt: new Date(Date.now() + ttlMs) } });
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

// Email va kod mos, muddati o'tmagan bo'lsa — foydalanuvchini qaytaradi.
export async function verifyResetCode(email: string, code: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || normalizeCode(code).length !== 8) return null;
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash: hashCode(user.id, code) } });
  return reset && reset.userId === user.id && reset.expiresAt > new Date() ? user : null;
}
