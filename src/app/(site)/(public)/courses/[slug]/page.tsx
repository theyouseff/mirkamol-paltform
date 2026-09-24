import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { adminContactUrl } from "@/lib/config";
import { BrandScope } from "@/components/BrandScope";
import { CourseBrand } from "@/components/CourseBrand";

// Sotuv sahifasi: hamma ko'radi, lekin faqat dastur (modul va dars nomlari). Video va matn — faqat kabinetda.
export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug },
    include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, duration: true } } } } },
  });
  if (!course || !course.published) notFound();
  const session = await getSession();
  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <BrandScope color={course.brandColor}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/courses" className="text-sm font-medium text-gold-text/80 hover:text-gold-text">← Kurslar</Link>

        <div className="mt-5 max-w-3xl">
          {(course.logoUrl || course.brandName) && <CourseBrand course={course} className="mb-4 block" />}
          <h1 className="text-3xl font-bold sm:text-4xl">{course.title}</h1>
          {course.subtitle && <p className="mt-3 text-lg text-gold-text/85">{course.subtitle}</p>}
          {course.description && <p className="mt-5 whitespace-pre-line leading-relaxed text-gold-text/80">{course.description}</p>}
          <p className="mt-6 text-sm font-medium uppercase tracking-widest text-gold-text/70">
            {course.modules.length} ta modul · {lessonCount} ta video dars
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {session ? (
              <Link href={`/cabinet/courses/${course.slug}`} className="btn-primary">Kursni ochish</Link>
            ) : (
              <>
                {adminContactUrl ? (
                  <a href={adminContactUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">Kursga yozilish</a>
                ) : (
                  <p className="text-sm text-gold-text/80">Kursga yozilish uchun adminga yozing</p>
                )}
                <Link href="/login" className="btn-outline">Kirish</Link>
              </>
            )}
          </div>
        </div>

        <h2 className="mt-12 text-2xl font-bold">Kurs dasturi</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {course.modules.map((m, i) => (
            <section key={m.id} className="glass p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-gold-text/60">{i + 1}-modul</p>
              <h3 className="mt-1 text-lg font-bold">{m.title}</h3>
              {m.description && <p className="mt-1 text-sm text-gold-text/75">{m.description}</p>}
              <ul className="mt-4 space-y-2">
                {m.lessons.map((l, li) => (
                  <li key={l.id} className="flex items-start gap-3 text-sm text-gold-text/85">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">{li + 1}</span>
                    <span className="min-w-0 flex-1 leading-snug">{l.title}</span>
                    {l.duration && <span className="shrink-0 text-xs text-gold-text/60">{l.duration}</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </BrandScope>
  );
}
