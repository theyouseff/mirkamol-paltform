import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { loadCourseForStudent } from "@/lib/course";
import { lessonHint } from "@/lib/access";
import { totalDuration } from "@/lib/format";
import { isOwnVideo, ownVideoSrc } from "@/lib/video-source";
import { VideoLessonGrid } from "@/components/VideoLessonGrid";

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const found = await prisma.module.findUnique({ where: { id }, select: { courseId: true } });
  if (!found) notFound();

  const { course, modules, hasAccess, done } = await loadCourseForStudent(found.courseId, user);
  if (!hasAccess) notFound();
  const index = modules.findIndex((m) => m.id === id);
  const mod = modules[index];

  const totalTime = totalDuration(mod.lessons.map((l) => l.duration));
  // Ochiq darslarning o'z videosi bo'lsa, blokda uning kadri ko'rinadi (yopiq darsning videosi manzili berilmaydi)
  const previews = await Promise.all(mod.lessons.map((l) => (l.state === "open" && isOwnVideo(l.videoUrl) ? ownVideoSrc(l) : null)));
  const lessons = mod.lessons.map((l, i) => ({
    id: l.id,
    title: l.title,
    duration: l.duration,
    state: l.state,
    done: done.has(l.id),
    hint: lessonHint(l, l.state),
    previewSrc: previews[i],
  }));

  return (
    <>
      <Link href={`/cabinet/courses/${course.slug}`} className="text-sm font-medium text-gold-text/80 hover:text-gold-text active:text-gold-text">← {course.title}</Link>
      <div className="mt-5">
        <p className="text-sm font-medium uppercase tracking-widest text-gold-text/70">{index + 1}-modul</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{mod.title}</h1>
        {mod.description && <p className="mt-3 text-lg text-gold-text/85">{mod.description}</p>}
        <p className="mt-6 text-sm font-medium uppercase tracking-widest text-gold-text/70">{mod.lessons.length} ta video dars{totalTime && ` · jami ${totalTime}`}</p>
      </div>
      <div className="mt-5">
        <VideoLessonGrid lessons={lessons} />
      </div>
    </>
  );
}
