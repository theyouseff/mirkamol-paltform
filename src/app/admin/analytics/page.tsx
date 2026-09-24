import { prisma } from "@/lib/db";
import { formatClock, timeAgo } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";

const pct = (part: number, whole: number) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0);

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const weekAgo = Date.now() - 7 * 24 * 3600_000;

  const [users, lessons, watches, progress] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT", enrollments: { some: {} } }, include: { enrollments: { select: { courseId: true } } } }),
    prisma.lesson.findMany({
      select: { id: true, title: true, order: true, module: { select: { title: true, order: true, courseId: true } } },
      orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    }),
    prisma.lessonWatch.findMany(),
    prisma.lessonProgress.findMany({ select: { userId: true, lessonId: true } }),
  ]);

  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const lessonsByCourse = new Map<string, typeof lessons>();
  for (const l of lessons) lessonsByCourse.set(l.module.courseId, [...(lessonsByCourse.get(l.module.courseId) ?? []), l]);
  const done = new Set(progress.map((p) => `${p.userId}:${p.lessonId}`));
  const watchByUser = new Map<string, typeof watches>();
  for (const w of watches) watchByUser.set(w.userId, [...(watchByUser.get(w.userId) ?? []), w]);

  // Har bir o'quvchi bo'yicha hisob
  const rows = users
    .map((u) => {
      const mine = u.enrollments.flatMap((e) => lessonsByCourse.get(e.courseId) ?? []);
      const myWatches = new Map((watchByUser.get(u.id) ?? []).map((w) => [w.lessonId, w]));
      const completed = mine.filter((l) => done.has(`${u.id}:${l.id}`)).length;
      const last = [...myWatches.values()].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      return { u, mine, myWatches, completed, last };
    })
    .filter((r) => !q || r.u.name.toLowerCase().includes(q.toLowerCase()) || r.u.email.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.last?.updatedAt.getTime() ?? 0) - (a.last?.updatedAt.getTime() ?? 0));

  // Umumiy metrikalar
  const active = new Set(watches.filter((w) => w.updatedAt.getTime() >= weekAgo).map((w) => w.userId)).size;
  const totalCompleted = rows.reduce((n, r) => n + r.completed, 0);
  const avgProgress = rows.length ? Math.round(rows.reduce((n, r) => n + pct(r.completed, r.mine.length), 0) / rows.length) : 0;
  const watchedSeconds = watches.reduce((n, w) => n + w.watched, 0);
  const hours = Math.floor(watchedSeconds / 3600);
  const minutes = Math.floor((watchedSeconds % 3600) / 60);
  const metrics = [
    { label: "O'quvchilar", value: users.length },
    { label: "Faol (oxirgi 7 kun)", value: active },
    { label: "Tugatilgan darslar", value: totalCompleted },
    { label: "O'rtacha progress", value: `${avgProgress}%` },
    { label: "Jami ko'rilgan vaqt", value: hours ? `${hours} soat ${minutes} daq` : `${minutes} daq` },
  ];

  // Darslar bo'yicha: videolar qayergacha ko'rilgan
  const perLesson = lessons.map((l) => {
    const ws = watches.filter((w) => w.lessonId === l.id && w.duration > 0);
    const avg = ws.length ? Math.round(ws.reduce((n, w) => n + pct(w.watched, w.duration), 0) / ws.length) : 0;
    return { l, viewers: ws.length, finished: progress.filter((p) => p.lessonId === l.id).length, avg };
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Analitika</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="card">
            <p className="text-sm text-zinc-500">{m.label}</p>
            <p className="mt-2 text-2xl font-bold">{m.value}</p>
          </div>
        ))}
      </div>

      <section className="card space-y-4">
        <div>
          <h2 className="font-semibold">Videolar qayergacha ko&apos;rilgan</h2>
          <p className="text-sm text-zinc-500">Har bir dars bo&apos;yicha: nechta o&apos;quvchi ko&apos;rgan, o&apos;rtacha qancha qismi ko&apos;rilgan va nechtasi oxirigacha ko&apos;rgan.</p>
        </div>
        <ul className="space-y-3">
          {perLesson.map(({ l, viewers, finished, avg }) => (
            <li key={l.id} className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_220px_170px]">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{l.title}</p>
                <p className="truncate text-xs text-zinc-400">{l.module.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1"><ProgressBar value={avg} /></div>
                <span className="w-10 text-right text-sm font-medium">{avg}%</span>
              </div>
              <p className="text-xs text-zinc-500">{viewers} ta ko&apos;rgan · {finished} ta tugatgan</p>
            </li>
          ))}
          {perLesson.length === 0 && <p className="text-sm text-zinc-500">Darslar yo&apos;q</p>}
        </ul>
        {watches.length === 0 && <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-500">Hali hech kim video ko&apos;rmagan. Ma&apos;lumotlar o&apos;quvchilar video ko&apos;rgan sari to&apos;lib boradi.</p>}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold">O&apos;quvchilar</h2>
          <form className="flex gap-2">
            <input name="q" defaultValue={q} className="input w-64" placeholder="Ism yoki email" />
            <button className="btn-outline">Qidirish</button>
          </form>
        </div>

        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr><th className="px-4 py-3">O&apos;quvchi</th><th>Progress</th><th>Oxirgi ko&apos;rgan dars</th><th>Oxirgi faollik</th></tr>
            </thead>
            <tbody>
              {rows.map(({ u, mine, myWatches, completed, last }) => {
                const lastLesson = last && lessonById.get(last.lessonId);
                return (
                  <tr key={u.id} className="border-t border-zinc-100 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-zinc-400">{u.email}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-brand">Darslar bo&apos;yicha</summary>
                        <ul className="mt-2 w-[520px] max-w-full space-y-2">
                          {mine.map((l) => {
                            const w = myWatches.get(l.id);
                            const isDone = done.has(`${u.id}:${l.id}`);
                            return (
                              <li key={l.id} className="grid grid-cols-[minmax(0,1fr)_120px_110px] items-center gap-2 text-xs">
                                <span className="truncate">{isDone ? "✓ " : ""}{l.title}</span>
                                <ProgressBar value={isDone ? 100 : w ? pct(w.watched, w.duration) : 0} />
                                <span className="text-zinc-500">{w ? `${formatClock(w.position)} / ${formatClock(w.duration)}` : "ko'rilmagan"}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    </td>
                    <td className="w-48 py-3 pr-4">
                      <ProgressBar value={pct(completed, mine.length)} />
                      <p className="mt-1 text-xs text-zinc-500">{completed} / {mine.length} dars tugatgan</p>
                    </td>
                    <td className="py-3 pr-4">
                      {last && lastLesson ? (
                        <>
                          <p className="font-medium">{lastLesson.title}</p>
                          <p className="text-xs text-zinc-500">
                            To&apos;xtagan joyi: <b>{formatClock(last.position)}</b> / {formatClock(last.duration)} ({pct(last.position, last.duration)}%)
                          </p>
                        </>
                      ) : (
                        <span className="text-zinc-400">Hali video ko&apos;rmagan</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-zinc-500">{last ? timeAgo(last.updatedAt) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-6 text-center text-zinc-500">O&apos;quvchilar topilmadi</p>}
        </div>
      </section>
    </div>
  );
}
