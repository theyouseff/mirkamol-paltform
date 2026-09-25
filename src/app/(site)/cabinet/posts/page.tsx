import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PostCard } from "@/components/PostCard";

// Postlar: o'quvchi faqat o'zi yozilgan kurslarning postlarini ko'radi (o'qiydi, yoza olmaydi). Boshqa kurs postlari ko'rinmaydi.
export default async function PostsPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const user = await requireUser();
  const courses = await prisma.course.findMany({
    where: user.role === "ADMIN" ? {} : { enrollments: { some: { userId: user.id } } },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true },
  });
  const selected = courses.find((x) => x.id === c) ?? null;
  const ids = selected ? [selected.id] : courses.map((x) => x.id);
  const posts = ids.length
    ? await prisma.post.findMany({ where: { courseId: { in: ids } }, orderBy: { createdAt: "desc" }, take: 100, include: { course: { select: { title: true } } } })
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gold-text sm:text-3xl">Postlar</h1>
        <p className="mt-1 text-sm text-gold-text/65">Kuratorlaringizning kurs bo&apos;yicha e&apos;lon va yangiliklari</p>
      </div>

      {courses.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {[{ id: "", title: "Hammasi" }, ...courses].map((x) => {
            const active = (selected?.id ?? "") === x.id;
            return (
              <Link
                key={x.id || "all"}
                href={x.id ? `/cabinet/posts?c=${x.id}` : "/cabinet/posts"}
                className={`rounded-xl border px-4 py-2 text-sm transition ${active ? "border-gold/40 bg-gradient-to-r from-gold/20 to-transparent text-gold-text shadow-[inset_3px_0_0_#c9a227]" : "border-white/10 bg-white/5 text-gold-text/80 hover:bg-white/10"}`}
              >
                {x.title}
              </Link>
            );
          })}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="glass p-8 text-center text-gold-text/70">{courses.length === 0 ? "Sizga hali kurs ochilmagan" : "Hozircha postlar yo'q"}</div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={{ id: p.id, courseTitle: p.course.title, authorName: p.authorName, body: p.body, createdAt: p.createdAt }} />)
      )}
    </div>
  );
}
