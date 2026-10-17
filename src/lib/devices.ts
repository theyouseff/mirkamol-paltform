import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "./db";
import { formatCode, generateCode, hashCode, normalizeCode } from "./reset";

// Akkauntni boshqalarga berishni cheklash. O'quvchi bir vaqtda ko'pi bilan DEVICE_LIMIT ta qurilmada (brauzerda) kirgan bo'ladi.
// Limitdan ortiq yangi qurilmadan kirsa — emailiga kod ketadi; kod kiritilsa eng uzoq ishlatilmagan qurilmadan chiqariladi.
// SWAP_WINDOW_MS ichida SWAP_LIMIT martadan ko'p almashtirilsa — faqat admin qurilmalarni tozalab ochadi.
export const DEVICE_LIMIT = 2;
export const SWAP_LIMIT = 3;
export const SWAP_WINDOW_MS = 30 * 24 * 3600_000;
export const DEVICE_CODE_TTL_MS = 15 * 60_000;

// Brauzerdagi qurilma kaliti: tasodifiy, faqat server o'qiydi (httpOnly), ~1 yil. Bazada faqat xeshi.
const DEVICE_COOKIE = "device";
const tokenHash = (token: string) => createHash("sha256").update(`device:${token}`).digest("hex");

// "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 ...) ... Safari/604.1" -> "iPhone · Safari"
export function deviceLabel(ua: string) {
  const os = /iPad/.test(ua)
    ? "iPad"
    : /iPhone/.test(ua)
      ? "iPhone"
      : /Android/.test(ua)
        ? (ua.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build|\))/)?.[1]?.trim() || "Android")
        : /Windows/.test(ua)
          ? "Windows"
          : /Macintosh|Mac OS X/.test(ua)
            ? "Mac"
            : /CrOS/.test(ua)
              ? "Chromebook"
              : /Linux/.test(ua)
                ? "Linux"
                : "Noma'lum qurilma";
  const browser = /IlmaviyaApp/.test(ua)
    ? "ilova"
    : /Telegram/i.test(ua)
    ? "Telegram"
    : /Instagram/.test(ua)
      ? "Instagram"
      : /YaBrowser/.test(ua)
        ? "Yandex"
        : /Edg\//.test(ua)
          ? "Edge"
          : /OPR\/|Opera/.test(ua)
            ? "Opera"
            : /Firefox|FxiOS/.test(ua)
              ? "Firefox"
              : /Chrome|CriOS/.test(ua)
                ? "Chrome"
                : /Safari/.test(ua)
                  ? "Safari"
                  : "";
  return browser ? `${os} · ${browser}` : os;
}

async function requestInfo() {
  const h = await headers();
  const ua = (h.get("user-agent") ?? "").slice(0, 400);
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim().slice(0, 64);
  const dec = (v: string | null) => {
    try {
      return v ? decodeURIComponent(v) : "";
    } catch {
      return v ?? "";
    }
  };
  const place = [dec(h.get("x-vercel-ip-city")), h.get("x-vercel-ip-country") ?? ""].filter(Boolean).join(", ").slice(0, 80);
  return { userAgent: ua, label: deviceLabel(ua), ip, place };
}

// Brauzerning qurilma kaliti (bo'lmasa yangisi yaratilib cookie'ga yoziladi). Faqat server action / route handler ichida chaqiriladi.
async function deviceToken() {
  const store = await cookies();
  let token = store.get(DEVICE_COOKIE)?.value;
  if (!token || token.length < 32) {
    token = randomBytes(32).toString("base64url");
    store.set(DEVICE_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 400 * 24 * 3600 });
  }
  return token;
}

// Oxirgi 30 kunda (admin tozalagandan beri) nechta qurilma almashtirilgan
export async function swapsUsed(userId: string, resetAt: Date | null) {
  const since = new Date(Math.max(Date.now() - SWAP_WINDOW_MS, resetAt?.getTime() ?? 0));
  return prisma.device.count({ where: { userId, revokeReason: "replaced", revokedAt: { gte: since } } });
}

export type Admission = { ok: true; deviceId: string } | { ok: false; reason: "code" | "blocked" };

// Kirish paytida: shu brauzer o'quvchining faol qurilmasimi, joy bormi, yoki tasdiq (kod) kerakmi.
// replace=true — egasi tasdiqlagan (emailga kelgan kod): limit to'lgan bo'lsa eng uzoq ishlatilmagan qurilma chiqariladi.
export async function admitDevice(user: { id: string; deviceResetAt: Date | null }, replace = false): Promise<Admission> {
  const hash = tokenHash(await deviceToken());
  const info = await requestInfo();
  const now = new Date();

  const known = await prisma.device.findFirst({ where: { userId: user.id, tokenHash: hash, revokedAt: null }, select: { id: true } });
  if (known) {
    await prisma.device.update({ where: { id: known.id }, data: { ...info, lastSeenAt: now } });
    return { ok: true, deviceId: known.id };
  }

  const active = await prisma.device.findMany({ where: { userId: user.id, revokedAt: null }, orderBy: { lastSeenAt: "asc" }, select: { id: true } });
  if (active.length >= DEVICE_LIMIT) {
    if ((await swapsUsed(user.id, user.deviceResetAt)) >= SWAP_LIMIT) return { ok: false, reason: "blocked" };
    if (!replace) return { ok: false, reason: "code" };
    const extra = active.slice(0, active.length - DEVICE_LIMIT + 1).map((d) => d.id);
    await prisma.device.updateMany({ where: { id: { in: extra } }, data: { revokedAt: now, revokeReason: "replaced" } });
  }
  const device = await prisma.device.create({ data: { userId: user.id, tokenHash: hash, ...info, lastSeenAt: now }, select: { id: true } });
  return { ok: true, deviceId: device.id };
}

// Yangi qurilma kodi ("K7QM-4XPD"): egasining eski kodlari o'chadi.
export async function createDeviceCode(userId: string) {
  const raw = generateCode();
  await prisma.deviceCode.deleteMany({ where: { userId } });
  await prisma.deviceCode.create({ data: { userId, tokenHash: hashCode(userId, `dev:${raw}`), expiresAt: new Date(Date.now() + DEVICE_CODE_TTL_MS) } });
  return { code: formatCode(raw), label: (await requestInfo()).label };
}

// Kod to'g'ri va muddati o'tmagan bo'lsa — true (bir martalik: ishlatilgach o'chadi).
export async function consumeDeviceCode(userId: string, code: string) {
  if (normalizeCode(code).length !== 8) return false;
  const row = await prisma.deviceCode.findUnique({ where: { tokenHash: hashCode(userId, `dev:${normalizeCode(code)}`) } });
  if (!row || row.userId !== userId || row.expiresAt < new Date()) return false;
  await prisma.deviceCode.deleteMany({ where: { userId } });
  return true;
}
