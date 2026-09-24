import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { loadCourseForStudent } from "@/lib/course";
import { toggleLessonComplete } from "@/lib/actions/student";
import { LessonList } from "@/components/LessonList";
import { VideoPlayer } from "@/components/VideoPlayer";
import { SubmitButton } from "@/components/SubmitButton";
import { BrandScope } from "@/components/BrandScope";
import { CourseBrand } from "@/components/CourseBrand";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const found = await prisma.lesson.findUnique({ where: { id }, select: { module: { select: { courseId: true } } } });
  if (!found) notFound();

  const { course, modules, done, flatLessons } = await loadCourseForStudent(found.module.courseId, user);
  const index = flatLessons.findIndex((l) => l.id === id);
  const lesson = flatLessons[index];
  if (lesson.state !== "open") notFound();

  const isDone = done.has(lesson.id);
  const next = flatLessons.slice(index + 1).find((l) => l.state === "open");
  const prev = flatLessons.slice(0, index).reverse().find((l) => l.state === "open");

  return (
    <BrandScope color={course.brandColor}>
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <article className="space-y-6">
        <div>
          <CourseBrand course={course} className="mb-3 block" />
          <Link href={`/cabinet/courses/${course.slug}`} className="text-sm text-amber-300 hover:underline">← {course.title}</Link>
          <h1 className="mt-2 text-2xl font-bold">{lesson.title}</h1>
        </div>
        {lesson.videoUrl && <VideoPlayer url={lesson.videoUrl} />}
        {lesson.content && <div className="card whitespace-pre-line leading-relaxed text-zinc-700">{lesson.content}</div>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {prev ? <Link href={`/cabinet/lessons/${prev.id}`} className="btn-outline">← Oldingi</Link> : <span />}
          <form action={toggleLessonComplete}>
            <input type="hidden" name="lessonId" value={lesson.id} />
            <SubmitButton className={isDone ? "btn-outline" : "btn bg-green-600 text-white hover:bg-green-700"}>
              {isDone ? "✅ Tugatilgan (bekor qilish)" : "Darsni tugatdim"}
            </SubmitButton>
          </form>
          {next ? <Link href={`/cabinet/lessons/${next.id}`} className="btn-gold">Keyingi →</Link> : <span />}
        </div>
      </article>
      <aside className="card h-fit lg:sticky lg:top-6">
        <LessonList modules={modules} done={done} activeId={lesson.id} />
      </aside>
    </div>
    </BrandScope>
  );
}
