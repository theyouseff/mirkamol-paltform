import { PrismaClient } from "@prisma/client";
import { markSeen } from "./src/lib/activity";
const p = new PrismaClient();
(async () => {
  const u = await p.user.findUniqueOrThrow({ where: { email: "sinov-online@example.invalid" } });
  await p.platformEntry.deleteMany({ where: { userId: u.id } });
  const entries = () => p.platformEntry.count({ where: { userId: u.id } });
  await p.user.update({ where: { id: u.id }, data: { lastSeenAt: null } });
  await markSeen(u.id); const a = await entries();                       // birinchi faollik -> kirdi
  await Promise.all([markSeen(u.id), markSeen(u.id), markSeen(u.id)]); const b = await entries(); // darhol takror/parallel -> yangi kirdi yo'q
  await p.user.update({ where: { id: u.id }, data: { lastSeenAt: new Date(Date.now() - 11 * 60_000) } });
  await Promise.all([markSeen(u.id), markSeen(u.id)]); const c = await entries(); // 11 daqiqa tanaffusdan keyin (parallel) -> aynan bitta yangi kirdi
  await p.user.update({ where: { id: u.id }, data: { lastSeenAt: new Date(Date.now() - 5 * 60_000) } });
  await markSeen(u.id); const d = await entries();                       // 5 daqiqa: yangi kirdi yo'q, lekin faollik yangilanadi
  const seen = (await p.user.findUniqueOrThrow({ where: { id: u.id } })).lastSeenAt!;
  console.log({ birinchi: a, takror: b, tanaffusdan_keyin: c, besh_daqiqa: d, lastSeenYangilandi: Date.now() - seen.getTime() < 5000 });
  const del = await p.user.deleteMany({ where: { email: "sinov-online@example.invalid" } });
  console.log("sinov o'chirildi:", del.count, "| foydalanuvchilar:", await p.user.count(), "| kirish yozuvlari:", await p.platformEntry.count());
  await p.$disconnect();
})();
