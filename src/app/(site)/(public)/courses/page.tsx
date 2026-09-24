import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const courses = await prisma.course.findMany({
    where: { published: true },
    include: { tariffs: { where: { active: true }, orderBy: { price: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Kurslar</h1>
      <p className="mt-2 text-zinc-500">O&apos;zingizga mos kursni tanlang</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <Link key={c.id} href={`/courses/${c.slug}`} className="card-gold flex flex-col">
            {c.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.coverUrl} alt="" className="mb-4 aspect-video w-full rounded-xl object-cover" />
            ) : (
              <div className="mb-4 aspect-video w-full rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-500" />
            )}
            <h2 className="text-lg font-semibold">{c.title}</h2>
            <p className="mt-1 flex-1 text-sm text-zinc-500">{c.subtitle}</p>
            {c.tariffs[0] && <p className="mt-4 font-semibold text-brand">{formatPrice(c.tariffs[0].price)} dan</p>}
          </Link>
        ))}
        {courses.length === 0 && <p className="text-zinc-500">Hozircha kurslar yo&apos;q.</p>}
      </div>
    </div>
  );
}
