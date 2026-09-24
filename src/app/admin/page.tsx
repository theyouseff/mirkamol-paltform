import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ADMIN_TELEGRAM } from "@/lib/config";
import { mailConfigured } from "@/lib/mail";

export default async function AdminDashboard() {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [revenue, revenue30, paidCount, pendingCount, students, recent, bySource, paidOrders] = await Promise.all([
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.order.aggregate({ where: { status: "PAID", paidAt: { gte: since } }, _sum: { amount: true } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.order.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { user: true, tariff: { include: { course: true } } } }),
    prisma.order.groupBy({ by: ["utmSource"], where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
    prisma.order.findMany({
      where: { status: "PAID" },
      select: { amount: true, tariff: { select: { course: { select: { author: { select: { name: true } } } } } } },
    }),
  ]);
  const byAuthor = new Map<string, { count: number; sum: number }>();
  for (const o of paidOrders) {
    const name = o.tariff.course.author?.name ?? "Muallifsiz";
    const cur = byAuthor.get(name) ?? { count: 0, sum: 0 };
    byAuthor.set(name, { count: cur.count + 1, sum: cur.sum + o.amount });
  }
  const total = paidCount + pendingCount;

  // Ishga tushirish uchun hali sozlanmagan narsalar
  const todo: { title: string; hint: string }[] = [];
  if ((process.env.AUTH_SECRET ?? "").length < 16) {
    todo.push({ title: "AUTH_SECRET sozlanmagan", hint: "Vercel → Settings → Environment Variables: AUTH_SECRET = tasodifiy 64 belgi (openssl rand -hex 32). Sozlangach hamma qayta kiradi." });
  }
  if (!mailConfigured()) {
    todo.push({ title: "Email yuborish (SMTP) sozlanmagan", hint: "Parollar emailga ketmaydi va o'quvchi parolni o'zi tiklay olmaydi. Parolni shu paneldan ko'chirib yuborasiz. SMTP_* o'zgaruvchilari — .env.example da." });
  }
  if (!ADMIN_TELEGRAM) {
    todo.push({ title: "Telegram username kiritilmagan", hint: "Vercel'da NEXT_PUBLIC_ADMIN_TELEGRAM = username (@siz). Shundan keyin «Adminga yozish» tugmalari ishlaydi." });
  }

  const stats = [
    { label: "Umumiy daromad", value: formatPrice(revenue._sum.amount ?? 0) },
    { label: "Oxirgi 30 kun", value: formatPrice(revenue30._sum.amount ?? 0) },
    { label: "To'langan to'lovlar", value: paidCount },
    { label: "Konversiya (buyurtma → to'lov)", value: total ? `${Math.round((paidCount / total) * 100)}%` : "—" },
    { label: "O'quvchilar", value: students },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {todo.length > 0 && (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-400/10 p-5 text-amber-100">
          <h2 className="font-semibold">Sozlanishi kerak</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {todo.map((t) => (
              <li key={t.title}>
                <p className="font-medium">{t.title}</p>
                <p className="text-amber-100/75">{t.hint}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
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

        <div className="space-y-6">
        <div className="card">
          <h2 className="mb-4 font-semibold">Mualliflar bo&apos;yicha sotuv</h2>
          <ul className="space-y-2 text-sm">
            {[...byAuthor.entries()].sort((a, b) => b[1].sum - a[1].sum).map(([name, v]) => (
              <li key={name} className="flex justify-between">
                <span>{name} <span className="text-zinc-400">({v.count})</span></span>
                <span className="font-medium">{formatPrice(v.sum)}</span>
              </li>
            ))}
          </ul>
          {byAuthor.size === 0 && <p className="text-sm text-zinc-500">Ma&apos;lumot yo&apos;q</p>}
        </div>
        <div className="card">
          <h2 className="mb-4 font-semibold">Manbalar bo&apos;yicha</h2>
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
    </div>
  );
}
