import type { Lesson, Tariff } from "@prisma/client";
import { prisma } from "./db";

export type LessonState = "open" | "tariff" | "scheduled";

export function lessonState(lesson: Pick<Lesson, "minLevel" | "openAt">, tariff: Pick<Tariff, "level"> | null, isAdmin = false): LessonState {
  if (isAdmin) return "open";
  if (!tariff || tariff.level < lesson.minLevel) return "tariff";
  if (lesson.openAt && lesson.openAt > new Date()) return "scheduled";
  return "open";
}

export function getEnrollment(userId: string, courseId: string) {
  return prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: { tariff: true },
  });
}

// To'lov tasdiqlanganda chaqiriladi: buyurtmani PAID qiladi va kursga kirish ochadi.
// Agar o'quvchida past tarif bo'lsa — yuqorisiga ko'taradi.
export async function fulfillOrder(orderId: string, provider: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { tariff: true } });
    if (order.status === "PAID") return order;

    const paid = await tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", provider, paidAt: new Date() },
    });

    const existing = await tx.enrollment.findUnique({
      where: { userId_courseId: { userId: order.userId, courseId: order.tariff.courseId } },
      include: { tariff: true },
    });
    if (!existing) {
      await tx.enrollment.create({
        data: { userId: order.userId, courseId: order.tariff.courseId, tariffId: order.tariffId },
      });
    } else if (existing.tariff.level < order.tariff.level) {
      await tx.enrollment.update({ where: { id: existing.id }, data: { tariffId: order.tariffId } });
    }
    return paid;
  });
}
