import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { deleteLesson, updateLesson } from "@/lib/actions/admin";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { VideoPlayer } from "@/components/VideoPlayer";
import { FileVideo } from "@/components/FileVideo";

// datetime-local input uchun Toshkent vaqti (UTC+5)
const toTashkentInput = (d: Date | null) => (d ? new Date(d.getTime() + 5 * 3600_000).toISOString().slice(0, 16) : "");

export default async function AdminLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { module: { include: { course: true } } },
  });
  if (!lesson) notFound();
  const course = lesson.module.course;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={`/admin/courses/${course.id}`} className="text-sm text-gold-text hover:underline">← {course.title} / {lesson.module.title}</Link>
        <h1 className="mt-1 text-2xl font-bold">{lesson.title}</h1>
      </div>

      <form action={updateLesson} className="card space-y-4">
        <input type="hidden" name="id" value={lesson.id} />
        <div className="grid gap-4 sm:grid-cols-[1fr_120px_100px]">
          <div>
            <label className="label">Dars nomi</label>
            <input name="title" className="input" defaultValue={lesson.title} required />
          </div>
          <div>
            <label className="label">Davomiyligi</label>
            <input name="duration" className="input" defaultValue={lesson.duration} placeholder="12:40" />
          </div>
          <div>
            <label className="label">Tartib</label>
            <input name="order" type="number" className="input" defaultValue={lesson.order} />
          </div>
        </div>
        <div>
          <label className="label">Video havolasi</label>
          <input name="videoUrl" className="input" defaultValue={lesson.videoUrl} placeholder="YouTube, Kinescope, Bunny havola yoki file:nom.mp4 (videos papkasidagi fayl)" />
          <p className="mt-1 text-xs text-zinc-400">Himoyalangan video uchun Kinescope yoki Bunny Stream tavsiya qilinadi.</p>
        </div>
        {lesson.videoUrl.startsWith("file:") ? <FileVideo lessonId={lesson.id} trackProgress={false} /> : lesson.videoUrl && <VideoPlayer url={lesson.videoUrl} />}
        <div>
          <label className="label">Matn / konspekt</label>
          <textarea name="content" rows={10} className="input" defaultValue={lesson.content} />
          <p className="mt-1 text-xs text-zinc-400">Bo&apos;sh qator — yangi abzats. «- » bilan boshlangan qatorlar belgili ro&apos;yxat bo&apos;ladi; «Bu darsda:» kabi ikki nuqtali qator sarlavha bo&apos;ladi.</p>
        </div>
        <div className="max-w-sm">
          <label className="label">Ochilish vaqti (Toshkent)</label>
          <input name="openAt" type="datetime-local" className="input" defaultValue={toTashkentInput(lesson.openAt)} />
          <p className="mt-1 text-xs text-zinc-400">Bo&apos;sh qoldirsangiz — darhol ochiq.</p>
        </div>
        <div className="flex justify-between">
          <SubmitButton>Saqlash</SubmitButton>
          <ConfirmButton formAction={deleteLesson} message="Darsni o'chirasizmi?">O&apos;chirish</ConfirmButton>
        </div>
      </form>
    </div>
  );
}
