import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { HeaderNav } from "./HeaderNav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-brand">Akademiya</Link>
        <nav className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              <HeaderNav isAdmin={user.role === "ADMIN"} />
              <form action={logout}><button className="btn text-zinc-500 hover:text-zinc-900">Chiqish</button></form>
            </>
          ) : (
            <>
              <Link href="/courses" className="btn text-zinc-600 hover:text-zinc-900">Kurslar</Link>
              <Link href="/login" className="btn-primary">Kirish</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
