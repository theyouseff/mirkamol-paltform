import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { loadCourseForStudent } from "@/lib/course";
import { LessonList } from "@/components/LessonList";
import { ProgressBar } from "@/components/ProgressBar";
import { BrandScope } from "@/components/BrandScope";
import { CourseBrand } from "@/components/CourseBrand";

export default async function StudentCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const found = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
  if (!found) notFound();

  const { course, enrollment, modules, hasAccess, done, flatLessons } = await loadCourseForStudent(found.id, user);
  if (!hasAccess) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p>Bu kursga kirish uchun uni sotib olishingiz kerak.</p>
        <Link href={`/courses/${course.slug}`} className="btn-primary mt-4">Tariflarni ko&apos;rish</Link>
      </div>
    );
  }

  const available = flatLessons.filter((l) => l.state !== "tariff");
  const completed = available.filter((l) => done.has(l.id)).length;
  const next = flatLessons.find((l) => l.state === "open" && !done.has(l.id));

  return (
    <BrandScope color={course.brandColor}>
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card space-y-4">
        <CourseBrand course={course} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          {enrollment && <span className="badge bg-brand-soft text-brand">{enrollment.tariff.name}</span>}
        </div>
        <ProgressBar value={available.length ? (completed / available.length) * 100 : 0} />
        <p className="text-sm text-zinc-500">{completed} / {available.length} dars tugatildi</p>
        {next && <Link href={`/cabinet/lessons/${next.id}`} className="btn-primary">Davom etish: {next.title}</Link>}
      </div>
      <div className="card">
        <LessonList modules={modules} done={done} />
      </div>
    </div>
    </BrandScope>
  );
}
