import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { loadCourseForStudent } from "@/lib/course";
import { ModuleGrid } from "@/components/ModuleGrid";
import { ProgressBar } from "@/components/ProgressBar";
import { BrandScope } from "@/components/BrandScope";
import { CourseBrand } from "@/components/CourseBrand";
import { totalDuration } from "@/lib/format";

export default async function StudentCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const found = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
  if (!found) notFound();

  const { course, modules, hasAccess, done, flatLessons } = await loadCourseForStudent(found.id, user);
  // Yozilmagan kurs (boshqa kurs) o'quvchiga umuman ko'rinmaydi
  if (!hasAccess) notFound();

  const available = flatLessons.filter((l) => l.state !== "locked");
  const completed = available.filter((l) => done.has(l.id)).length;
  const next = flatLessons.find((l) => l.state === "open" && !done.has(l.id));

  const cards = modules.map((m) => {
    const open = m.lessons.filter((l) => l.state !== "locked");
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      coverUrl: m.coverUrl,
      lessonCount: m.lessons.length,
      totalTime: totalDuration(m.lessons.map((l) => l.duration)),
      available: open.length,
      doneCount: open.filter((l) => done.has(l.id)).length,
    };
  });

  return (
    <BrandScope color={course.brandColor}>
      <Link href="/courses" className="text-sm font-medium text-gold-text/80 hover:text-gold-text">← Kurslar</Link>
      <div className="mt-5 max-w-3xl space-y-4">
        <CourseBrand course={course} className="block" />
        <h1 className="text-3xl font-bold sm:text-4xl">{course.title}</h1>
        {course.subtitle && <p className="text-lg text-gold-text/85">{course.subtitle}</p>}
        <div className="space-y-2 pt-2">
          <ProgressBar dark value={available.length ? (completed / available.length) * 100 : 0} />
          <p className="text-sm text-gold-text/70">{completed} / {available.length} dars tugatildi</p>
        </div>
        {next && <Link href={`/cabinet/lessons/${next.id}`} className="btn-primary">Davom etish: {next.title}</Link>}
      </div>
      <div className="mt-8">
        <ModuleGrid modules={cards} />
        {cards.length === 0 && <p className="text-gold-text/70">Bu kursda hozircha modullar yo&apos;q.</p>}
      </div>
    </BrandScope>
  );
}
