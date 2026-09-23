import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-brand">Akademiya</Link>
        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              {user.role === "ADMIN" && <Link href="/admin" className="btn-outline">Admin panel</Link>}
              <Link href="/cabinet" className="btn-primary">Kabinet</Link>
              <form action={logout}><button className="btn text-zinc-500 hover:text-zinc-900">Chiqish</button></form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-outline">Kirish</Link>
              <Link href="/register" className="btn-primary">Ro&apos;yxatdan o&apos;tish</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
