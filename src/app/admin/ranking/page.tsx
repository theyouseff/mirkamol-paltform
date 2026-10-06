import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { loadBoard, POINTS, type Period } from "@/lib/leaderboard";

const MEDAL: Record<number, string> = {
  1: "from-[#f8d27a] to-[#c9962a] text-[#2a1d05]",
  2: "from-[#eef1f6] to-[#9aa5b4] text-[#1c2430]",
  3: "from-[#f3bd8a] to-[#a8641f] text-[#2a1503]",
};

// Admin reytingi: avval kurslar ro'yxati, kurs tanlansa shu kursdagi HAMMA o'quvchining o'rni va balli (0 ball olganlar ham, pastda).
export default async function AdminRankingPage({ searchParams }: { searchParams: Promise<{ course?: string; lb?: string }> }) {
  await requireAdmin(); // layout sahifa almashganda qayta ishlamaydi
  const { course: courseId, lb } = await searchParams;
  const period: Period = lb === "week" ? "week" : "all";

  if (!courseId) {
    const courses = await prisma.course.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, published: true, _count: { select: { enrollments: { where: { user: { role: "STUDENT" } } } } } },
    });
    const leaders = await Promise.all(courses.map((c) => loadBoard(c.id, "all").then((b) => b.rows[0] ?? null)));

    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reyting</h1>
          <p className="text-sm text-gold-text/80">Kursni tanlang — shu kursdagi o&apos;quvchilarning o&apos;rni va to&apos;plagan ballari ochiladi.</p>
        </div>
        {courses.length === 0 ? (
          <div className="card text-gold-text/75">Hali kurs yo&apos;q.</div>
        ) : (
          <ul className="space-y-2">
            {courses.map((c, i) => {
              const leader = leaders[i];
              return (
                <li key={c.id}>
                  <Link href={`/admin/ranking?course=${c.id}`} className="card flex items-center gap-4 transition hover:border-gold/40 hover:bg-white/[0.06]">
                    <span className="text-2xl" aria-hidden>🏆</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gold-text">
                        {c.title}
                        {!c.published && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 align-middle text-[11px] font-normal text-gold-text/70">qoralama</span>}
                      </p>
                      <p className="truncate text-xs text-gold-text/60">
                        {c._count.enrollments} o&apos;quvchi
                        {leader && (
                          <>
                            {" · "}1-o&apos;rin: <b className="text-gold-text/85">{leader.name}</b> ({leader.points.toLocaleString("ru-RU")} ball)
                          </>
                        )}
                      </p>
                    </div>
                    <span className="text-gold-text/50" aria-hidden>›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true } });
  if (!course) notFound();
  const board = await loadBoard(course.id, period, { includeZero: true });
  const emails = new Map(
    (await prisma.user.findMany({ where: { id: { in: board.rows.map((r) => r.userId) } }, select: { id: true, email: true } })).map((u) => [u.id, u.email]),
  );
  const scored = board.rows.filter((r) => r.points > 0).length;

  const tab = (p: Period, label: string) => (
    <Link
      href={`/admin/ranking?course=${course.id}${p === "week" ? "&lb=week" : ""}`}
      className={`rounded-xl border px-4 py-2 text-sm font-medium transition active:scale-95 ${period === p ? "border-gold/50 bg-gradient-to-r from-gold/25 to-transparent text-gold-text shadow-[inset_3px_0_0_#c9a227]" : "border-white/10 bg-white/5 text-gold-text/75 hover:bg-white/10"}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="max-w-4xl space-y-5">
      <Link href="/admin/ranking" className="text-sm text-gold-text/70 hover:text-gold-text">‹ Kurslar</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-gold-text/80">
            {board.participants} o&apos;quvchi · {scored} tasi ball olgan · kursda {board.totalLessons} dars
          </p>
        </div>
        <div className="flex gap-2">
          {tab("all", "Umumiy")}
          {tab("week", "Shu hafta")}
        </div>
      </div>

      {board.rows.length === 0 ? (
        <div className="card text-gold-text/75">Bu kursga hali o&apos;quvchi yozilmagan.</div>
      ) : (
        <ol className="space-y-2">
          {board.rows.map((r) => {
            const zero = r.points === 0;
            const rank = zero ? null : r.rank; // ball olmaganlarga o'rin berilmaydi
            const medal = rank ? MEDAL[rank] : undefined;
            const pct = board.totalLessons ? Math.round((r.lessonsDone / board.totalLessons) * 100) : 0;
            return (
              <li key={r.userId} className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 sm:gap-4 sm:px-4 ${zero ? "border-white/5 bg-white/[0.02] opacity-70" : rank && rank <= 3 ? "border-gold/25 bg-white/[0.06]" : "border-white/10 bg-white/[0.03]"}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${medal ? `bg-gradient-to-b ${medal} shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]` : "bg-white/10 text-gold-text/80"}`}>{rank ?? "–"}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/analytics?student=${r.userId}`} className="block truncate font-semibold text-gold-text hover:underline">{r.name}</Link>
                  <p className="truncate text-xs text-gold-text/55">{emails.get(r.userId)}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-gold-text/65">
                    <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-white/10 sm:w-32">
                      <span className="block h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="truncate">
                      {r.lessonsDone}/{board.totalLessons} dars{r.streak >= 2 && <span className="ml-2 text-gold-text/80">🔥 {r.streak} kun</span>}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums text-gold-text">{r.points.toLocaleString("ru-RU")}</p>
                  <p className="-mt-0.5 text-[11px] uppercase tracking-wider text-gold-text/50">ball</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-xs text-gold-text/55">
        {period === "week"
          ? `Shu hafta (oxirgi 7 kun): tugatilgan dars +${POINTS.weekLesson}, faol kun +${POINTS.weekDay}.`
          : `Dars tugatilsa +${POINTS.lesson}, tugamagan dars ${POINTS.partialMax} gacha, modul +${POINTS.module}, kurs +${POINTS.course}, ketma-ket kunlar har kun +${POINTS.streakPerDay} (${POINTS.streakMax} gacha). Teng ballda oldin yetgan yuqori.`}
      </p>
    </div>
  );
}
