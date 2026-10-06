// Darslar videosini R2 ning OCHIQ manzilidan (https://pub-xxxx.r2.dev/nom.mp4 — uni har kim, hatto kirmagan odam ham ochishi mumkin)
// YOPIQ shaklga (r2:nom.mp4 — faqat kursga yozilgan o'quvchiga, 4 soat yaroqli imzolangan havola bilan) o'tkazadi.
//
//   npx tsx --env-file=.env scripts/privatize-videos.ts          ko'rib chiqish: nima o'zgarishini ko'rsatadi, bazaga TEGMAYDI
//   npx tsx --env-file=.env scripts/privatize-videos.ts --apply  haqiqatan o'zgartiradi (faqat R2'da fayli bor va imzolangan havola bilan ochiladigan darslar)
//
// Shart: .env da R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET (Vercel'da ham). Fayl R2'da topilmasa, dars o'zgarmaydi.
import { PrismaClient } from "@prisma/client";
import { r2KeyFromPublicUrl, signedR2Url } from "../src/lib/video-source";

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();

const retry = async <T>(f: () => Promise<T>) => {
  for (let k = 0; ; k++) {
    try {
      return await f();
    } catch (e) {
      if (k >= 5) throw e;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
};

async function main() {
  if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET) {
    throw new Error(".env da R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET yo'q — avval ularni yozing");
  }
  const lessons = await retry(() => prisma.lesson.findMany({ where: { videoUrl: { contains: ".r2.dev/" } }, select: { id: true, title: true, videoUrl: true } }));
  let ok = 0, bad = 0;
  for (const l of lessons) {
    const key = r2KeyFromPublicUrl(l.videoUrl);
    const label = l.title.slice(0, 44);
    if (!key) { console.log("O'TKAZIB YUBORILDI (havola tanilmadi):", label); bad++; continue; }
    // Yopiq havola bilan haqiqatan ochiladimi? (faqat 1 bayt so'raymiz)
    const signed = await signedR2Url(key);
    const res = signed ? await fetch(signed, { headers: { Range: "bytes=0-0" } }).catch(() => null) : null;
    if (!res || ![200, 206].includes(res.status)) { console.log(`XATO (R2 da ochilmadi, ${res?.status ?? "tarmoq"}):`, key, "←", label); bad++; continue; }
    if (apply) await retry(() => prisma.lesson.update({ where: { id: l.id }, data: { videoUrl: `r2:${key}` } }));
    console.log(apply ? "yopildi:" : "yopiladi:", `r2:${key}`, "←", label);
    ok++;
  }
  console.log(`\n${apply ? "Yopildi" : "Yopish mumkin"}: ${ok}, muammoli: ${bad}.`);
  if (!apply && ok) console.log("Haqiqatan o'zgartirish uchun --apply qo'shing. Shundan keyin R2 da ochiq kirishni (r2.dev) o'chiring.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
