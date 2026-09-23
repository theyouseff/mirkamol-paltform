import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="border-b border-zinc-200 bg-white p-4 lg:min-h-screen lg:border-r lg:border-b-0">
        <Link href="/" className="mb-4 block px-3 text-lg font-bold text-brand">Akademiya</Link>
        <AdminNav />
        <div className="mt-6 hidden border-t border-zinc-100 px-3 pt-4 text-sm text-zinc-500 lg:block">
          <p>{admin.name}</p>
          <form action={logout}><button className="mt-1 text-zinc-400 hover:text-zinc-700">Chiqish</button></form>
        </div>
      </aside>
      <main className="p-4 sm:p-8">{children}</main>
    </div>
  );
}
