import { prisma } from "@/lib/db";
import { CourseTariffsCard } from "@/components/CourseTariffsCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const courses = await prisma.course.findMany({
    where: { published: true },
    include: {
      tariffs: {
        where: { active: true },
        orderBy: { level: "asc" },
        select: { id: true, name: true, price: true, oldPrice: true, features: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Kurslar</h1>
      <p className="mt-2 text-gold-text/80">O&apos;zingizga mos kursni tanlang</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <CourseTariffsCard
            key={c.id}
            course={{ slug: c.slug, title: c.title, subtitle: c.subtitle, coverUrl: c.coverUrl }}
            tariffs={c.tariffs}
          />
        ))}
        {courses.length === 0 && <p className="text-gold-text/80">Hozircha kurslar yo&apos;q.</p>}
      </div>
    </div>
  );
}
