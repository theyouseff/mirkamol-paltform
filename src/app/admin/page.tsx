import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default async function AdminDashboard() {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [revenue, revenue30, paidCount, pendingCount, students, recent, bySource] = await Promise.all([
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.order.aggregate({ where: { status: "PAID", paidAt: { gte: since } }, _sum: { amount: true } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.order.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { user: true, tariff: { include: { course: true } } } }),
    prisma.order.groupBy({ by: ["utmSource"], where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
  ]);
  const total = paidCount + pendingCount;

  const stats = [
    { label: "Umumiy daromad", value: formatPrice(revenue._sum.amount ?? 0) },
    { label: "Oxirgi 30 kun", value: formatPrice(revenue30._sum.amount ?? 0) },
    { label: "To'langan buyurtmalar", value: paidCount },
    { label: "Konversiya (buyurtma → to'lov)", value: total ? `${Math.round((paidCount / total) * 100)}%` : "—" },
    { label: "O'quvchilar", value: students },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">So&apos;nggi buyurtmalar</h2>
            <Link href="/admin/orders" className="text-sm text-brand">Hammasi →</Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-t border-zinc-100">
                  <td className="py-2.5">№{o.number}</td>
                  <td>{o.user.name}</td>
                  <td className="text-zinc-500">{o.tariff.course.title} · {o.tariff.name}</td>
                  <td>{formatPrice(o.amount)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-zinc-400">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && <p className="text-sm text-zinc-500">Hali buyurtmalar yo&apos;q</p>}
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Manbalar bo&apos;yicha (UTM)</h2>
          <ul className="space-y-2 text-sm">
            {bySource.sort((a, b) => (b._sum.amount ?? 0) - (a._sum.amount ?? 0)).map((s) => (
              <li key={s.utmSource} className="flex justify-between">
                <span>{s.utmSource || "To'g'ridan-to'g'ri"} <span className="text-zinc-400">({s._count})</span></span>
                <span className="font-medium">{formatPrice(s._sum.amount ?? 0)}</span>
              </li>
            ))}
          </ul>
          {bySource.length === 0 && <p className="text-sm text-zinc-500">Ma&apos;lumot yo&apos;q</p>}
        </div>
      </div>
    </div>
  );
}
