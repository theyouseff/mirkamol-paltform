import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { BarChart, type BarPoint } from "@/components/admin/BarChart";

// Toshkent vaqti: UTC+5, yozgi vaqt yo'q
const TZ = 5 * 3600 * 1000;
const DAY = 24 * 3600 * 1000;
const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

const RANGES = [
  { key: "7", label: "7 kun", unit: "day", count: 7 },
  { key: "30", label: "30 kun", unit: "day", count: 30 },
  { key: "90", label: "90 kun", unit: "week", count: 13 },
  { key: "365", label: "12 oy", unit: "month", count: 12 },
] as const;
type Range = (typeof RANGES)[number];

type Bucket = { start: number; end: number; label: string };

const dm = (t: number) => {
  const d = new Date(t + TZ);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

function buildBuckets(range: Range, now: number): Bucket[] {
  const todayStart = Math.floor((now + TZ) / DAY) * DAY - TZ;
  if (range.unit === "month") {
    const d = new Date(now + TZ);
    return Array.from({ length: range.count }, (_, i) => {
      const back = range.count - 1 - i;
      const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - back, 1) - TZ;
      const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - back + 1, 1) - TZ;
      return { start, end, label: MONTHS[new Date(start + TZ).getUTCMonth()] };
    });
  }
  const size = range.unit === "week" ? 7 * DAY : DAY;
  const lastEnd = todayStart + DAY;
  return Array.from({ length: range.count }, (_, i) => {
    const end = lastEnd - (range.count - 1 - i) * size;
    return { start: end - size, end, label: dm(end - size) };
  });
}

function bucketIndex(buckets: Bucket[], t: number) {
  for (let i = buckets.length - 1; i >= 0; i--) if (t >= buckets[i].start && t < buckets[i].end) return i;
  return -1;
}

