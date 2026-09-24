import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { callCenterUrl } from "@/lib/config";
import { HeaderNav } from "./HeaderNav";

// Menyuning o'ng chetidagi yaltiroq tilla "Call - Centre". Raqam kiritilgan bo'lsa, bosilganda qo'ng'iroq boshlanadi (tel:).
const CallCentre = () => {
  const cls = "btn ml-1 gold-text-gloss px-2 text-sm font-semibold sm:ml-4 sm:px-3 sm:text-base";
  return callCenterUrl ? (
    <a href={callCenterUrl} className={`${cls} transition hover:brightness-110`}>Call - Centre</a>
  ) : (
    <span className={`${cls} cursor-default`}>Call - Centre</span>
  );
};

export async function SiteHeader() {
  const user = await getSession(); // bazaga bormaydi — rol sessiyaning o'zida
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/60 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-gold-text">ilmaviya</Link>
        <nav className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              <HeaderNav isAdmin={user.role === "ADMIN"} />
              <form action={logout}><button className="btn text-gold-text/70 hover:text-gold-text">Chiqish</button></form>
              <CallCentre />
            </>
          ) : (
            <>
              <Link href="/courses" className="btn text-gold-text/85 hover:text-gold-text">Kurslar</Link>
              <Link href="/login" className="btn-gold">Kirish</Link>
              <CallCentre />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
