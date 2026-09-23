import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getEnrollment } from "@/lib/access";
import { createOrder } from "@/lib/actions/checkout";
import { formatPrice } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";

type Props = { params: Promise<{ tariffId: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { tariffId } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const tariff = await prisma.tariff.findUnique({ where: { id: tariffId }, include: { course: true } });
  if (!tariff || !tariff.active || !tariff.course.published) notFound();

  const enrollment = await getEnrollment(user.id, tariff.courseId);
  const alreadyHas = enrollment && enrollment.tariff.level >= tariff.level;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="card space-y-6">
        <div>
          <p className="text-sm text-zinc-500">Buyurtma</p>
          <h1 className="mt-1 text-2xl font-bold">{tariff.course.title}</h1>
          <p className="mt-1 text-zinc-600">Tarif: <b>{tariff.name}</b></p>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-brand-soft px-4 py-3">
          <span>Jami:</span>
          <span className="text-xl font-bold text-brand">{formatPrice(tariff.price)}</span>
        </div>
        {alreadyHas ? (
          <div className="space-y-3">
            <p className="text-sm text-green-700">Bu kurs sizda allaqachon bor ({enrollment.tariff.name} tarifi).</p>
            <Link href={`/cabinet/courses/${tariff.course.slug}`} className="btn-primary w-full">Kursga o&apos;tish</Link>
          </div>
        ) : (
          <form action={createOrder}>
            <input type="hidden" name="tariffId" value={tariff.id} />
            <input type="hidden" name="utmSource" value={sp.utm_source ?? ""} />
            <input type="hidden" name="utmCampaign" value={sp.utm_campaign ?? ""} />
            <SubmitButton className="btn-primary w-full py-3">To&apos;lovga o&apos;tish</SubmitButton>
          </form>
        )}
        <p className="text-xs text-zinc-400">Akkaunt: {user.name}</p>
      </div>
    </div>
  );
}
