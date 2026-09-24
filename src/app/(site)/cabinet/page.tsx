import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatClock, kinescopeId, tashkentDay, toEmbedUrl } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { LessonVideo } from "@/components/LessonVideo";
import { VideoPlayer } from "@/components/VideoPlayer";
import { VisitCalendar } from "@/components/VisitCalendar";

// "Ali Valiyev" -> "AV"
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

// Kabinet: chap yuqori burchakda yumaloq kapsula (avatar, ism, progress); ostida o'quvchining oxirgi ko'rgan videosi va to'xtagan joyi.
export default async function CabinetPage() {
  const user = await requireUser();
  // O'quvchi yozilgan barcha kurslardagi darslar (admin uchun — platformadagi hamma dars)
  const inMyCourses = user.role === "ADMIN" ? {} : { module: { course: { enrollments: { some: { userId: user.id } } } } };
  const [total, done, last, visits] = await Promise.all([
    prisma.lesson.count({ where: inMyCourses }),
    prisma.lessonProgress.count({ where: { userId: user.id, lesson: inMyCourses } }),
    prisma.lessonWatch.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { lesson: { select: { id: true, title: true, videoUrl: true, moduleId: true, module: { select: { title: true, courseId: true } } } } },
    }),
    prisma.loginDay.findMany({ where: { userId: user.id }, select: { day: true } }),
  ]);
  const today = tashkentDay();
  // Bugun sahifani ko'rib turibdi, demak bugun ham kirgan (yozuv javobdan keyin saqlanadi)
  const visitedDays = [...new Set([...visits.map((v) => v.day), ...(user.role === "ADMIN" ? [] : [today])])];
  // Dars raqami: kursdagi nechanchi modul va moduldagi nechanchi dars
  const modules = last
    ? await prisma.module.findMany({ where: { courseId: last.lesson.module.courseId }, orderBy: { order: "asc" }, select: { id: true, lessons: { orderBy: { order: "asc" }, select: { id: true } } } })
    : [];
  const moduleIndex = last ? modules.findIndex((m) => m.id === last.lesson.moduleId) : -1;
  const lessonNumber = moduleIndex >= 0 ? modules[moduleIndex].lessons.findIndex((l) => l.id === last!.lesson.id) + 1 : 0;
  const videoId = last?.lesson.videoUrl ? kinescopeId(last.lesson.videoUrl) : null;
  // Oxirigacha ko'rilgan bo'lsa, boshidan; aks holda to'xtagan joyidan davom etadi
  const finished = !!last && last.duration > 0 && last.position >= last.duration - 5;

  return (
    <div className="space-y-6">
    <div className="glass inline-flex max-w-full items-center gap-4 rounded-full py-3 pl-3 pr-8">
      <span className="gold-gloss relative isolate flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg before:rounded-none!" aria-hidden>
        {initials(user.name)}
      </span>
      <div className="min-w-0 space-y-2 sm:min-w-64">
        <p className="truncate text-xl font-bold text-gold-text">{user.name}</p>
        <ProgressBar dark value={total ? (done / total) * 100 : 0} />
        <p className="text-sm text-gold-text/75">
          {total > 0 ? `${done} / ${total} video dars ko'rildi` : "Hali ochiq kurs yo'q"}
        </p>
      </div>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    {last ? (
      <section className="glass space-y-4 p-5 sm:p-6">
        <p className="text-sm font-medium uppercase tracking-widest text-gold-text/70">Oxirgi ko&apos;rgan video</p>
        {videoId ? (
          <LessonVideo key={last.lesson.id} videoId={videoId} lessonId={last.lesson.id} embedUrl={toEmbedUrl(last.lesson.videoUrl) ?? last.lesson.videoUrl} startAt={finished ? 0 : last.position} />
        ) : last.lesson.videoUrl ? (
          <VideoPlayer url={last.lesson.videoUrl} />
        ) : null}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            {lessonNumber > 0 && (
              <p className="text-xs font-medium uppercase tracking-widest text-gold-text/70">{moduleIndex + 1}-modul · {lessonNumber}-dars</p>
            )}
            <p className="text-lg font-bold">{last.lesson.title}</p>
            <p className="text-sm text-gold-text/70">{last.lesson.module.title}</p>
          </div>
          <Link href={`/cabinet/lessons/${last.lesson.id}`} className="btn-primary">Darsga o&apos;tish →</Link>
        </div>
        <div className="space-y-2">
          <ProgressBar dark value={last.duration ? (last.position / last.duration) * 100 : 0} />
          <p className="text-sm text-gold-text/85">
            {finished ? (
              <>Oxirigacha ko&apos;rilgan · <b>{formatClock(last.duration)}</b></>
            ) : (
              <>To&apos;xtagan joyi: <b>{formatClock(last.position)}</b> / {formatClock(last.duration)}</>
            )}
          </p>
        </div>
      </section>
    ) : (
      <section className="glass space-y-3 p-5 sm:p-6">
        <p className="text-gold-text/85">Hali video ko&apos;rmagansiz. Kursni ochib, birinchi darsdan boshlang.</p>
        <Link href="/courses" className="btn-primary">Kurslarga o&apos;tish</Link>
      </section>
    )}
    <VisitCalendar days={visitedDays} today={today} />
    </div>
    </div>
  );
}
