"use server";

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
