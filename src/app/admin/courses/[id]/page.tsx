import Link from "next/link";
import { notFound } from "next/navigation";
import type { Tariff } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import {
  createLesson, createModule, deleteCourse, deleteModule, deleteTariff, moveLesson, moveModule, saveTariff, updateCourse, updateModule,
} from "@/lib/actions/admin";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";

function TariffForm({ courseId, tariff }: { courseId: string; tariff?: Tariff }) {
  return (
    <form action={saveTariff} className="space-y-3 rounded-xl border border-zinc-200 p-4">
      <input type="hidden" name="id" value={tariff?.id ?? ""} />
      <input type="hidden" name="courseId" value={courseId} />
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">Nomi</label>
          <input name="name" className="input" defaultValue={tariff?.name} placeholder="Standart" required />
        </div>
        <div>
          <label className="label">Narx (so&apos;m)</label>
          <input name="price" type="number" min={0} className="input" defaultValue={tariff?.price} required />
        </div>
        <div>
          <label className="label">Eski narx</label>
          <input name="oldPrice" type="number" min={0} className="input" defaultValue={tariff?.oldPrice ?? ""} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-3">
          <label className="label">Afzalliklar (har biri yangi qatorda)</label>
          <textarea name="features" rows={3} className="input" defaultValue={tariff?.features} />
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Daraja</label>
            <input name="level" type="number" min={1} className="input" defaultValue={tariff?.level ?? 1} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={tariff?.active ?? true} /> Sotuvda
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <SubmitButton>{tariff ? "Saqlash" : "+ Tarif qo'shish"}</SubmitButton>
        {tariff && (
          <ConfirmButton formAction={deleteTariff} message="Tarifni o'chirasizmi? (buyurtmalari bo'lsa, faqat sotuvdan olinadi)">O&apos;chirish</ConfirmButton>
        )}
      </div>
    </form>
  );
}

export default async function AdminCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authors = await prisma.author.findMany({ orderBy: { name: "asc" } });
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      tariffs: { orderBy: { level: "asc" } },
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
    },
  });
  if (!course) notFound();
  const tariffName = (level: number) => course.tariffs.find((t) => t.level >= level)?.name ?? `${level}-daraja`;

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

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Tariflar</h2>
          <p className="text-sm text-zinc-500">Daraja: darsda &quot;minimal daraja&quot; qo&apos;yiladi — undan past tarif u darsni ko&apos;rmaydi.</p>
        </div>
        {course.tariffs.map((t) => (
          <div key={t.id}>
            <p className="mb-1 text-sm text-zinc-500">
              {t.name} · {formatPrice(t.price)} {!t.active && <span className="badge bg-zinc-100">sotuvda emas</span>}
            </p>
            <TariffForm courseId={course.id} tariff={t} />
          </div>
        ))}
        <details className="rounded-xl bg-zinc-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-brand">+ Yangi tarif</summary>
          <div className="mt-3"><TariffForm courseId={course.id} /></div>
        </details>
      </section>

      <section className="card space-y-6">
        <h2 className="text-lg font-semibold">Dastur: modullar va darslar</h2>
        {course.modules.map((m, mi) => (
          <div key={m.id} className="rounded-xl border border-zinc-200">
            <div className="flex items-start gap-2 border-b border-zinc-100 bg-zinc-50 p-3">
              <form action={moveModule} className="flex gap-1">
                <input type="hidden" name="id" value={m.id} />
                <button name="dir" value="up" disabled={mi === 0} className="btn-outline px-2.5" title="Yuqoriga">↑</button>
                <button name="dir" value="down" disabled={mi === course.modules.length - 1} className="btn-outline px-2.5" title="Pastga">↓</button>
              </form>
              <form action={updateModule} className="min-w-0 flex-1 space-y-2">
                <input type="hidden" name="id" value={m.id} />
                <div className="flex flex-wrap items-center gap-2">
                  <input name="title" className="input min-w-0 flex-1 font-medium" defaultValue={m.title} />
                  <SubmitButton className="btn-outline">Saqlash</SubmitButton>
                  <ConfirmButton formAction={deleteModule} message="Modul va undagi barcha darslar o'chiriladi. Davom etasizmi?">✕</ConfirmButton>
                </div>
                <input name="description" className="input text-zinc-600" defaultValue={m.description} placeholder="Modul haqida qisqa tavsif (ixtiyoriy)" />
              </form>
            </div>
            <ul className="divide-y divide-zinc-100">
              {m.lessons.map((l, li) => (
                <li key={l.id} className="flex items-center hover:bg-zinc-50">
                  <Link href={`/admin/lessons/${l.id}`} className="flex flex-1 items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span>{li + 1}. {l.title} {l.videoUrl && "🎬"}</span>
                    <span className="flex gap-1">
                      {l.minLevel > 1 && <span className="badge bg-amber-100 text-amber-700">{tariffName(l.minLevel)}+</span>}
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