const compact = (n: number) =>
  n >= 1e6 ? `${+(n / 1e6).toFixed(1)} mln` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)} ming` : `${Math.round(n)}`;
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

function Delta({ cur, prev }: { cur: number; prev: number }) {
  if (!prev) return <span className="text-xs text-zinc-400">{cur ? "oldingi davrda yo'q edi" : "—"}</span>;
  const d = Math.round(((cur - prev) / prev) * 100);
  if (d === 0) return <span className="text-xs text-zinc-500">o&apos;zgarishsiz</span>;
  return (
    <span className={`text-xs font-medium ${d > 0 ? "text-green-700" : "text-red-600"}`}>
      {d > 0 ? "▲" : "▼"} {Math.abs(d)}% <span className="font-normal text-zinc-400">oldingi davrga nisbatan</span>
    </span>
  );
}

function Meter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="tabular-nums text-zinc-600">{value}%</span>
    </div>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d = "30" } = await searchParams;
  const range = RANGES.find((r) => r.key === d) ?? RANGES[1];
  const now = Date.now();
  const buckets = buildBuckets(range, now);
  const from = buckets[0].start;
  const prevFrom = from - (now - from);
  const fromDate = new Date(from);
  const prevDate = new Date(prevFrom);

  const [paid, created, students, progress, courses, perUser] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PAID", paidAt: { gte: prevDate } },
      select: { amount: true, paidAt: true, courseId: true, utmSource: true, utmCampaign: true, provider: true },
    }),
    prisma.order.groupBy({ by: ["status"], where: { createdAt: { gte: fromDate } }, _count: true }),
    prisma.user.findMany({ where: { role: "STUDENT", createdAt: { gte: prevDate } }, select: { createdAt: true } }),
    prisma.lessonProgress.findMany({
      where: { completedAt: { gte: prevDate }, user: { role: "STUDENT" } },
      select: { userId: true, completedAt: true },
    }),
    prisma.course.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        author: { select: { name: true } },
        _count: { select: { enrollments: true } },
        modules: { select: { _count: { select: { lessons: true } } } },
      },
    }),
    // Har bir kursdagi har bir o'quvchi nechta dars tugatgan (faqat shu kursga yozilganlar)
    prisma.$queryRaw<{ courseId: string; done: bigint }[]>`
      SELECT m."courseId" AS "courseId", COUNT(*) AS done
      FROM "LessonProgress" lp
      JOIN "Lesson" l ON l.id = lp."lessonId"
      JOIN "Module" m ON m.id = l."moduleId"
      JOIN "Enrollment" e ON e."userId" = lp."userId" AND e."courseId" = m."courseId"
      GROUP BY m."courseId", lp."userId"`,
  ]);

  const inCur = (t: Date) => t.getTime() >= from;

  // Daromad va to'lovlar
  const revenueSeries = buckets.map(() => ({ sum: 0, count: 0 }));
  let revenue = 0, revenuePrev = 0, paidCount = 0, paidPrev = 0;
  const byCourse = new Map<string, { count: number; sum: number }>();
  const bySource = new Map<string, { count: number; sum: number }>();
  const byProvider = new Map<string, number>();
  for (const o of paid) {
    if (!o.paidAt) continue;
    if (!inCur(o.paidAt)) {
      revenuePrev += o.amount;
      paidPrev++;
      continue;
    }
    revenue += o.amount;
    paidCount++;
    const i = bucketIndex(buckets, o.paidAt.getTime());
    if (i >= 0) {
      revenueSeries[i].sum += o.amount;
      revenueSeries[i].count++;
    }
    const c = byCourse.get(o.courseId) ?? { count: 0, sum: 0 };
    byCourse.set(o.courseId, { count: c.count + 1, sum: c.sum + o.amount });
    const key = [o.utmSource || "To'g'ridan-to'g'ri", o.utmCampaign].filter(Boolean).join(" / ");
    const s = bySource.get(key) ?? { count: 0, sum: 0 };
    bySource.set(key, { count: s.count + 1, sum: s.sum + o.amount });
    const p = o.provider || "belgilanmagan";
    byProvider.set(p, (byProvider.get(p) ?? 0) + 1);
  }

  // Yangi o'quvchilar
  const studentSeries = buckets.map(() => 0);
  let newStudents = 0, newStudentsPrev = 0;
  for (const u of students) {
    if (!inCur(u.createdAt)) { newStudentsPrev++; continue; }
    newStudents++;
    const i = bucketIndex(buckets, u.createdAt.getTime());
    if (i >= 0) studentSeries[i]++;
  }

  // O'quv faolligi
  const lessonSeries = buckets.map(() => 0);
  const active = new Set<string>();
  const activePrev = new Set<string>();
  let lessonsDone = 0;
  for (const p of progress) {
    if (!inCur(p.completedAt)) { activePrev.add(p.userId); continue; }
    active.add(p.userId);
    lessonsDone++;
    const i = bucketIndex(buckets, p.completedAt.getTime());
    if (i >= 0) lessonSeries[i]++;
  }

  // Buyurtmalar holati (davrda yaratilganlar)
  const statusCount = { PAID: 0, PENDING: 0, CANCELED: 0 } as Record<string, number>;
  for (const g of created) statusCount[g.status] = (statusCount[g.status] ?? 0) + g._count;
  const ordersTotal = statusCount.PAID + statusCount.PENDING + statusCount.CANCELED;
  const statuses = [
    { key: "PAID", label: "To'langan", cls: "bg-green-600", n: statusCount.PAID },
    { key: "PENDING", label: "Kutilmoqda", cls: "bg-amber-400", n: statusCount.PENDING },
    { key: "CANCELED", label: "Bekor qilingan", cls: "bg-zinc-300", n: statusCount.CANCELED },
  ];

  // Kurslar bo'yicha o'zlashtirish
  const learn = new Map<string, number[]>();
  for (const r of perUser) {
    const list = learn.get(r.courseId) ?? [];
    list.push(Number(r.done));
    learn.set(r.courseId, list);
  }
  const courseRows = courses
    .map((c) => {
      const lessons = c.modules.reduce((s, m) => s + m._count.lessons, 0);
      const enrolled = c._count.enrollments;
      const done = learn.get(c.id) ?? [];
      const finished = lessons ? done.filter((n) => n >= lessons).length : 0;
      const avg = lessons && enrolled ? Math.round((done.reduce((s, n) => s + Math.min(n, lessons), 0) / (enrolled * lessons)) * 100) : 0;
      const sales = byCourse.get(c.id) ?? { count: 0, sum: 0 };
      return { ...c, lessons, enrolled, started: done.length, finished, avg, sales };
    })
    .sort((a, b) => b.sales.sum - a.sales.sum || b.enrolled - a.enrolled);

  const sources = [...bySource.entries()].sort((a, b) => b[1].sum - a[1].sum);
  const providers = [...byProvider.entries()].sort((a, b) => b[1] - a[1]);

  const kpis = [
    { label: "Daromad", value: formatPrice(revenue), cur: revenue, prev: revenuePrev },
    { label: "To'lovlar", value: paidCount, cur: paidCount, prev: paidPrev },
    { label: "O'rtacha chek", value: paidCount ? formatPrice(Math.round(revenue / paidCount)) : "—", cur: paidCount ? revenue / paidCount : 0, prev: paidPrev ? revenuePrev / paidPrev : 0 },
    { label: "Yangi o'quvchilar", value: newStudents, cur: newStudents, prev: newStudentsPrev },
    { label: "Faol o'quvchilar", value: active.size, cur: active.size, prev: activePrev.size, hint: "kamida 1 dars tugatgan" },
  ];

  const unitWord = range.unit === "day" ? "kun" : range.unit === "week" ? "hafta" : "oy";
  const revenueData: BarPoint[] = buckets.map((b, i) => ({
    label: range.unit === "week" ? `${b.label} haftasi` : b.label,
    tick: b.label,
    value: revenueSeries[i].sum,
    tip: `${formatPrice(revenueSeries[i].sum)} · ${revenueSeries[i].count} ta to'lov`,
  }));
  const studentData: BarPoint[] = buckets.map((b, i) => ({ label: b.label, tick: b.label, value: studentSeries[i], tip: `${studentSeries[i]} ta yangi o'quvchi` }));
  const lessonData: BarPoint[] = buckets.map((b, i) => ({ label: b.label, tick: b.label, value: lessonSeries[i], tip: `${lessonSeries[i]} ta dars tugatildi` }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analitika</h1>
          <p className="mt-1 text-sm text-gold-text/70">Har bir ustun — bir {unitWord}. Taqqoslash: oldingi xuddi shunday davr bilan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <Link key={r.key} href={`/admin/analytics?d=${r.key}`}
              className={`rounded-full px-3 py-1.5 text-sm ${r.key === range.key ? "gold-gloss relative isolate" : "border border-zinc-200 bg-white text-zinc-600"}`}>
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <p className="text-sm text-zinc-500">{k.label}{k.hint && <span className="text-zinc-400"> · {k.hint}</span>}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{k.value}</p>
            <div className="mt-1.5"><Delta cur={k.cur} prev={k.prev} /></div>
          </div>
        ))}
      </div>

      <BarChart title="Daromad dinamikasi" total={formatPrice(revenue)} data={revenueData} axis={compact} />

      <div className="grid gap-6 *:min-w-0 xl:grid-cols-2">
        <BarChart title="Yangi o'quvchilar" total={`${newStudents} ta`} data={studentData} axis={compact} />
        <BarChart title="Tugatilgan darslar" total={`${lessonsDone} ta`} data={lessonData} axis={compact} />
      </div>

      <div className="grid gap-6 *:min-w-0 xl:grid-cols-[1fr_2fr]">
        <div className="card">
          <h2 className="font-semibold">Buyurtmalar holati</h2>
          <p className="mt-1 text-sm text-zinc-500">Davrda yaratilgan {ordersTotal} ta buyurtma</p>
          <div className="mt-5 flex h-3 gap-0.5 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
            {statuses.filter((s) => s.n > 0).map((s) => (
              <div key={s.key} className={s.cls} style={{ width: `${pct(s.n, ordersTotal)}%` }} />
            ))}
          </div>
          <ul className="mt-5 space-y-2.5 text-sm">
            {statuses.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-sm ${s.cls}`} />{s.label}</span>
                <span className="tabular-nums"><b>{s.n}</b> <span className="text-zinc-400">· {pct(s.n, ordersTotal)}%</span></span>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-zinc-100 pt-4">
            <p className="text-sm text-zinc-500">To&apos;lov usullari</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {providers.map(([p, n]) => (
                <li key={p} className="flex justify-between"><span>{p}</span><span className="tabular-nums">{n}</span></li>
              ))}
            </ul>
            {providers.length === 0 && <p className="mt-2 text-sm text-zinc-400">Davrda to&apos;lov yo&apos;q</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Manba va kampaniyalar</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-left text-zinc-500">
                <tr><th className="pb-2 font-normal">UTM manba / kampaniya</th><th className="pb-2 text-right font-normal">To&apos;lovlar</th><th className="pb-2 text-right font-normal">Daromad</th><th className="pb-2 pl-4 font-normal">Ulush</th></tr>
              </thead>
              <tbody>
                {sources.map(([name, v]) => (
                  <tr key={name} className="border-t border-zinc-100">
                    <td className="py-2.5">{name}</td>
                    <td className="text-right tabular-nums">{v.count}</td>
                    <td className="text-right tabular-nums">{formatPrice(v.sum)}</td>
                    <td className="pl-4"><Meter value={pct(v.sum, revenue)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sources.length === 0 && <p className="text-sm text-zinc-500">Davrda to&apos;lov yo&apos;q</p>}
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <div className="px-6 pt-6 pb-4">
          <h2 className="font-semibold">Kurslar bo&apos;yicha</h2>
          <p className="mt-1 text-sm text-zinc-500">Sotuv va daromad — tanlangan davr uchun; o&apos;quvchilar va o&apos;zlashtirish — umumiy</p>
        </div>
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-6 py-3 font-normal">Kurs</th>
              <th className="text-right font-normal">Sotuv</th>
              <th className="text-right font-normal">Daromad</th>
              <th className="text-right font-normal">O&apos;quvchilar</th>
              <th className="text-right font-normal">Boshlagan</th>
              <th className="text-right font-normal">Tugatgan</th>
              <th className="px-6 font-normal">O&apos;rtacha o&apos;zlashtirish</th>
            </tr>
          </thead>
          <tbody>
            {courseRows.map((c) => (
              <tr key={c.id} className="border-t border-zinc-100">
                <td className="px-6 py-3">
                  <Link href={`/admin/courses/${c.id}`} className="hover:text-brand">{c.title}</Link>
                  <div className="text-xs text-zinc-400">{c.author?.name ?? "Muallifsiz"} · {c.lessons} ta dars</div>
                </td>
                <td className="text-right tabular-nums">{c.sales.count}</td>
                <td className="text-right tabular-nums">{formatPrice(c.sales.sum)}</td>
                <td className="text-right tabular-nums">{c.enrolled}</td>
                <td className="text-right tabular-nums">{c.started} <span className="text-zinc-400">({pct(c.started, c.enrolled)}%)</span></td>
                <td className="text-right tabular-nums">{c.finished} <span className="text-zinc-400">({pct(c.finished, c.enrolled)}%)</span></td>
                <td className="px-6"><Meter value={c.avg} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {courseRows.length === 0 && <p className="p-6 text-center text-zinc-500">Kurslar yo&apos;q</p>}
      </div>
    </div>
  );
}
