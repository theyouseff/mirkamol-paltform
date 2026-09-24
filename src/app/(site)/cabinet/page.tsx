import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ProgressBar } from "@/components/ProgressBar";
import { BrandScope } from "@/components/BrandScope";
import { CourseBrand } from "@/components/CourseBrand";

export default async function CabinetPage() {
  const user = await requireUser();
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      tariff: true,
      course: { include: { modules: { include: { lessons: { select: { id: true, minLevel: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  const done = new Set((await prisma.lessonProgress.findMany({ where: { userId: user.id }, select: { lessonId: true } })).map((p) => p.lessonId));

  return (
    <div>
      <h1 className="text-2xl font-bold">Salom, {user.name}!</h1>
      <p className="mt-1 text-zinc-500">Sizning kurslaringiz</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {enrollments.map((e) => {
          const lessons = e.course.modules.flatMap((m) => m.lessons).filter((l) => l.minLevel <= e.tariff.level);
          const completed = lessons.filter((l) => done.has(l.id)).length;
          const pct = lessons.length ? (completed / lessons.length) * 100 : 0;
          return (
            <BrandScope key={e.id} color={e.course.brandColor}>
              <Link href={`/cabinet/courses/${e.course.slug}`} className="card-gold block space-y-3">
                <CourseBrand course={e.course} />
                <span className="badge bg-brand-soft text-brand">{e.tariff.name}</span>
                <h2 className="text-lg font-semibold">{e.course.title}</h2>
                <ProgressBar value={pct} />
                <p className="text-sm text-zinc-500">{completed} / {lessons.length} dars · {Math.round(pct)}%</p>
              </Link>
            </BrandScope>
          );
        })}
      </div>
      {enrollments.length === 0 && (
        <div className="card mt-8 text-center">
          <p className="text-zinc-500">Sizda hali ochiq kurslar yo&apos;q. Kurs ochilishi uchun adminga yozing.</p>
        </div>
      )}
    </div>
  );
}
