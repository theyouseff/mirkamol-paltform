"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { curatorCourseIds } from "@/lib/curator-scope";

export type EntryNotice = { id: string; name: string };
const RECENT_MS = 2 * 60_000;

// Admin/kuratorga: o'quvchilar platformaga kirgani haqida yangi xabarlar (since — oxirgi ko'rilgan vaqt). Kurator faqat o'z o'quvchilarini ko'radi.
export async function pollEntries(since: string | null): Promise<{ now: string; items: EntryNotice[] }> {
  const user = await requireUser();
  const now = new Date();
  if (user.role !== "ADMIN" && user.role !== "CURATOR") return { now: now.toISOString(), items: [] };
  const parsed = since ? new Date(since) : null;
  // Eski xabarlar qayta chiqmasin: faqat oxirgi 2 daqiqadagilari
  const from = parsed && !Number.isNaN(parsed.getTime()) ? new Date(Math.max(parsed.getTime(), now.getTime() - RECENT_MS)) : now;
  const courseIds = await curatorCourseIds(user);
  const rows = await prisma.platformEntry.findMany({
    where: { createdAt: { gt: from, lte: now }, user: { role: "STUDENT", ...(courseIds ? { enrollments: { some: { courseId: { in: courseIds } } } } : {}) } },
    orderBy: { createdAt: "asc" },
    take: 5,
    select: { id: true, user: { select: { name: true } } },
  });
  return { now: now.toISOString(), items: rows.map((r) => ({ id: r.id, name: r.user.name })) };
}
