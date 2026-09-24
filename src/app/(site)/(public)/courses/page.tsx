import { prisma } from "@/lib/db";
import { CourseTariffsCard } from "@/components/CourseTariffsCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const courses = await prisma.course.findMany({
    where: { published: true },
    include: {
      tariffs: {
        where: { active: true },
        select: { price: true },
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
            prices={c.tariffs.map((t) => t.price)}
          />
        ))}
        {courses.length === 0 && <p className="text-gold-text/80">Hozircha kurslar yo&apos;q.</p>}
      </div>
    </div>
  );
}
