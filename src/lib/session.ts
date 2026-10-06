// Edge (middleware) va server'da ishlaydigan JWT sessiya — Prisma'siz.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "session";
// AUTH_SECRET bo'sh yoki qisqa bo'lsa, kalit maxfiy baza ulanish manzilidan hosil qilinadi
// (bo'sh kalit bilan sessiya imzolab bo'lmaydi va kirish 500 xato beradi).
function getSecret() {
  const explicit = process.env.AUTH_SECRET;
  if (explicit && explicit.length >= 16) return new TextEncoder().encode(explicit);
  const fallback = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!fallback) throw new Error("AUTH_SECRET yoki DATABASE_URL sozlanmagan");
  return new TextEncoder().encode(`session-key:${fallback}`);
}

const secret = getSecret();

// pv — parol xeshining qisqa izi: parol o'zgarsa, eski sessiyalar avtomatik bekor bo'ladi.
export type Session = { userId: string; role: string; pv: string };

// Admin va kurator sessiyasi qisqa (o'g'irlangan sessiya uzoq yashamasin), o'quvchiniki — har kuni qayta kirmasligi uchun uzunroq.
export const sessionDays = (role: string) => (role === "ADMIN" || role === "CURATOR" ? 7 : 30);

export async function signSession(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${sessionDays(session.role)}d`)
    .sign(secret);
}

export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] }); // faqat HS256 (algoritm almashtirib aldash yo'q)
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") return null;
    return { userId: payload.userId, role: payload.role, pv: typeof payload.pv === "string" ? payload.pv : "" };
  } catch {
    return null;
  }
}
