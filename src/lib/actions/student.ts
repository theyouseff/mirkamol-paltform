"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getEnrollment, lessonState } from "@/lib/access";

export async function toggleLessonComplete(formData: FormData) {
  const user = await requireUser();
  const lessonId = String(formData.get("lessonId"));
  const lesson = await prisma.lesson.findUniqueOrThrow({ where: { id: lessonId }, include: { module: true } });
  const enrollment = await getEnrollment(user.id, lesson.module.courseId);
  if (lessonState(lesson, enrollment?.tariff ?? null, user.role === "ADMIN") !== "open") throw new Error("Dars yopiq");

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
  if (next.length < 6) return { error: "Yangi parol kamida 6 ta belgidan iborat bo'lsin" };
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Joriy parol noto'g'ri" };
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: true };
}
