import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { homeFor } from "@/lib/roles";
import { isAppUserAgent } from "@/lib/app-mode";

export async function middleware(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname, search } = req.nextUrl;

  // "/" va "/login" statik sahifalar (tezkor). Kirgan foydalanuvchi bu yerda turmaydi — o'z oynasiga o'tadi.
  if (pathname === "/" || pathname === "/login") {
    if (session) return NextResponse.redirect(new URL(homeFor(session.role), req.url));
    return NextResponse.next();
  }

  // Kurslar katalogi va sotuv sahifalari — mehmonga faqat saytda; ilovada kirmagan foydalanuvchi kirish oynasiga o'tadi
  // (App Store: ilova ichida tashqi to'lov/sotuvga yo'naltirib bo'lmaydi)
  if (pathname === "/courses" || pathname.startsWith("/courses/")) {
    if (!session && isAppUserAgent(req.headers.get("user-agent"))) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  // Admin paneli — faqat admin (kurator o'z paneliga, o'quvchi kurslarga qaytariladi)
  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL(homeFor(session.role), req.url));
  }
  // Kurator paneli — kurator (va ko'rish uchun admin)
  if (pathname.startsWith("/curator") && session.role !== "CURATOR" && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/courses", req.url));
  }
  // Kurator o'quvchi kabinetiga tushmaydi
  if (session.role === "CURATOR" && (pathname === "/cabinet" || pathname.startsWith("/cabinet/"))) {
    return NextResponse.redirect(new URL("/curator", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/login", "/courses", "/courses/:path*", "/cabinet/:path*", "/admin/:path*", "/curator/:path*"] };
