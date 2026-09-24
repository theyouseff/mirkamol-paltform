import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatClock, timeAgo } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";

const pct = (part: number, whole: number) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0);
const duration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h} soat ${m} daq` : `${m} daq`;
};

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ q?: string; student?: string }> }) {
  const { q = "", student = "" } = await searchParams;
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
  const all = users
    .map((u) => {
      const mine = u.enrollments.flatMap((e) => lessonsByCourse.get(e.courseId) ?? []);
      const myWatches = new Map((watchByUser.get(u.id) ?? []).map((w) => [w.lessonId, w]));
      const completed = mine.filter((l) => done.has(`${u.id}:${l.id}`)).length;
      const last = [...myWatches.values()].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      const watchedSeconds = [...myWatches.values()].reduce((n, w) => n + w.watched, 0);
      return { u, mine, myWatches, completed, last, watchedSeconds };
    })
    .sort((a, b) => (b.last?.updatedAt.getTime() ?? 0) - (a.last?.updatedAt.getTime() ?? 0));
  const rows = all.filter((r) => !q || r.u.name.toLowerCase().includes(q.toLowerCase()) || r.u.email.toLowerCase().includes(q.toLowerCase()));
  const selected = all.find((r) => r.u.id === student);

  const href = (patch: { student?: string; q?: string }) => {
    const p = new URLSearchParams({ ...(q && { q }), ...(student && { student }), ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/admin/analytics${p.size ? `?${p}` : ""}`;
  };

  // ---- Metrikalar: tanlangan o'quvchiniki yoki hammaniki
  let metrics: { label: string; value: string | number; hint?: string }[];
  if (selected) {
    const lastLesson = selected.last && lessonById.get(selected.last.lessonId);
    metrics = [
      { label: "Progress", value: `${pct(selected.completed, selected.mine.length)}%`, hint: `${selected.completed} / ${selected.mine.length} dars tugatgan` },
      { label: "Jami ko'rilgan vaqt", value: duration(selected.watchedSeconds) },
      { label: "Boshlagan darslari", value: selected.myWatches.size, hint: `${selected.mine.length} tadan` },
      { label: "Oxirgi faollik", value: selected.last ? timeAgo(selected.last.updatedAt) : "—" },
      {
        label: "Oxirgi ko'rgan dars",
        value: lastLesson ? formatClock(selected.last!.position) : "—",
        hint: lastLesson ? `${lastLesson.title} · to'xtagan joyi (${formatClock(selected.last!.duration)} dan)` : "Hali video ko'rmagan",
      },
    ];
  } else {
    const active = new Set(watches.filter((w) => w.updatedAt.getTime() >= weekAgo).map((w) => w.userId)).size;
    metrics = [
      { label: "O'quvchilar", value: all.length },
      { label: "Faol (oxirgi 7 kun)", value: active },
      { label: "Tugatilgan darslar", value: all.reduce((n, r) => n + r.completed, 0) },
      { label: "O'rtacha progress", value: `${all.length ? Math.round(all.reduce((n, r) => n + pct(r.completed, r.mine.length), 0) / all.length) : 0}%` },
      { label: "Jami ko'rilgan vaqt", value: duration(watches.reduce((n, w) => n + w.watched, 0)) },
    ];
  }

  // ---- "Videolar qayergacha ko'rilgan": tanlangan o'quvchi bo'yicha yoki darslar bo'yicha umumiy
  const perLesson = lessons.map((l) => {
    const ws = watches.filter((w) => w.lessonId === l.id && w.duration > 0);
    return {
      l,
      avg: ws.length ? Math.round(ws.reduce((n, w) => n + pct(w.watched, w.duration), 0) / ws.length) : 0,
      viewers: ws.length,
      finished: progress.filter((p) => p.lessonId === l.id).length,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Analitika</h1>
          <p className="mt-1 text-sm text-gold-text/70">{selected ? `${selected.u.name} · ${selected.u.email}` : "Barcha o'quvchilar bo'yicha umumiy ma'lumot"}</p>
        </div>
        {selected && <Link href={href({ student: "" })} className="btn-outline">← Umumiy ko&apos;rinish</Link>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="card">
            <p className="text-sm text-zinc-500">{m.label}</p>
            <p className="mt-2 text-2xl font-bold">{m.value}</p>
            {m.hint && <p className="mt-1 text-xs text-zinc-500">{m.hint}</p>}
          </div>
        ))}
      </div>

      <section className="card space-y-4">
        <div>
          <h2 className="font-semibold">Videolar qayergacha ko&apos;rilgan</h2>
          <p className="text-sm text-zinc-500">
            {selected
              ? "Har bir darsda o'quvchi qancha qismini ko'rgan va qaysi daqiqada to'xtagan."
              : "Har bir dars bo'yicha: o'rtacha qancha qismi ko'rilgan, nechta o'quvchi ko'rgan va nechtasi oxirigacha tugatgan."}
          </p>
        </div>
        <ul className="space-y-3">
          {selected
            ? selected.mine.map((l) => {
                const w = selected.myWatches.get(l.id);
                const isDone = done.has(`${selected.u.id}:${l.id}`);
                const value = isDone ? 100 : w ? pct(w.watched, w.duration) : 0;
                return (
                  <li key={l.id} className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_220px_170px]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{isDone && "✓ "}{l.title}</p>
                      <p className="truncate text-xs text-zinc-400">{l.module.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><ProgressBar value={value} /></div>
                      <span className="w-10 text-right text-sm font-medium">{value}%</span>
                    </div>
                    <p className="text-xs text-zinc-500">{w ? `To'xtagan: ${formatClock(w.position)} / ${formatClock(w.duration)}` : "Ko'rilmagan"}</p>
                  </li>
                );
              })
            : perLesson.map(({ l, avg, viewers, finished }) => (
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
          {(selected ? selected.mine.length : perLesson.length) === 0 && <p className="text-sm text-zinc-500">Darslar yo&apos;q</p>}
        </ul>
        {!selected && watches.length === 0 && (
          <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-500">Hali hech kim video ko&apos;rmagan. Ma&apos;lumotlar o&apos;quvchilar video ko&apos;rgan sari to&apos;lib boradi.</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold">O&apos;quvchilar <span className="text-sm font-normal text-gold-text/60">— metrikalarini ko&apos;rish uchun tanlang</span></h2>
          <form className="flex gap-2">
            {student && <input type="hidden" name="student" value={student} />}
            <input name="q" defaultValue={q} className="input w-64" placeholder="Ism yoki email" />
            <button className="btn-outline">Qidirish</button>
          </form>
        </div>

        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr><th className="px-4 py-3">O&apos;quvchi</th><th>Progress</th><th>Oxirgi ko&apos;rgan dars</th><th>Oxirgi faollik</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(({ u, mine, completed, last }) => {
                const lastLesson = last && lessonById.get(last.lessonId);
                const active = u.id === student;
                return (
                  <tr key={u.id} className={`border-t border-zinc-100 align-top ${active ? "bg-amber-50" : "hover:bg-zinc-50"}`}>
                    <td className="px-4 py-3">
                      <Link href={href({ student: u.id })} className="font-medium text-brand hover:underline">{u.name}</Link>
                      <p className="text-xs text-zinc-400">{u.email}</p>
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
                    <td className="py-3 pr-4 text-right">
                      <Link href={href({ student: u.id })} className={active ? "text-xs font-medium text-zinc-400" : "btn-outline px-2.5 py-1 text-xs"}>{active ? "Tanlangan" : "Ko'rish →"}</Link>
                    </td>
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
