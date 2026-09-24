import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { loadCourseForStudent } from "@/lib/course";
import { lessonHint } from "@/lib/access";
import { toggleLessonComplete } from "@/lib/actions/student";
import { VideoPlayer } from "@/components/VideoPlayer";
import { LessonVideo } from "@/components/LessonVideo";
import { kinescopeId, toEmbedUrl } from "@/lib/format";
import { LessonContent } from "@/components/LessonContent";
import { SubmitButton } from "@/components/SubmitButton";
import { BrandScope } from "@/components/BrandScope";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const found = await prisma.lesson.findUnique({ where: { id }, select: { module: { select: { courseId: true } } } });
  if (!found) notFound();

  const { course, modules, done, flatLessons } = await loadCourseForStudent(found.module.courseId, user);
  const index = flatLessons.findIndex((l) => l.id === id);
  const lesson = flatLessons[index];
  // Video va matn faqat dars ochiq bo'lsagina serverdan chiqadi (yozilmagan yoki hali ochilmagan — 404)
  if (!lesson || lesson.state !== "open") notFound();

  const moduleIndex = modules.findIndex((m) => m.lessons.some((l) => l.id === id));
  const mod = modules[moduleIndex];
  const lessonNumber = mod.lessons.findIndex((l) => l.id === id) + 1;

  const isDone = done.has(lesson.id);
  const next = flatLessons.slice(index + 1).find((l) => l.state === "open");
  const prev = flatLessons.slice(0, index).reverse().find((l) => l.state === "open");

  return (
    <BrandScope color={course.brandColor}>
      <Link href={`/cabinet/modules/${mod.id}`} className="text-sm font-medium text-gold-text/80 hover:text-gold-text">← {mod.title}</Link>

      <div className="mt-5">
        <p className="text-sm font-medium uppercase tracking-widest text-gold-text/70">
          {moduleIndex + 1}-modul · {lessonNumber}-dars{lesson.duration && ` · ${lesson.duration}`}
        </p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{lesson.title}</h1>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {lesson.videoUrl && (kinescopeId(lesson.videoUrl) ? (
            <LessonVideo videoId={kinescopeId(lesson.videoUrl)!} lessonId={lesson.id} watermark={user.email} embedUrl={toEmbedUrl(lesson.videoUrl) ?? lesson.videoUrl} />
          ) : (
            <VideoPlayer url={lesson.videoUrl} watermark={user.email} />
          ))}

          {lesson.content && (
            <section className="glass p-6 sm:p-7">
              <h2 className="mb-4 text-xl font-bold">Dars haqida</h2>
              <LessonContent text={lesson.content} />
            </section>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {prev ? <Link href={`/cabinet/lessons/${prev.id}`} className="btn-outline">← Oldingi dars</Link> : <span />}
            <form action={toggleLessonComplete}>
              <input type="hidden" name="lessonId" value={lesson.id} />
              <SubmitButton className={isDone ? "btn-outline" : "btn-primary"}>{isDone ? "✓ Tugatilgan (bekor qilish)" : "Darsni tugatdim"}</SubmitButton>
            </form>
            {next ? <Link href={`/cabinet/lessons/${next.id}`} className="btn-primary">Keyingi dars →</Link> : <span />}
          </div>
        </div>

        {/* Moduldagi darslar */}
        <aside className="glass h-fit p-4 lg:sticky lg:top-24">
          <p className="px-2 pb-3 text-sm font-semibold uppercase tracking-wider text-gold-text/70">{mod.title}</p>
          <ul className="space-y-1.5">
            {mod.lessons.map((l, i) => {
              const active = l.id === id;
              const open = l.state === "open";
              const cls = `flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-gold/20 text-gold-text ring-1 ring-gold/50" : open ? "text-gold-text/80 hover:bg-white/5 hover:text-gold-text" : "cursor-not-allowed text-gold-text/40"}`;
              const inner = (
                <>
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-gold text-ink-950" : done.has(l.id) ? "bg-gold/30 text-gold-text" : "bg-white/10"}`}>
                    {done.has(l.id) && !active ? "✓" : open ? i + 1 : "🔒"}
                  </span>
                  <span className="min-w-0 flex-1 leading-snug">
                    {l.title}
                    {!open && <span className="mt-0.5 block text-xs">{lessonHint(l, l.state)}</span>}
                  </span>
                  {l.duration && <span className="shrink-0 text-xs text-gold-text/60">{l.duration}</span>}
                </>
              );
              return <li key={l.id}>{open ? <Link href={`/cabinet/lessons/${l.id}`} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>}</li>;
            })}
          </ul>
        </aside>
      </div>
    </BrandScope>
  );
}
