import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cancelOrder, markOrderPaid } from "@/lib/actions/admin";
import { formatDate, formatPhone, formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmButton } from "@/components/ConfirmButton";

const filters = [
  { value: "", label: "Hammasi" },
  { value: "PAID", label: "To'langan" },
  { value: "PENDING", label: "Kutilmoqda" },
  { value: "CANCELED", label: "Bekor qilingan" },
];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "", q = "" } = await searchParams;
  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
    ...(q && { OR: [{ user: { name: { contains: q } } }, { user: { phone: { contains: q.replace(/\D/g, "") || q } } }] }),
  };
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true, tariff: { include: { course: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Buyurtmalar</h1>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <Link key={f.value} href={`/admin/orders${f.value ? `?status=${f.value}` : ""}`}
            className={`rounded-full px-3 py-1.5 text-sm ${status === f.value ? "bg-brand text-white" : "bg-white text-zinc-600 border border-zinc-200"}`}>
            {f.label}
          </Link>
        ))}
        <form className="ml-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} className="input w-64" placeholder="Ism yoki telefon bo'yicha qidirish" />
        </form>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3">№</th><th>Mijoz</th><th>Kurs / tarif</th><th>Summa</th><th>Holat</th><th>Manba</th><th>Sana</th><th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-zinc-100">
                <td className="px-4 py-3">{o.number}</td>
                <td>{o.user.name}<div className="text-xs text-zinc-400">{formatPhone(o.user.phone)}</div></td>
                <td>{o.tariff.course.title}<div className="text-xs text-zinc-400">{o.tariff.name}</div></td>
                <td>{formatPrice(o.amount)}</td>
                <td><StatusBadge status={o.status} />{o.provider && <div className="text-xs text-zinc-400">{o.provider}</div>}</td>
                <td className="text-zinc-500">{o.utmSource || "—"}</td>
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
        {orders.length === 0 && <p className="p-6 text-center text-zinc-500">Buyurtmalar topilmadi</p>}
      </div>
    </div>
  );
}
