import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "./db";
import { getEnrollment } from "./access";

// Foydalanuvchi shu kurs faylini (check-list PDF) ola oladimi: admin, shu kursning kuratori yoki kursga yozilgan o'quvchi
export async function canOpenCourseFile(user: { id: string; role: string }, courseId: string) {
  if (user.role === "ADMIN") return true;
  if (user.role === "CURATOR") return !!(await prisma.curatorCourse.findFirst({ where: { curatorId: user.id, courseId }, select: { curatorId: true } }));
  return !!(await getEnrollment(user.id, courseId));
}

// Ilovada PDF tizim brauzerida ochiladi (Android WebView PDF ko'rsata olmaydi), u yerda sessiya cookie'si yo'q.
// Shuning uchun ruxsati tekshirilgan foydalanuvchiga faylning qisqa muddatli (5 daqiqa) imzolangan havolasi beriladi.
const TTL_MS = 5 * 60_000;
const key = () => `file-link:${process.env.AUTH_SECRET || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || ""}`;
const sign = (id: string, exp: number) => createHmac("sha256", key()).update(`${id}.${exp}`).digest("base64url");

export function fileLinkQuery(id: string) {
  const exp = Date.now() + TTL_MS;
  return `e=${exp}&t=${sign(id, exp)}`;
}

export function verifyFileToken(id: string, exp: string | null, token: string | null) {
  const e = Number(exp);
  if (!token || !Number.isFinite(e) || e < Date.now() || e > Date.now() + TTL_MS + 60_000) return false;
  const a = Buffer.from(sign(id, e));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
