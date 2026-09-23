import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { payTestOrder } from "@/lib/actions/checkout";
import { formatPrice } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const order = await prisma.order.findUnique({ where: { id }, include: { tariff: { include: { course: true } } } });
  if (!order || order.userId !== user.id) notFound();
  const course = order.tariff.course;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="card space-y-6">
        <div>
          <p className="text-sm text-zinc-500">Buyurtma №{order.number}</p>
          <h1 className="mt-1 text-2xl font-bold">{course.title}</h1>
          <p className="mt-1 text-zinc-600">Tarif: <b>{order.tariff.name}</b> · {formatPrice(order.amount)}</p>
        </div>

        {order.status === "PAID" ? (
          <div className="space-y-4 text-center">
            <div className="text-5xl">🎉</div>
            <p className="text-lg font-semibold text-green-700">To&apos;lov qabul qilindi!</p>
            <Link href={`/cabinet/courses/${course.slug}`} className="btn-primary w-full">Darslarni boshlash</Link>
          </div>
        ) : order.status === "CANCELED" ? (
          <p className="text-red-600">Buyurtma bekor qilingan.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-700">To&apos;lov usulini tanlang:</p>
            {/* Payme va Click integratsiyasi keyingi bosqichda ulanadi */}
            <button disabled className="btn-outline w-full py-3">Payme (tez orada)</button>
            <button disabled className="btn-outline w-full py-3">Click (tez orada)</button>
            {process.env.PAYMENT_TEST_MODE === "true" && (
              <form action={payTestOrder} className="border-t border-dashed border-zinc-200 pt-3">
                <input type="hidden" name="orderId" value={order.id} />
                <SubmitButton className="btn w-full bg-amber-100 text-amber-800 hover:bg-amber-200">🧪 Test to&apos;lov (faqat ishlab chiqish uchun)</SubmitButton>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
