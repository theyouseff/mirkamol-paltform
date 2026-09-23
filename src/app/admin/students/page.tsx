import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { setUserRole } from "@/lib/actions/admin";
import { formatDate, formatPhone } from "@/lib/format";
import { GrantAccessForm } from "@/components/admin/GrantAccessForm";
import { SubmitButton } from "@/components/SubmitButton";

const roles = { STUDENT: "O'quvchi", CURATOR: "Kurator", ADMIN: "Admin" } as const;

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await requireAdmin();
  const { q = "" } = await searchParams;
  const digits = q.replace(/\D/g, "");
  const where: Prisma.UserWhereInput = q
    ? { OR: [{ name: { contains: q } }, ...(digits ? [{ phone: { contains: digits } }] : [])] }
    : {};

  const [users, tariffs] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { enrollments: { include: { course: true, tariff: true } }, _count: { select: { progress: true } } },
    }),
    prisma.tariff.findMany({ include: { course: true }, orderBy: [{ courseId: "asc" }, { level: "asc" }] }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">O&apos;quvchilar</h1>
      <GrantAccessForm tariffs={tariffs.map((t) => ({ id: t.id, label: `${t.course.title} — ${t.name}` }))} />

      <form>
        <input name="q" defaultValue={q} className="input max-w-sm" placeholder="Ism yoki telefon bo'yicha qidirish" />
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr><th className="px-4 py-3">Ism</th><th>Telefon</th><th>Kurslar</th><th>Tugatilgan darslar</th><th>Ro&apos;yxatdan o&apos;tgan</th><th>Rol</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-zinc-100">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td>{formatPhone(u.phone)}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {u.enrollments.map((e) => <span key={e.id} className="badge bg-brand-soft text-brand">{e.course.title} · {e.tariff.name}</span>)}
                    {u.enrollments.length === 0 && <span className="text-zinc-400">—</span>}
                  </div>
                </td>
                <td>{u._count.progress}</td>
                <td className="text-zinc-500">{formatDate(u.createdAt)}</td>
                <td className="pr-4">
                  {u.id === admin.id ? (
                    <span className="text-zinc-500">{roles[u.role as keyof typeof roles]}</span>
                  ) : (
                    <form action={setUserRole} className="flex gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} className="input py-1.5">
                        {Object.entries(roles).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <SubmitButton className="btn-outline px-2 py-1 text-xs">OK</SubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-6 text-center text-zinc-500">Topilmadi</p>}
      </div>
    </div>
  );
}
