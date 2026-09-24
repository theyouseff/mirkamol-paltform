import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const [courses, enrollments] = await Promise.all([
    prisma.course.findMany({ where: { published: true }, orderBy: { createdAt: "desc" } }),
    session ? prisma.enrollment.findMany({ where: { userId: session.userId }, select: { courseId: true } }) : [],
  ]);
  const mine = new Set(enrollments.map((e) => e.courseId));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Kurslar</h1>
      <p className="mt-2 text-gold-text/80">O&apos;zingizga mos kursni tanlang</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          // Kursga yozilgan o'quvchi (yoki admin) bosganda kursning o'zi ochiladi; boshqalarga — kurs haqida sahifa
          <Link key={c.id} href={session && (mine.has(c.id) || session.role === "ADMIN") ? `/cabinet/courses/${c.slug}` : `/courses/${c.slug}`} className="card-gold flex flex-col">
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
        {courses.length === 0 && <p className="text-gold-text/80">Hozircha kurslar yo&apos;q.</p>}
      </div>
    </div>
  );
}
