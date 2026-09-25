import Link from "next/link";
import { requireCurator } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

// Kurator paneli: o'quvchi kabineti ham, admin paneli ham emas — alohida oyna.
export default async function CuratorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurator();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gold-text">ilmaviya</span>
            <span className="badge bg-gold/20 text-gold-text ring-1 ring-gold/40">Kurator paneli</span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/curator" className="btn text-gold-text/85 hover:text-gold-text">Analitika</Link>
            <Link href="/curator/settings" className="btn text-gold-text/85 hover:text-gold-text">Parol</Link>
            <span className="hidden px-2 text-gold-text/60 sm:inline">{user.name}</span>
            <form action={logout}><button className="btn-outline px-3 py-1.5">Chiqish</button></form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
    </div>
  );
}
