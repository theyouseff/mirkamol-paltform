"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createSession, requireUser } from "@/lib/auth";
import { MIN_PASSWORD } from "@/lib/constants";
import { getEnrollment, lessonState } from "@/lib/access";

export async function toggleLessonComplete(formData: FormData) {
  const user = await requireUser();
  const lessonId = String(formData.get("lessonId"));
  const lesson = await prisma.lesson.findUniqueOrThrow({ where: { id: lessonId }, include: { module: true } });
  const enrollment = await getEnrollment(user.id, lesson.module.courseId);
  if (lessonState(lesson, !!enrollment, user.role === "ADMIN") !== "open") throw new Error("Dars yopiq");

  const key = { userId_lessonId: { userId: user.id, lessonId } };
  if (await prisma.lessonProgress.findUnique({ where: key })) {
    await prisma.lessonProgress.delete({ where: key });
  } else {
    await prisma.lessonProgress.create({ data: { userId: user.id, lessonId } });
  }
  revalidatePath("/cabinet", "layout");
}

// Video oxirigacha ko'rilganda brauzer chaqiradi: darsni tugatilgan deb belgilaydi (takror chaqirilsa zarar yo'q).
export async function markLessonWatched(lessonId: string) {
  const user = await requireUser();
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson) return;
  const enrollment = await getEnrollment(user.id, lesson.module.courseId);
  if (lessonState(lesson, !!enrollment, user.role === "ADMIN") !== "open") return;
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: {},
    create: { userId: user.id, lessonId },
  });
  revalidatePath("/cabinet", "layout");
}

const clamp = (n: number, max: number) => (Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 0), max) : 0);

// Video ko'rilayotganda brauzer davriy chaqiradi: qaysi soniyada to'xtagani va qancha ko'rgani (admin "Analitika" uchun).
export async function saveWatchProgress(lessonId: string, position: number, duration: number, watched: number) {
  const user = await requireUser();
  if (user.role === "ADMIN") return; // adminning ko'rishlari o'quvchi analitikasiga kirmasin
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson) return;
  const enrollment = await getEnrollment(user.id, lesson.module.courseId);
  if (lessonState(lesson, !!enrollment, false) !== "open") return;

  const dur = clamp(duration, 86_400);
  const pos = clamp(position, dur || 86_400);
  const w = clamp(watched, dur || 86_400);
  const key = { userId_lessonId: { userId: user.id, lessonId } };
  const existing = await prisma.lessonWatch.findUnique({ where: key });
  await prisma.lessonWatch.upsert({
    where: key,
    create: { userId: user.id, lessonId, position: pos, duration: dur, watched: w },
    // Boshqa qurilmada kamroq ko'rilgan bo'lsa ham, ilgari ko'rilgan miqdor kamaymaydi
    update: { position: pos, duration: dur || existing?.duration || 0, watched: Math.max(existing?.watched ?? 0, w) },
  });
}

export type PasswordState = { error?: string; ok?: boolean };

export async function changePassword(_: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < MIN_PASSWORD) return { error: `Yangi parol kamida ${MIN_PASSWORD} ta belgidan iborat bo'lsin` };
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Joriy parol noto'g'ri" };
  const updated = await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  // Boshqa qurilmalardagi eski sessiyalar bekor bo'ladi; bu qurilma yangi sessiya bilan qoladi
  await createSession(updated);
  return { ok: true };
}
