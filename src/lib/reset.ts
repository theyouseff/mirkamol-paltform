import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./db";

export const RESET_TTL_MS = 60 * 60_000; // parolni tiklash havolasi: 1 soat
export const INVITE_TTL_MS = 7 * 24 * 60 * 60_000; // yangi o'quvchi taklifi: 7 kun

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Amal qilib turgan (muddati o'tmagan) tiklash havolasi
export async function findValidReset(token: string) {
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  return reset && reset.expiresAt > new Date() ? reset : null;
}

// Bir martalik havola tokeni: bazada faqat xeshi saqlanadi, egasining eski tokenlari o'chadi.
export async function createResetToken(userId: string, ttlMs: number) {
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordReset.deleteMany({ where: { userId } });
  await prisma.passwordReset.create({ data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlMs) } });
  return token;
}
