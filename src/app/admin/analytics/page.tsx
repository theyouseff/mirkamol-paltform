import type { CSSProperties } from "react";
import { prisma } from "@/lib/db";
import { formatClock, kinescopeId, timeAgo, toEmbedUrl } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { StudentVideo } from "@/components/admin/StudentVideo";
import { VideoPlayer } from "@/components/VideoPlayer";
import { StudentLink, SwitchProvider, TopPanel } from "@/components/admin/StudentSwitch";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

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
      select: { id: true, title: true, order: true, videoUrl: true, module: { select: { title: true, order: true, courseId: true } } },
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
      return { u, mine, myWatches, completed, last };
    })
    .sort((a, b) => (b.last?.updatedAt.getTime() ?? 0) - (a.last?.updatedAt.getTime() ?? 0));
  const rows = all.filter((r) => !q || r.u.name.toLowerCase().includes(q.toLowerCase()) || r.u.email.toLowerCase().includes(q.toLowerCase()));
  const selected = all.find((r) => r.u.id === student);

  const href = (patch: { student?: string; q?: string }) => {
    const p = new URLSearchParams({ ...(q && { q }), ...(student && { student }), ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/admin/analytics${p.size ? `?${p}` : ""}`;
  };

  // ---- Umumiy metrikalar (o'quvchi tanlanmagan holda)
  const active = new Set(watches.filter((w) => w.updatedAt.getTime() >= weekAgo).map((w) => w.userId)).size;
  const metrics = [
    { label: "O'quvchilar", value: all.length },
    { label: "Faol (oxirgi 7 kun)", value: active },
    { label: "Tugatilgan darslar", value: all.reduce((n, r) => n + r.completed, 0) },
    { label: "O'rtacha progress", value: `${all.length ? Math.round(all.reduce((n, r) => n + pct(r.completed, r.mine.length), 0) / all.length) : 0}%` },
    { label: "Jami ko'rilgan vaqt", value: duration(watches.reduce((n, w) => n + w.watched, 0)) },
  ];

  // ---- Tanlangan o'quvchi: oxirgi ko'rgan video va uning 4 ta asosiy metrikasi
  const lastLesson = selected?.last ? lessonById.get(selected.last.lessonId) : undefined;
  const lastVideoId = lastLesson?.videoUrl ? kinescopeId(lastLesson.videoUrl) : null;

  return (
    <SwitchProvider>
    <div className="space-y-8">
      <TopPanel id={selected?.u.id ?? "all"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Analitika</h1>
          <p className="mt-1 text-sm text-gold-text/70">{selected ? `${selected.u.name} · ${selected.u.email}` : "Barcha o'quvchilar bo'yicha umumiy ma'lumot"}</p>
        </div>
        {selected && <StudentLink href={href({ student: "" })} className="btn-outline">← Umumiy ko&apos;rinish</StudentLink>}
      </div>

      {selected ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="card enter space-y-3" style={step(0)}>
            <p className="text-sm text-zinc-500">Oxirgi ko&apos;rgan video</p>
            {selected.last && lastLesson ? (
              <>
                {lastVideoId ? (
                  <StudentVideo key={lastLesson.id} videoId={lastVideoId} position={selected.last.position} embedUrl={toEmbedUrl(lastLesson.videoUrl) ?? lastLesson.videoUrl} />
                ) : lastLesson.videoUrl ? (
                  <VideoPlayer url={lastLesson.videoUrl} />
                ) : null}
                <div>
                  <p className="text-lg font-semibold">{lastLesson.title}</p>
                  <p className="text-sm text-zinc-500">{lastLesson.module.title}</p>
                </div>
              </>
            ) : (
              <p className="rounded-xl bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">O&apos;quvchi hali video ko&apos;rmagan</p>
            )}
          </div>
          <div className="grid content-start gap-4">
            <div className="card enter" style={step(1)}>
              <p className="text-sm text-zinc-500">To&apos;xtagan joyi</p>
              <p className="mt-2 text-2xl font-bold">{selected.last ? formatClock(selected.last.position) : "—"}</p>
              {selected.last && (
                <>
                  <div className="mt-2"><ProgressBar value={pct(selected.last.position, selected.last.duration)} /></div>
                  <p className="mt-1 text-xs text-zinc-500">{formatClock(selected.last.duration)} dan · {pct(selected.last.position, selected.last.duration)}%</p>
                </>
              )}
            </div>
            <div className="card enter" style={step(2)}>
              <p className="text-sm text-zinc-500">Ko&apos;rib tugatgan videolari</p>
              <p className="mt-2 text-2xl font-bold">{selected.completed} <span className="text-base font-normal text-zinc-400">/ {selected.mine.length}</span></p>
              <div className="mt-2"><ProgressBar value={pct(selected.completed, selected.mine.length)} /></div>
            </div>
            <div className="card enter" style={step(3)}>
              <p className="text-sm text-zinc-500">Oxirgi faollik</p>
              <p className="mt-2 text-2xl font-bold">{selected.last ? timeAgo(selected.last.updatedAt) : "—"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((m, i) => (
            <div key={m.label} className="card enter" style={step(i)}>
              <p className="text-sm text-zinc-500">{m.label}</p>
              <p className="mt-2 text-2xl font-bold">{m.value}</p>
            </div>
          ))}
        </div>
      )}
      </TopPanel>

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
                  <tr key={u.id} className={`border-t border-zinc-100 align-top transition-colors duration-300 ${active ? "bg-amber-50" : "hover:bg-zinc-50"}`}>
                    <td className="px-4 py-3">
                      <StudentLink href={href({ student: u.id })} className="font-medium text-brand hover:underline">{u.name}</StudentLink>
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
                      <StudentLink href={href({ student: u.id })} className={active ? "text-xs font-medium text-zinc-400" : "btn-outline px-2.5 py-1 text-xs"}>{active ? "Tanlangan" : "Ko'rish →"}</StudentLink>
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
    </SwitchProvider>
  );
}
