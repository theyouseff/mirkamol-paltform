import { buyer } from "@/lib/buyer";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cancelOrder, markOrderPaid } from "@/lib/actions/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmButton } from "@/components/ConfirmButton";

const filters = [
  { value: "", label: "Hammasi" },
  { value: "PAID", label: "To'langan" },
  { value: "PENDING", label: "Kutilmoqda" },
  { value: "CANCELED", label: "Bekor qilingan" },
];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; author?: string }> }) {
  const { status = "", q = "", author = "" } = await searchParams;
  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
    ...(author && { course: { authorId: author } }),
    ...(q && { OR: [{ user: { name: { contains: q, mode: "insensitive" } } }, { user: { email: { contains: q, mode: "insensitive" } } }, { buyerName: { contains: q, mode: "insensitive" } }, { buyerEmail: { contains: q, mode: "insensitive" } }] }),
  };
  const [orders, authors] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { name: true, email: true } }, course: { include: { author: true } } },
    }),
    prisma.author.findMany({ orderBy: { name: "asc" } }),
  ]);
  const paidSum = orders.filter((o) => o.status === "PAID").reduce((s, o) => s + o.amount, 0);
  const link = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(status && { status }), ...(author && { author }), ...(q && { q }), ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/admin/orders${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-bold">To&apos;lovlar</h1>
        <p className="text-sm text-gold-text/80">Ko&apos;rsatilgan to&apos;langanlar: <b className="text-gold-text">{formatPrice(paidSum)}</b></p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <Link key={f.value} href={link({ status: f.value })}
            className={`rounded-full px-3 py-1.5 text-sm ${status === f.value ? "gold-gloss relative isolate" : "border border-zinc-200 bg-white text-zinc-600"}`}>
            {f.label}
          </Link>
        ))}
        <form className="ml-auto flex gap-2 max-sm:ml-0 max-sm:w-full max-sm:flex-wrap">
          {status && <input type="hidden" name="status" value={status} />}
          <select name="author" defaultValue={author} className="input w-48 max-sm:w-full">
            <option value="">Barcha mualliflar</option>
            {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input name="q" defaultValue={q} className="input w-56 max-sm:w-full" placeholder="Ism yoki email" />
          <button className="btn-outline">Filtr</button>
        </form>
      </div>

      <div className="card overflow-x-auto p-0 max-lg:hidden">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3">№</th><th>Mijoz</th><th>Kurs</th><th>Summa</th><th>Holat</th><th>Manba / izoh</th><th>Sana</th><th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-zinc-100 align-top">
                <td className="px-4 py-3">{o.number}</td>
                <td>{buyer(o).name}<div className="text-xs text-zinc-400">{buyer(o).email}</div></td>
                <td>
                  {o.course.title}
                  {o.course.author && <div className="text-xs text-zinc-400">{o.course.author.name}</div>}
                </td>
                <td>{formatPrice(o.amount)}</td>
                <td><StatusBadge status={o.status} />{o.provider && <div className="text-xs text-zinc-400">{o.provider}</div>}</td>
                <td className="text-zinc-500">{o.utmSource || "—"}{o.note && <div className="text-xs text-zinc-400">{o.note}</div>}</td>
                <td className="text-zinc-500">{formatDate(o.createdAt)}</td>
                <td className="pr-4">
                  {o.status === "PENDING" && (
                    <form className="flex justify-end gap-1">
                      <input type="hidden" name="id" value={o.id} />
                      <ConfirmButton formAction={markOrderPaid} className="btn-outline px-2 py-1 text-xs" message="Buyurtmani to'langan deb belgilab, kursni ochasizmi?">✓ To&apos;landi</ConfirmButton>
                      <ConfirmButton formAction={cancelOrder} className="btn-danger px-2 py-1 text-xs" message="Buyurtmani bekor qilasizmi?">✕</ConfirmButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-6 text-center text-zinc-500">To&apos;lovlar topilmadi</p>}
      </div>

      {/* Telefon va planshet: jadval o'rniga kartochkalar */}
      <div className="space-y-3 lg:hidden">
        {orders.map((o) => (
          <div key={o.id} className="card space-y-2 p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">№{o.number} · {buyer(o).name}</p>
                <p className="truncate text-xs text-zinc-400">{buyer(o).email}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate">{o.course.title}</p>
                {o.course.author && <p className="text-xs text-zinc-400">{o.course.author.name}</p>}
              </div>
              <p className="shrink-0 font-semibold">{formatPrice(o.amount)}</p>
            </div>
            <p className="text-xs text-zinc-500">
              {formatDate(o.createdAt)}{o.provider && ` · ${o.provider}`}{o.utmSource && ` · ${o.utmSource}`}
              {o.note && <span className="block text-zinc-400">{o.note}</span>}
            </p>
            {o.status === "PENDING" && (
              <form className="flex gap-2 pt-1">
                <input type="hidden" name="id" value={o.id} />
                <ConfirmButton formAction={markOrderPaid} className="btn-outline flex-1 px-2 py-2 text-xs" message="Buyurtmani to'langan deb belgilab, kursni ochasizmi?">✓ To&apos;landi</ConfirmButton>
                <ConfirmButton formAction={cancelOrder} className="btn-danger px-4 py-2 text-xs" message="Buyurtmani bekor qilasizmi?">✕</ConfirmButton>
              </form>
            )}
          </div>
        ))}
        {orders.length === 0 && <p className="card text-center text-zinc-500">To&apos;lovlar topilmadi</p>}
      </div>
    </div>
  );
}
