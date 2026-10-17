import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Yaroqsiz sessiya cookie'sini tozalab, kirish sahifasiga yuboradi. ?r=device — boshqa qurilma kirgani uchun chiqarilgan (kirish sahifasida xabar chiqadi).
export function GET(req: NextRequest) {
  const url = new URL("/login", req.url);
  if (req.nextUrl.searchParams.get("r") === "device") url.searchParams.set("r", "device");
  const res = NextResponse.redirect(url);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
