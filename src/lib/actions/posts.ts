"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export type PostState = { error?: string; ok?: boolean };

const MAX_LEN = 4000;

// Post yozish — faqat kurator va faqat o'ziga biriktirilgan kurs uchun. O'quvchi (va admin) yoza olmaydi.
export async function createPost(_: PostState, formData: FormData): Promise<PostState> {
  const user = await requireUser();
  if (user.role !== "CURATOR") return { error: "Post yozish faqat kuratorlar uchun" };
  const courseId = String(formData.get("courseId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, MAX_LEN);
  if (!courseId) return { error: "Kursni tanlang" };
  if (!body) return { error: "Post matnini yozing" };
  const assigned = await prisma.curatorCourse.findUnique({ where: { curatorId_courseId: { curatorId: user.id, courseId } }, select: { courseId: true } });
  if (!assigned) return { error: "Bu kurs sizga biriktirilmagan" };

  // Spamdan himoya: minutiga 10 tadan ko'p emas
  const recent = await prisma.post.count({ where: { authorId: user.id, createdAt: { gt: new Date(Date.now() - 60_000) } } });
  if (recent >= 10) return { error: "Juda tez yozyapsiz, biroz kuting" };

  await prisma.post.create({ data: { courseId, authorId: user.id, authorName: user.name, body } });
  revalidatePath("/cabinet/posts");
  revalidatePath("/curator/posts");
  return { ok: true };
}

// Kurator faqat o'zi yozgan postni o'chira oladi; admin — istalganini.
export async function deletePost(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const post = await prisma.post.findUnique({ where: { id }, select: { authorId: true } });
  if (!post) return;
  if (user.role !== "ADMIN" && !(user.role === "CURATOR" && post.authorId === user.id)) return;
  await prisma.post.delete({ where: { id } });
  revalidatePath("/cabinet/posts");
  revalidatePath("/curator/posts");
}
