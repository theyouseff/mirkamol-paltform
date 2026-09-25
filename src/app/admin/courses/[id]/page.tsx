import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  createLesson, createModule, deleteCourse, deleteModule, moveLesson, moveModule, updateCourse, updateModule,
} from "@/lib/actions/admin";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function AdminCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authors = await prisma.author.findMany({ orderBy: { name: "asc" } });
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
    },
  });
  if (!course) notFound();

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/courses" className="text-sm text-gold-text hover:underline">← Kurslar</Link>
          <h1 className="mt-1 text-2xl font-bold">{course.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/courses/${course.slug}`} target="_blank" className="btn-outline">Sotuv sahifasi ↗</Link>
          <Link href={`/cabinet/courses/${course.slug}`} target="_blank" className="btn-outline">O&apos;quvchi ko&apos;rinishi ↗</Link>
        </div>
      </div>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Asosiy ma&apos;lumotlar</h2>
        <form action={updateCourse} className="space-y-4">
          <input type="hidden" name="id" value={course.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nomi</label>
              <input name="title" className="input" defaultValue={course.title} required />
            </div>
            <div>
              <label className="label">Havola (slug)</label>
              <input name="slug" className="input" defaultValue={course.slug} required />
            </div>
          </div>
          <div>
            <label className="label">Qisqa tavsif</label>
            <input name="subtitle" className="input" defaultValue={course.subtitle} />
          </div>
          <div>
            <label className="label">To&apos;liq tavsif (sotuv sahifasi uchun)</label>
            <textarea name="description" rows={5} className="input" defaultValue={course.description} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Kurs narxi (so&apos;m)</label>
              <input name="price" type="number" min={0} className="input" defaultValue={course.price} />
              <p className="mt-1 text-xs text-zinc-400">Saytda ko&apos;rinmaydi. Faqat «O&apos;quvchi qo&apos;shish» formasida summa avtomatik to&apos;ladi.</p>
            </div>
          </div>
          <div>
            <label className="label">Muqova rasmi (URL)</label>
            <input name="coverUrl" className="input" defaultValue={course.coverUrl} placeholder="https://..." />
          </div>
          <div>
            <label className="label">Muallif</label>
            <select name="authorId" className="input" defaultValue={course.authorId ?? ""}>
              <option value="">Muallifsiz</option>
              {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="space-y-3 rounded-xl bg-zinc-50 p-4">
            <p className="text-sm font-medium">Kurs brendi <span className="font-normal text-zinc-500">— o&apos;quvchi shu kursni ochganda ko&apos;radigan logotip va rang</span></p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Nomi (logotip o&apos;rnida)</label>
                <input name="brandName" className="input" defaultValue={course.brandName} placeholder="Arab tili maktabi" />
              </div>
              <div>
                <label className="label">Logotip (URL)</label>
                <input name="logoUrl" className="input" defaultValue={course.logoUrl} placeholder="https://..." />
              </div>
              <div>
                <label className="label">Asosiy rang</label>
                <input name="brandColor" type="color" className="h-[42px] w-full cursor-pointer rounded-xl border border-zinc-300 bg-white p-1" defaultValue={course.brandColor || "#a8741a"} />
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={course.published} /> Nashr qilingan (saytda ko&apos;rinadi)
          </label>
          <SubmitButton>Saqlash</SubmitButton>
        </form>
      </section>

      <section className="card space-y-6">
        <h2 className="text-lg font-semibold">Dastur: modullar va darslar</h2>
        {course.modules.map((m, mi) => (
          <div key={m.id} className="rounded-xl border border-zinc-200">
            <div className="flex items-start gap-2 border-b border-zinc-100 bg-zinc-50 p-3 max-sm:flex-col">
              <form action={moveModule} className="flex gap-1">
                <input type="hidden" name="id" value={m.id} />
                <button name="dir" value="up" disabled={mi === 0} className="btn-outline px-2.5" title="Yuqoriga">↑</button>
                <button name="dir" value="down" disabled={mi === course.modules.length - 1} className="btn-outline px-2.5" title="Pastga">↓</button>
              </form>
              <form action={updateModule} className="min-w-0 flex-1 space-y-2 max-sm:w-full">
                <input type="hidden" name="id" value={m.id} />
                <div className="flex flex-wrap items-center gap-2">
                  <input name="title" className="input min-w-0 flex-1 font-medium max-sm:basis-full" defaultValue={m.title} />
                  <SubmitButton className="btn-outline">Saqlash</SubmitButton>
                  <ConfirmButton formAction={deleteModule} message="Modul va undagi barcha darslar o'chiriladi. Davom etasizmi?">✕</ConfirmButton>
                </div>
                <input name="description" className="input text-zinc-600" defaultValue={m.description} placeholder="Modul haqida qisqa tavsif (ixtiyoriy)" />
                <input name="coverUrl" className="input text-zinc-600" defaultValue={m.coverUrl} placeholder="Modul rasmi: /modules/nom.webp yoki https://... (ixtiyoriy)" />
              </form>
            </div>
            <ul className="divide-y divide-zinc-100">
              {m.lessons.map((l, li) => (
                <li key={l.id} className="flex items-center hover:bg-zinc-50">
                  <Link href={`/admin/lessons/${l.id}`} className="flex flex-1 items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span>{li + 1}. {l.title} {l.videoUrl && "🎬"}</span>
                    <span className="flex gap-1">
                      {l.openAt && <span className="badge bg-sky-100 text-sky-700">🕒 {formatDate(l.openAt)}</span>}
                    </span>
                  </Link>
                  <form action={moveLesson} className="flex gap-1 pr-3">
                    <input type="hidden" name="id" value={l.id} />
                    <button name="dir" value="up" disabled={li === 0} className="btn-outline px-2 py-1" title="Yuqoriga">↑</button>
                    <button name="dir" value="down" disabled={li === m.lessons.length - 1} className="btn-outline px-2 py-1" title="Pastga">↓</button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={createLesson} className="flex gap-2 p-3">
              <input type="hidden" name="moduleId" value={m.id} />
              <input name="title" className="input flex-1" placeholder="Yangi dars nomi" />
              <SubmitButton className="btn-outline">+ Dars</SubmitButton>
            </form>
          </div>
        ))}
        <form action={createModule} className="flex gap-2">
          <input type="hidden" name="courseId" value={course.id} />
          <input name="title" className="input flex-1" placeholder="Yangi modul nomi" />
          <SubmitButton>+ Modul</SubmitButton>
        </form>
      </section>

      <section className="card border-red-200">
        <h2 className="font-semibold text-red-600">Xavfli zona</h2>
        <form action={deleteCourse} className="mt-3">
          <input type="hidden" name="id" value={course.id} />
          <ConfirmButton message="Kurs butunlay o'chiriladi. Ishonchingiz komilmi?">Kursni o&apos;chirish</ConfirmButton>
        </form>
      </section>
    </div>
  );
}
