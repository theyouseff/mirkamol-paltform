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
