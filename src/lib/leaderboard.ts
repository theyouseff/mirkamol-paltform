import { prisma } from "./db";
import { addDays, tashkentDay } from "./format";

// Kurs reytingi (Leader board). Maqsad: ko'p video ko'rgan emas, balki KURSNI ketma-ket va to'liq o'tayotgan o'quvchi oldinda bo'lsin.
// Soxta ball olib bo'lmaydi: "dars ko'rildi" faqat videoning ≥80% haqiqiy ijrosida belgilanadi (surib o'tkazish sanalmaydi).
export const POINTS = {
  lesson: 100, // darsni ko'rib tugatdi
  partialMax: 60, // dars tugamagan: ko'rgan ulushiga qarab, ko'pi bilan shuncha (tugatgandan 100 ball — shuning uchun tugatish foydaliroq)
  module: 150, // moduldagi hamma darsni tugatdi
  course: 500, // kursdagi hamma darsni tugatdi
  streakPerDay: 15, // ketma-ket faol kunlar (har kun uchun)
  streakMax: 150, // ... eng ko'pi bilan 10 kun uchun
  weekLesson: 100, // haftalik: shu hafta tugatilgan dars
  weekDay: 20, // haftalik: shu hafta faol bo'lgan kun
} as const;

export type Period = "all" | "week";
export type Lesson = { id: string; moduleId: string };
export type Watch = { watched: number; duration: number };

// Bitta o'quvchining balli (toza hisob — bazaga tegmaydi, shuning uchun sinash oson).
// done: dars -> tugatilgan vaqt; days: faol bo'lgan kunlar ("2026-10-06"); today: bugungi kun (Toshkent).
export function scoreStudent(input: { lessons: Lesson[]; done: Map<string, Date>; watches: Map<string, Watch>; days: Set<string>; today: string; period: Period; now?: Date }) {
  const { lessons, done, watches, days, today, period } = input;
  const now = (input.now ?? new Date()).getTime();

  // Ketma-ket faol kunlar: bugun faol bo'lsa bugundan, aks holda kechadan boshlab orqaga (bugun hali kirmagan bo'lsa seriya uzilmaydi)
  let streak = 0;
  for (let d = days.has(today) ? today : addDays(today, -1); days.has(d); d = addDays(d, -1)) streak++;

  const lastDone = [...done.values()].reduce<Date | null>((m, d) => (!m || d > m ? d : m), null);
  const lessonsDone = lessons.filter((l) => done.has(l.id)).length;

  if (period === "week") {
    const since = now - 7 * 24 * 3600_000;
    const weekLessons = lessons.filter((l) => (done.get(l.id)?.getTime() ?? 0) >= since).length;
    let weekDays = 0;
    for (let i = 0; i < 7; i++) if (days.has(addDays(today, -i))) weekDays++;
    return { points: weekLessons * POINTS.weekLesson + weekDays * POINTS.weekDay, lessonsDone, streak, lastDone };
  }

  let points = 0;
  for (const l of lessons) {
    if (done.has(l.id)) points += POINTS.lesson;
    else {
      const w = watches.get(l.id);
      if (w && w.duration > 0) points += Math.floor(POINTS.partialMax * Math.min(1, w.watched / w.duration));
    }
  }
  const byModule = new Map<string, boolean>(); // modul -> hammasi tugatilganmi
  for (const l of lessons) byModule.set(l.moduleId, (byModule.get(l.moduleId) ?? true) && done.has(l.id));
  for (const finished of byModule.values()) if (finished) points += POINTS.module;
  if (lessons.length > 0 && lessonsDone === lessons.length) points += POINTS.course;
  points += Math.min(POINTS.streakMax, streak * POINTS.streakPerDay);
  return { points, lessonsDone, streak, lastDone };
}

// "Aziz Karimov" -> "Aziz K." (boshqa o'quvchilarga to'liq ism ko'rinmasin)
export function shortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "O'quvchi";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

export type BoardRow = { rank: number; userId: string; name: string; points: number; lessonsDone: number; streak: number };
export type Board = { rows: BoardRow[]; totalLessons: number; participants: number };

// Kursdagi hamma yozilgan o'quvchining reytingi. Faqat ball olganlar ro'yxatga kiradi; teng ballda kim oldin yetgan bo'lsa shu yuqori.
export async function loadBoard(courseId: string, period: Period): Promise<Board> {
  const today = tashkentDay();
  const lessons = await prisma.lesson.findMany({ where: { module: { courseId } }, select: { id: true, moduleId: true } });
  const enrolled = await prisma.enrollment.findMany({ where: { courseId, user: { role: "STUDENT" } }, select: { userId: true, user: { select: { name: true } } }, take: 5000 });
  const userIds = enrolled.map((e) => e.userId);
  if (lessons.length === 0 || userIds.length === 0) return { rows: [], totalLessons: lessons.length, participants: userIds.length };
  const lessonIds = lessons.map((l) => l.id);

  const [progress, watches, loginDays] = await Promise.all([
    prisma.lessonProgress.findMany({ where: { userId: { in: userIds }, lessonId: { in: lessonIds } }, select: { userId: true, lessonId: true, completedAt: true } }),
    period === "all" ? prisma.lessonWatch.findMany({ where: { userId: { in: userIds }, lessonId: { in: lessonIds } }, select: { userId: true, lessonId: true, watched: true, duration: true } }) : Promise.resolve([]),
    prisma.loginDay.findMany({ where: { userId: { in: userIds }, day: { gte: addDays(today, -30) } }, select: { userId: true, day: true } }),
  ]);

  const doneBy = new Map<string, Map<string, Date>>();
  for (const p of progress) (doneBy.get(p.userId) ?? doneBy.set(p.userId, new Map()).get(p.userId)!).set(p.lessonId, p.completedAt);
  const watchBy = new Map<string, Map<string, Watch>>();
  for (const w of watches) (watchBy.get(w.userId) ?? watchBy.set(w.userId, new Map()).get(w.userId)!).set(w.lessonId, { watched: w.watched, duration: w.duration });
  const daysBy = new Map<string, Set<string>>();
  for (const d of loginDays) (daysBy.get(d.userId) ?? daysBy.set(d.userId, new Set()).get(d.userId)!).add(d.day);

  const scored = enrolled
    .map((e) => ({
      userId: e.userId,
      name: e.user.name,
      ...scoreStudent({ lessons, done: doneBy.get(e.userId) ?? new Map(), watches: watchBy.get(e.userId) ?? new Map(), days: daysBy.get(e.userId) ?? new Set(), today, period }),
    }))
    .filter((s) => s.points > 0)
    .sort((a, b) => b.points - a.points || (a.lastDone?.getTime() ?? Infinity) - (b.lastDone?.getTime() ?? Infinity) || a.name.localeCompare(b.name));

  return {
    rows: scored.map((s, i) => ({ rank: i + 1, userId: s.userId, name: s.name, points: s.points, lessonsDone: s.lessonsDone, streak: s.streak })),
    totalLessons: lessons.length,
    participants: userIds.length,
  };
}
