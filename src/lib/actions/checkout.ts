"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fulfillOrder } from "@/lib/access";

export async function createOrder(formData: FormData) {
  const user = await requireUser();
  const tariff = await prisma.tariff.findUniqueOrThrow({ where: { id: String(formData.get("tariffId")) } });
  if (!tariff.active) throw new Error("Tarif faol emas");

  // Shu tarifga to'lanmagan buyurtma bo'lsa — qaytadan yaratmaymiz
  const pending = await prisma.order.findFirst({ where: { userId: user.id, tariffId: tariff.id, status: "PENDING" } });
  if (pending) redirect(`/checkout/order/${pending.id}`);

  const order = await prisma.$transaction(async (tx) => {
    const last = await tx.order.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
    return tx.order.create({
      data: {
        number: (last?.number ?? 1000) + 1,
        userId: user.id,
        tariffId: tariff.id,
        amount: tariff.price,
        utmSource: String(formData.get("utmSource") ?? ""),
        utmCampaign: String(formData.get("utmCampaign") ?? ""),
      },
    });
  });
  redirect(`/checkout/order/${order.id}`);
}

// Faqat PAYMENT_TEST_MODE=true bo'lganda: haqiqiy to'lovsiz buyurtmani tasdiqlaydi.
export async function payTestOrder(formData: FormData) {
  if (process.env.PAYMENT_TEST_MODE !== "true") throw new Error("Test rejim o'chirilgan");
  const user = await requireUser();
  const order = await prisma.order.findUniqueOrThrow({ where: { id: String(formData.get("orderId")) } });
  if (order.userId !== user.id) throw new Error("Ruxsat yo'q");
  await fulfillOrder(order.id, "test");
  redirect(`/checkout/order/${order.id}`);
}
