// Edge (middleware) va server'da ishlaydigan JWT sessiya — Prisma'siz.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

export type Session = { userId: string; role: string };

export async function signSession(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.userId as string, role: payload.role as string };
  } catch {
    return null;
  }
}
