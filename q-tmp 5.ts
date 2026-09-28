import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const lor = await p.course.findFirstOrThrow({ where: { title: "Bolajak LORlar uchun" } });
  const u = await p.user.create({ data: { name: "SINOV tomosha", email: "sinov-tomosha@example.invalid", passwordHash: "x" } });
  await p.enrollment.create({ data: { userId: u.id, courseId: lor.id } });
  console.log(u.id);
  await p.$disconnect();
})();
