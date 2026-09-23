import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function CoursePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      tariffs: { where: { active: true }, orderBy: { level: "asc" } },
      modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, minLevel: true } } } },
    },
  });
  if (!course || !course.published) notFound();

  // Reklama manbasini buyurtmaga olib o'tamiz
  const utm = new URLSearchParams();
  if (sp.utm_source) utm.set("utm_source", sp.utm_source);
  if (sp.utm_campaign) utm.set("utm_campaign", sp.utm_campaign);
  const utmQuery = utm.size ? `?${utm}` : "";

  return (
    <div>
      <section className="bg-gradient-to-br from-violet-700 to-fuchsia-600 text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">{course.title}</h1>
          {course.subtitle && <p className="mt-4 text-xl text-white/85">{course.subtitle}</p>}
          <a href="#tariffs" className="btn mt-8 bg-white px-8 py-3 text-base text-violet-700 hover:bg-violet-50">Tarifni tanlash</a>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-16 px-4 py-16">
        {course.description && <section className="whitespace-pre-line text-lg leading-relaxed text-zinc-700">{course.description}</section>}

        <section>
          <h2 className="text-2xl font-bold">Kurs dasturi</h2>
          <div className="mt-6 space-y-4">
            {course.modules.map((m) => (
              <div key={m.id} className="card">
                <h3 className="font-semibold">{m.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-zinc-600">
                  {m.lessons.map((l) => (
                    <li key={l.id} className="flex items-center gap-2">
                      <span className="text-brand">▸</span> {l.title}
                      {l.minLevel > 1 && <span className="badge bg-amber-100 text-amber-700">{course.tariffs.find((t) => t.level >= l.minLevel)?.name ?? "Yuqori tarif"}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="tariffs">
          <h2 className="text-2xl font-bold">Tariflar</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {course.tariffs.map((t) => (
              <div key={t.id} className="card flex flex-col">
                <h3 className="text-xl font-semibold">{t.name}</h3>
                <div className="mt-3">
                  {t.oldPrice && <p className="text-sm text-zinc-400 line-through">{formatPrice(t.oldPrice)}</p>}
                  <p className="text-2xl font-bold text-brand">{formatPrice(t.price)}</p>
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-zinc-600">
                  {t.features.split("\n").filter(Boolean).map((f, i) => <li key={i}>✓ {f}</li>)}
                </ul>
                <Link href={`/checkout/${t.id}${utmQuery}`} className="btn-primary mt-6 w-full">Sotib olish</Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
