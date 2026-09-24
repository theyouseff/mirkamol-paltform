import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { HeaderNav } from "./HeaderNav";

export async function SiteHeader() {
  const user = await getSession(); // bazaga bormaydi — rol sessiyaning o'zida
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/60 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-gold-text">Ilmaviya</Link>
        <nav className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              <HeaderNav isAdmin={user.role === "ADMIN"} />
              <form action={logout}><button className="btn text-gold-text/70 hover:text-gold-text">Chiqish</button></form>
            </>
          ) : (
            <>
              <Link href="/courses" className="btn text-gold-text/85 hover:text-gold-text">Kurslar</Link>
              <Link href="/login" className="btn-gold">Kirish</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
