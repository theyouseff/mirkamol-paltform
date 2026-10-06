import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { loadCourseForStudent } from "@/lib/course";
import { ModuleGrid } from "@/components/ModuleGrid";
import { ProgressBar } from "@/components/ProgressBar";
import { totalDuration } from "@/lib/format";
import { ThumbPrefetch } from "@/components/ThumbPrefetch";
import { Leaderboard } from "@/components/Leaderboard";

export default async function StudentCoursePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lb?: string }> }) {
  const { slug } = await params;
  const { lb } = await searchParams;
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
      iconUrl: m.iconUrl,
      lessonCount: m.lessons.length,
      totalTime: totalDuration(m.lessons.map((l) => l.duration)),
      available: open.length,
      doneCount: open.filter((l) => done.has(l.id)).length,
    };
  });

  // Ochiq darslarning tayyor rasmlari: modulga kirishdan oldin fonda yuklab qo'yiladi (dars bloklari rasm bilan darhol chiqishi uchun)
  const thumbs = flatLessons.filter((l) => l.state === "open" && l.thumbUrl).map((l) => l.thumbUrl);

  return (
    <>
      <ThumbPrefetch urls={thumbs} />
      <Link href="/courses" className="text-sm font-medium text-gold-text/80 hover:text-gold-text active:text-gold-text">← Kurslar</Link>
      <div className="mt-5 max-w-3xl space-y-4">
        <span className="block text-lg font-bold text-brand">{course.title}</span>
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
      {/* Faqat shu kursga yozilganlar (yoki admin) bu sahifani ko'radi, reyting ham faqat shu kurs o'quvchilaridan tuziladi */}
      <Leaderboard courseId={course.id} viewerId={user.id} viewerIsAdmin={user.role === "ADMIN"} period={lb === "week" ? "week" : "all"} />
    </>
  );
}
