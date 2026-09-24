import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BrandScope } from "@/components/BrandScope";
import { GoldCheck } from "@/components/GoldCheck";
import { VideoPlayer } from "@/components/VideoPlayer";
import { findDemoLesson } from "@/lib/demo-course";

type Props = { params: Promise<{ slug: string; module: string; lesson: string }> };

const glass = "rounded-2xl border border-gold/30 bg-emerald-950/55 backdrop-blur-sm";

export default async function LessonPage({ params }: Props) {
  const { slug, module: moduleSlug, lesson: lessonParam } = await params;
  const course = await prisma.course.findUnique({ where: { slug } });
  const found = findDemoLesson(moduleSlug, lessonParam);
  if (!course || !course.published || !found) notFound();
  const { module: mod, number, lesson, lessonNumber } = found;

  const base = `/courses/${course.slug}/${moduleSlug}`;
  const prev = lessonNumber > 1 ? lessonNumber - 1 : null;
  const next = lessonNumber < mod.lessons.length ? lessonNumber + 1 : null;

  return (
    <BrandScope color={course.brandColor}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href={base} className="text-sm font-medium text-gold-text/80 hover:text-gold-text">← {mod.title}</Link>

        <div className="mt-5">
          <p className="text-sm font-medium uppercase tracking-widest text-gold-text/70">
            {number}-modul · {lessonNumber}-dars · {lesson.duration}
          </p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{lesson.title}</h1>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-6">
            {/* Video uchun joy */}
            {lesson.videoUrl ? (
              <VideoPlayer url={lesson.videoUrl} />
            ) : (
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(241,198,87,0.28),transparent_58%)]" />
                <div className="relative flex flex-col items-center gap-4 text-center">
                  <span className="gold-gloss relative isolate flex h-20 w-20 items-center justify-center overflow-hidden rounded-full before:rounded-none!">
                    <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8" fill="currentColor" aria-hidden>
                      <path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" />
                    </svg>
                  </span>
                  <p className="text-sm font-medium text-white/80">Video shu yerda joylashadi</p>
                </div>
                <span className="absolute bottom-3 right-3 rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium text-white">{lesson.duration}</span>
              </div>
            )}

            {/* Tavsif */}
            <section className={`${glass} p-6 sm:p-7`}>
              <h2 className="text-xl font-bold">Dars haqida</h2>
              <p className="mt-3 leading-relaxed text-gold-text/85">{lesson.description}</p>
              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-gold-text/70">Bu darsda</h3>
              <ul className="mt-3 space-y-2.5">
                {lesson.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-gold-text/90"><GoldCheck />{p}</li>
                ))}
              </ul>
            </section>

            {/* Oldingi / keyingi */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {prev ? (
                <Link href={`${base}/${prev}`} className="btn-outline">← Oldingi dars</Link>
              ) : (
                <span />
              )}
              {next ? <Link href={`${base}/${next}`} className="btn-primary">Keyingi dars →</Link> : <span />}
            </div>
          </div>

          {/* Moduldagi darslar */}
          <aside className={`${glass} h-fit p-4 lg:sticky lg:top-24`}>
            <p className="px-2 pb-3 text-sm font-semibold uppercase tracking-wider text-gold-text/70">{mod.title}</p>
            <ul className="space-y-1.5">
              {mod.lessons.map((l, i) => {
                const active = i + 1 === lessonNumber;
                return (
                  <li key={l.title}>
                    <Link
                      href={`${base}/${i + 1}`}
                      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-gold/20 text-gold-text ring-1 ring-gold/50" : "text-gold-text/80 hover:bg-white/5 hover:text-gold-text"}`}
                    >
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-gold text-emerald-950" : "bg-white/10"}`}>{i + 1}</span>
                      <span className="min-w-0 flex-1 leading-snug">{l.title}</span>
                      <span className="shrink-0 text-xs text-gold-text/60">{l.duration}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </div>
    </BrandScope>
  );
}
