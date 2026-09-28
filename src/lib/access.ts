import type { Lesson } from "@prisma/client";
import { prisma } from "./db";
import { formatDate } from "./format";

// open — ko'rish mumkin; scheduled — ochilish sanasi hali kelmagan; locked — kursga yozilmagan
export type LessonState = "open" | "scheduled" | "locked";

export function lessonState(lesson: Pick<Lesson, "openAt">, hasAccess: boolean, isAdmin = false): LessonState {
  if (isAdmin) return "open";
  if (!hasAccess) return "locked";
  if (lesson.openAt && lesson.openAt > new Date()) return "scheduled";
  return "open";
}

// Yopiq dars ustidagi izoh
export function lessonHint(lesson: Pick<Lesson, "openAt">, state: LessonState) {
  if (state === "locked") return "Yopiq dars";
  if (state === "scheduled" && lesson.openAt) return `${formatDate(lesson.openAt)} da ochiladi`;
  return null;
}

export function getEnrollment(userId: string, courseId: string) {
  return prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
}

// To'lov tasdiqlanganda chaqiriladi: buyurtmani PAID qiladi va kursga kirish ochadi.
export async function fulfillOrder(orderId: string, provider: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (order.status === "PAID") return order;

    const paid = await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", provider, paidAt: new Date() },
    });

    // O'quvchi akkaunti o'chirilgan bo'lsa (to'lov yozuvi qolgan), faqat holat o'zgaradi: ochiladigan akkaunt yo'q
    if (!order.userId) return paid;
    const existing = await tx.enrollment.findUnique({
      where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
    });
    if (!existing) await tx.enrollment.create({ data: { userId: order.userId, courseId: order.courseId } });
    return paid;
  });
}
