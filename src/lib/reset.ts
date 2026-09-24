import { createHash } from "node:crypto";
import { prisma } from "./db";

export const RESET_TTL_MS = 60 * 60_000;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Amal qilib turgan (muddati o'tmagan) tiklash havolasi
export async function findValidReset(token: string) {
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  return reset && reset.expiresAt > new Date() ? reset : null;
}
