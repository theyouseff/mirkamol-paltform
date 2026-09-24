import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-white/10 bg-ink-950/60 p-4 backdrop-blur-md lg:min-h-screen lg:border-r lg:border-b-0">
        <Link href="/" className="mb-4 block px-3 text-lg font-bold text-gold-text">TeachUmma</Link>
        <AdminNav />
        <div className="mt-6 hidden border-t border-white/10 px-3 pt-4 text-sm text-gold-text/70 lg:block">
          <p>{admin.name}</p>
          <form action={logout}><button className="mt-1 text-gold-text/60 hover:text-gold-text">Chiqish</button></form>
        </div>
      </aside>
      <main className="p-4 sm:p-8">{children}</main>
    </div>
  );
}
