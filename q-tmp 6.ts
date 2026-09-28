import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const u = await p.user.findUniqueOrThrow({ where: { email: "sinov-tomosha@example.invalid" }, select: { watchingAt: true, lastSeenAt: true } });
  console.log("video o'ynayotganda:", { watchingAgoSec: u.watchingAt ? Math.round((Date.now() - u.watchingAt.getTime()) / 1000) : null, seenAgoSec: u.lastSeenAt ? Math.round((Date.now() - u.lastSeenAt.getTime()) / 1000) : null });
  await p.$disconnect();
})();
