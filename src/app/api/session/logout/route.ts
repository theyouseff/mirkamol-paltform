import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Chiqish: bazaga murojaat qilmaydi — cookie'ni o'chirib, darhol bosh sahifaga yuboradi (server action'dan tezroq).
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url));
  // Boshqa saytdan yashirincha chaqirib, foydalanuvchini chiqarib yuborishning oldini olamiz
  if (req.headers.get("sec-fetch-site") !== "cross-site") res.cookies.delete(SESSION_COOKIE);
  return res;
}
