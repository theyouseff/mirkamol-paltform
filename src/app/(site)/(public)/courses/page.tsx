import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  // Kirgan o'quvchi faqat o'zi yozilgan kurslarni ko'radi (boshqa kurslar — ham nomi, ham sahifasi — yashirin). Admin hamma kursni, mehmon esa ochiq katalogni ko'radi.
  const mineOnly = !!session && session.role !== "ADMIN";
  const courses = await prisma.course.findMany({
    // Mehmon/admin: e'lon qilingan kurslar. O'quvchi: o'zi yozilgan kurslar (e'lon qilinmagan bo'lsa ham — uni admin o'zi ochgan)
    where: mineOnly ? { enrollments: { some: { userId: session.userId } } } : { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Kurslar</h1>
      <p className="mt-2 text-gold-text/80">O&apos;zingizga mos kursni tanlang</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          // Kirgan o'quvchi (yoki admin) bosganda kursning o'zi ochiladi; mehmonga — kurs haqida sahifa
          <Link key={c.id} href={session ? `/cabinet/courses/${c.slug}` : `/courses/${c.slug}`} className="card-gold flex flex-col">
            {c.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.coverUrl} alt="" className="mb-4 aspect-video w-full rounded-xl object-cover" />
            ) : (
              <div className="mb-4 aspect-video w-full rounded-xl bg-gradient-to-br from-ink-800 to-ink-500" />
            )}
            <h2 className="text-lg font-semibold">{c.title}</h2>
            <p className="mt-1 flex-1 text-sm text-zinc-500">{c.subtitle}</p>
          </Link>
        ))}
        {courses.length === 0 && <p className="text-gold-text/80">{mineOnly ? "Sizga hali kurs ochilmagan. Kurs ochish uchun adminga yozing." : "Hozircha kurslar yo'q."}</p>}
      </div>
    </div>
  );
}
