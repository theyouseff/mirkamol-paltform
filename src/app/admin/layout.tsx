import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-white/10 bg-ink-950/60 p-4 backdrop-blur-md lg:min-h-screen lg:border-r lg:border-b-0">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="block px-3 text-lg font-bold text-gold-text">ilmaviya</Link>
          {/* Telefonda (yon panel ko'rinmaydi) chiqish tugmasi shu yerda */}
          <LogoutButton formClassName="lg:hidden" className="btn-outline px-3 py-1.5" />
        </div>
        <AdminNav />
        <div className="mt-6 hidden border-t border-white/10 px-3 pt-4 text-sm text-gold-text/70 lg:block">
          <p>{admin.name}</p>
          <LogoutButton className="mt-1 text-gold-text/60 hover:text-gold-text" />
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}
