import type { CSSProperties } from "react";
import { prisma } from "@/lib/db";
import { addDays, dayRange, formatClock, tashkentDay, timeAgo } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { VisitCalendar } from "@/components/VisitCalendar";
import type { DayNote } from "@/lib/day-status";
import { missedFrom } from "@/lib/activity";
import { StudentLink, SwitchProvider, TopPanel } from "@/components/admin/StudentSwitch";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

const pct = (part: number, whole: number) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0);
const duration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h} soat ${m} daq` : `${m} daq`;
};

// O'quvchilar analitikasi (faqat ko'rish). Admin ham, kurator ham shuni ishlatadi; basePath — sahifaning manzili.
export async function AnalyticsView({ basePath, q = "", student = "", courseIds, subtitle, canAnnotate = false }: { basePath: string; q?: string; student?: string; courseIds?: string[]; subtitle?: string; canAnnotate?: boolean }) {
  const weekAgo = Date.now() - 7 * 24 * 3600_000;

  const [users, lessons, watches, progress] = await Promise.all([
    prisma.user.findMany({ where: { role: "STUDENT", enrollments: { some: courseIds ? { courseId: { in: courseIds } } : {} } }, include: { enrollments: { select: { courseId: true } } } }),
    prisma.lesson.findMany({
      where: courseIds ? { module: { courseId: { in: courseIds } } } : {},
      select: { id: true, title: true, order: true, videoUrl: true, moduleId: true, module: { select: { title: true, order: true, courseId: true } } },
      orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    }),
    prisma.lessonWatch.findMany({ where: courseIds ? { lesson: { module: { courseId: { in: courseIds } } } } : {} }),
    prisma.lessonProgress.findMany({ select: { userId: true, lessonId: true } }),
  ]);

  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  // Dars raqami: kursdagi nechanchi modul va moduldagi nechanchi dars ("1-modul · 1-dars")
  const numbering = new Map<string, string>();
  {
    const moduleSeq = new Map<string, string[]>();
    const inModule = new Map<string, number>();
    for (const l of lessons) {
      const seq = moduleSeq.get(l.module.courseId) ?? [];
      if (!seq.includes(l.moduleId)) seq.push(l.moduleId);
      moduleSeq.set(l.module.courseId, seq);
      const n = (inModule.get(l.moduleId) ?? 0) + 1;
      inModule.set(l.moduleId, n);
      numbering.set(l.id, `${seq.indexOf(l.moduleId) + 1}-modul · ${n}-dars`);
    }
  }
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
  // Tanlangan o'quvchi platformaga kirgan kunlar (kalendar uchun)
  // Oxirgi 7 kunda (kechagacha) eng ko'p kun qoldirganlar: kirmagan kunlar soni bo'yicha
  const today = tashkentDay();
  const windowStart = addDays(today, -7);
  const yesterday = addDays(today, -1);
  // Kurator izohlari: haftalik ro'yxatda "sababli/ko'rdi" kunlar hisobga olinmaydi
  const weekNotes = selected ? [] : await prisma.dayNote.findMany({ where: { day: { gte: windowStart } }, select: { userId: true, day: true, status: true } });
  const coveredBy = new Map<string, Set<string>>();
  for (const n of weekNotes) if (n.status === "SEEN" || n.status === "EXCUSED") coveredBy.set(n.userId, (coveredBy.get(n.userId) ?? new Set()).add(n.day));
  const weekLogins = selected ? [] : await prisma.loginDay.findMany({ where: { day: { gte: windowStart } }, select: { userId: true, day: true } });
  const visitedBy = new Map<string, Set<string>>();
  for (const l of weekLogins) visitedBy.set(l.userId, (visitedBy.get(l.userId) ?? new Set()).add(l.day));
  const skippers = all
    .map((r) => {
      const from = missedFrom(r.u.createdAt); // akkaunt ochilishidan yoki yozuv boshlanishidan oldingi kunlar hisobga olinmaydi
      // O'quvchi qaytib video ko'rgan kun (va undan oldingi kunlar) hisobdan chiqadi: qaytgach ro'yxatdan chiqib ketadi
      const lastWatchDay = r.last ? tashkentDay(r.last.updatedAt) : "";
      const strip = dayRange(windowStart, yesterday).map((d) => ({
        d,
        state: d < from ? "n/a" : visitedBy.get(r.u.id)?.has(d) ? "in" : coveredBy.get(r.u.id)?.has(d) ? "cleared" : d <= lastWatchDay ? "cleared" : "out",
      }));
      return { r, strip, missed: strip.filter((s) => s.state === "out").length };
    })
    .filter((x) => x.missed > 0)
    .sort((a, b) => b.missed - a.missed || (a.r.last?.updatedAt.getTime() ?? 0) - (b.r.last?.updatedAt.getTime() ?? 0));

  const dayNotes: DayNote[] = selected
    ? (await prisma.dayNote.findMany({ where: { userId: selected.u.id } })).map((n) => ({ day: n.day, status: n.status as DayNote["status"], reason: n.reason, author: n.authorName }))
    : [];
  const loginDays = selected ? (await prisma.loginDay.findMany({ where: { userId: selected.u.id }, select: { day: true } })).map((d) => d.day) : [];

  const href = (patch: { student?: string; q?: string }) => {
    const p = new URLSearchParams({ ...(q && { q }), ...(student && { student }), ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `${basePath}${p.size ? `?${p}` : ""}`;
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

  return (
    <SwitchProvider>
    <div className="space-y-8">
      <TopPanel id={selected?.u.id ?? "all"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Analitika</h1>
          <p className="mt-1 text-sm text-gold-text/70">{selected ? `${selected.u.name} · ${selected.u.email}` : subtitle ?? "Barcha o'quvchilar bo'yicha umumiy ma'lumot"}</p>
        </div>
        {selected && <StudentLink href={href({ student: "" })} className="btn-outline">← Umumiy ko&apos;rinish</StudentLink>}
      </div>

      {selected ? (
        <div className="space-y-4">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="card enter space-y-3" style={step(0)}>
            <p className="text-sm text-zinc-500">Oxirgi ko&apos;rgan dars</p>
            {selected.last && lastLesson ? (
              <>
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">{numbering.get(lastLesson.id)}</p>
                  <p className="mt-1 text-2xl font-bold">{lastLesson.title}</p>
                  <p className="text-sm text-zinc-500">{lastLesson.module.title}</p>
                </div>
                {/* Video o'rniga: o'quvchi videoning qayergacha borgani */}
                <div className="space-y-2 pt-2">
                  <div className="relative h-3 rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${pct(selected.last.position, selected.last.duration)}%` }} />
                    <span
                      className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand shadow"
                      style={{ left: `${pct(selected.last.position, selected.last.duration)}%` }}
                      aria-hidden
                    />
                  </div>
                  {/* Chiziq ostida: boshlanish, to'xtagan daqiqa (belgi tagida) va oxiri; chetlarga yaqin bo'lsa ustma-ust tushmasin */}
                  {(() => {
                    const at = pct(selected.last.position, selected.last.duration);
                    return (
                      <div className="relative h-5 text-xs text-zinc-500">
                        {at >= 10 && <span className="absolute left-0">0:00</span>}
                        <span className="absolute -translate-x-1/2 font-bold text-brand" style={{ left: `${Math.min(Math.max(at, 4), 96)}%` }}>
                          {formatClock(selected.last.position)}
                        </span>
                        {at <= 90 && <span className="absolute right-0">{formatClock(selected.last.duration)}</span>}
                      </div>
                    );
                  })()}
                  <p className="text-sm text-zinc-600">
                    To&apos;xtagan joyi: <b>{formatClock(selected.last.position)}</b> ({pct(selected.last.position, selected.last.duration)}%)
                  </p>
                </div>
              </>
            ) : (
              <p className="rounded-xl bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">O&apos;quvchi hali video ko&apos;rmagan</p>
            )}
          </div>
          <div className="enter" style={step(1)}>
            <VisitCalendar days={loginDays} today={today} from={missedFrom(selected.u.createdAt)} subject="student" annotate={canAnnotate ? { studentId: selected.u.id, notes: dayNotes } : undefined} />
          </div>
        </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card enter" style={step(2)}>
              <p className="text-sm text-zinc-500">To&apos;xtagan joyi</p>
              <p className="mt-2 text-2xl font-bold">{selected.last ? formatClock(selected.last.position) : "—"}</p>
              {selected.last && (
                <>
                  <div className="mt-2"><ProgressBar value={pct(selected.last.position, selected.last.duration)} /></div>
                  <p className="mt-1 text-xs text-zinc-500">{formatClock(selected.last.duration)} dan · {pct(selected.last.position, selected.last.duration)}%</p>
                  {lastLesson && <p className="mt-2 text-sm font-medium text-zinc-700">{numbering.get(lastLesson.id)}</p>}
                </>
              )}
            </div>
            <div className="card enter" style={step(3)}>
              <p className="text-sm text-zinc-500">Ko&apos;rib tugatgan videolari</p>
              <p className="mt-2 text-2xl font-bold">{selected.completed} <span className="text-base font-normal text-zinc-400">/ {selected.mine.length}</span></p>
              <div className="mt-2"><ProgressBar value={pct(selected.completed, selected.mine.length)} /></div>
            </div>
            <div className="card enter" style={step(4)}>
              <p className="text-sm text-zinc-500">Oxirgi faollik</p>
              <p className="mt-2 text-2xl font-bold">{selected.last ? timeAgo(selected.last.updatedAt) : "—"}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((m, i) => (
            <div key={m.label} className="card enter" style={step(i)}>
              <p className="text-sm text-zinc-500">{m.label}</p>
              <p className="mt-2 text-2xl font-bold">{m.value}</p>
            </div>
          ))}
        </div>

        <section className="card enter space-y-4" style={step(5)}>
          <div>
            <h2 className="font-semibold">Oxirgi 7 kunda eng ko&apos;p dars qoldirganlar</h2>
            <p className="text-sm text-zinc-500">Platformaga kirmagan kunlari soni bo&apos;yicha (kechagacha). O&apos;quvchi qaytib video ko&apos;rsa, ro&apos;yxatdan chiqib ketadi. Doiralar: <span className="text-amber-500">●</span> kirgan, <span className="text-red-500">●</span> kirmagan, <span className="text-zinc-300">●</span> hisobga olinmaydi (qaytib video ko&apos;rgan yoki kurator «sababli» / «dars ko&apos;rdi» deb belgilagan).</p>
          </div>
          {skippers.length > 0 ? (
            <ul className="divide-y divide-zinc-100">
              {skippers.map(({ r, strip, missed }) => (
                <li key={r.u.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                  <div className="min-w-0">
                    <StudentLink href={href({ student: r.u.id })} className="font-medium text-brand hover:underline">{r.u.name}</StudentLink>
                    <p className="truncate text-xs text-zinc-400">{r.u.email} · {r.last ? `oxirgi faollik ${timeAgo(r.last.updatedAt)}` : "hali video ko'rmagan"}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1" aria-label="Oxirgi 7 kun">
                      {strip.map((s) => (
                        <span
                          key={s.d}
                          title={`${s.d}: ${s.state === "in" ? "kirgan" : s.state === "out" ? "kirmagan" : s.state === "cleared" ? "kirmagan, lekin keyin qaytib video ko'rgan" : "hisobga olinmaydi"}`}
                          className={`h-3.5 w-3.5 rounded-full ${s.state === "in" ? "bg-amber-400" : s.state === "out" ? "bg-red-500" : "bg-zinc-200"}`}
                        />
                      ))}
                    </div>
                    <span className="badge shrink-0 bg-red-100 text-red-700">{missed} kun kirmagan</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-500">Hozircha hech kim kun qoldirmagan. Kirgan kunlar yozuvi 24-sentabrdan boshlangan, shuning uchun bu ro&apos;yxat ertadan boshlab to&apos;lib boradi.</p>
          )}
        </section>
        </>
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

        <div className="card overflow-x-auto p-0 max-lg:hidden">
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
                          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{numbering.get(lastLesson.id)}</p>
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

        {/* Telefon va planshet: jadval o'rniga kartochkalar */}
        <div className="space-y-3 lg:hidden">
          {rows.map(({ u, mine, completed, last }) => {
            const lastLesson = last && lessonById.get(last.lessonId);
            const active = u.id === student;
            return (
              <div key={u.id} className={`card space-y-3 p-4 text-sm transition-colors duration-300 ${active ? "bg-amber-50" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <StudentLink href={href({ student: u.id })} className="font-medium text-brand">{u.name}</StudentLink>
                    <p className="truncate text-xs text-zinc-400">{u.email}</p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">{last ? timeAgo(last.updatedAt) : "—"}</span>
                </div>
                <div>
                  <ProgressBar value={pct(completed, mine.length)} />
                  <p className="mt-1 text-xs text-zinc-500">{completed} / {mine.length} dars tugatgan</p>
                </div>
                {last && lastLesson ? (
                  <p className="text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">{numbering.get(lastLesson.id)} · {lastLesson.title}</span> · to&apos;xtagan joyi <b>{formatClock(last.position)}</b> / {formatClock(last.duration)}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400">Hali video ko&apos;rmagan</p>
                )}
                <StudentLink href={href({ student: u.id })} className={active ? "text-xs font-medium text-zinc-400" : "btn-outline px-3 py-1.5 text-xs"}>{active ? "Tanlangan" : "Ko'rish →"}</StudentLink>
              </div>
            );
          })}
          {rows.length === 0 && <p className="card text-center text-zinc-500">O&apos;quvchilar topilmadi</p>}
        </div>
      </section>
    </div>
    </SwitchProvider>
  );
}
