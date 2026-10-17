import { cache } from "react";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { SESSION_COOKIE, sessionDays, signSession, verifySession } from "./session";
import { homeFor, isStaff } from "./roles";

// Parol xeshining qisqa izi. Parol o'zgarsa iz ham o'zgaradi va eski sessiyalar yaroqsiz bo'ladi.
const passwordVersion = (passwordHash: string) => createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);

// deviceId — o'quvchi uchun majburiy (qurilmalar limiti, src/lib/devices.ts); admin va kurator uchun ishlatilmaydi.
export async function createSession(user: { id: string; role: string; passwordHash: string }, deviceId?: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession({ userId: user.id, role: user.role, pv: passwordVersion(user.passwordHash), ...(deviceId ? { did: deviceId } : {}) }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * sessionDays(user.role),
  });
}

export async function getSession() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

const DEVICE_SEEN_THROTTLE_MS = 5 * 60_000;

// Sessiyani tekshiradi. O'quvchi uchun qurilma ham tekshiriladi: qurilmasi chiqarilgan (boshqa qurilma kirgan yoki admin tozalagan)
// yoki qurilmasiz eski sessiya bo'lsa — kirish yo'q. cache(): bir so'rov ichida (layout + sahifa) bazaga faqat bir marta murojaat qilinadi.
const resolveAuth = cache(async () => {
  const session = await getSession();
  if (!session) return { user: null, deviceId: null, kicked: false };
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || session.pv !== passwordVersion(user.passwordHash)) return { user: null, deviceId: null, kicked: false };
  if (user.role !== "STUDENT") return { user, deviceId: null, kicked: false };

  if (!session.did) return { user: null, deviceId: null, kicked: false }; // qurilmalar limitidan oldingi sessiya — qayta kirsin
  const device = await prisma.device.findUnique({ where: { id: session.did }, select: { userId: true, revokedAt: true, lastSeenAt: true } });
  if (!device || device.userId !== user.id || device.revokedAt) return { user: null, deviceId: null, kicked: !!device?.revokedAt };
  if (Date.now() - device.lastSeenAt.getTime() > DEVICE_SEEN_THROTTLE_MS) {
    await prisma.device.update({ where: { id: session.did }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  return { user, deviceId: session.did, kicked: false };
});

export const getCurrentUser = cache(async () => (await resolveAuth()).user);

// O'quvchining joriy qurilmasi (admin/kurator uchun null)
export const getCurrentDeviceId = cache(async () => (await resolveAuth()).deviceId);

export async function requireUser() {
  const { user, kicked } = await resolveAuth();
  if (!user) {
    // Yaroqsiz sessiya (parol o'zgargan, akkaunt o'chirilgan yoki qurilmadan chiqarilgan) bo'lsa — avval cookie tozalanadi,
    // aks holda middleware "kirgan" deb /login dan qaytarib, cheksiz aylanish bo'ladi.
    redirect((await getSession()) ? (kicked ? "/api/session/clear?r=device" : "/api/session/clear") : "/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect(homeFor(user.role));
  return user;
}

// Kurator paneli: kurator (ko'rish uchun admin ham)
export async function requireCurator() {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect("/courses");
  return user;
}
