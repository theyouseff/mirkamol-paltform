import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const u = await p.user.findUniqueOrThrow({ where: { email: "sinov-online@example.invalid" } });
  await p.user.update({ where: { id: u.id }, data: { lastSeenAt: new Date() } });
  await p.platformEntry.create({ data: { userId: u.id } });
  console.log("yangilandi", new Date().toISOString());
  await p.$disconnect();
})();
