import { prisma } from "@/lib/db";
import { requireCurator } from "@/lib/auth";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export default async function CuratorPage({ searchParams }: { searchParams: Promise<{ q?: string; student?: string }> }) {
  const { q, student } = await searchParams;
  const user = await requireCurator();
  // Kurator faqat o'ziga biriktirilgan kurslardagi o'quvchilarni ko'radi (admin — hammasini)
  if (user.role === "ADMIN") return <AnalyticsView basePath="/curator" q={q} student={student} />;

  const assigned = await prisma.curatorCourse.findMany({ where: { curatorId: user.id }, include: { course: { select: { title: true } } } });
  if (assigned.length === 0) {
    return (
      <div className="glass mx-auto max-w-md space-y-2 p-7 text-center">
        <p className="font-semibold text-gold-text">Sizga hali kurs biriktirilmagan</p>
        <p className="text-sm text-gold-text/75">Admin sizga kurs biriktirgach, shu kurs o&apos;quvchilari shu yerda ko&apos;rinadi.</p>
      </div>
    );
  }
  return (
    <AnalyticsView
      basePath="/curator"
      q={q}
      student={student}
      courseIds={assigned.map((a) => a.courseId)}
      subtitle={`Sizning kurslaringiz: ${assigned.map((a) => a.course.title).join(", ")}`}
    />
  );
}
