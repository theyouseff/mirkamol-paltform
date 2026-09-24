import { cache } from "react";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { SESSION_COOKIE, signSession, verifySession } from "./session";

// Parol xeshining qisqa izi. Parol o'zgarsa iz ham o'zgaradi va eski sessiyalar yaroqsiz bo'ladi.
const passwordVersion = (passwordHash: string) => createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);

export async function createSession(user: { id: string; role: string; passwordHash: string }) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession({ userId: user.id, role: user.role, pv: passwordVersion(user.passwordHash) }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

// cache(): bir so'rov ichida (layout + sahifa) bazaga faqat bir marta murojaat qilinadi
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || session.pv !== passwordVersion(user.passwordHash)) return null;
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    // Yaroqsiz sessiya (parol o'zgargan yoki akkaunt o'chirilgan) bo'lsa — avval cookie tozalanadi,
    // aks holda middleware "kirgan" deb /login dan qaytarib, cheksiz aylanish bo'ladi.
    redirect((await getSession()) ? "/api/session/clear" : "/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/cabinet");
  return user;
}
