// Dars kartochkalari uchun tayyor rasmlar (videoning 3-soniyadagi kadri). Rasm tayyor bo'lgani uchun modulga kirilganda
// u darhol ko'rinadi, video yuklanishini kutish kerak emas. Faqat Mac'da ishlaydi (frame.swift, ffmpeg kerak emas).
//
//   npx tsx --env-file=.env scripts/make-thumbs.ts          1) rasmlarni public/thumbs/<darsId>.jpg ga tayyorlaydi (bazaga tegmaydi)
//   git add public/thumbs && git commit && git push          2) rasmlarni saytga chiqaring, deploy tugashini kuting
//   npx tsx --env-file=.env scripts/make-thumbs.ts --link    3) rasmi bor darslarga baza'da manzil yozadi (shundan keyin sayt ishlata boshlaydi)
//
// Yangi dars qo'shilsa shu uchala qadamni takrorlang (mavjud rasmlarga tegmaydi; qayta olish uchun --force).
// Faqat https yoki r2: havolali videolar; Kinescope/YouTube darslar avvalgidek qoladi.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { ownVideoSrc } from "../src/lib/video-source";

const link = process.argv.includes("--link");
const force = process.argv.includes("--force");
const prisma = new PrismaClient();
const dir = "public/thumbs";

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
  const lessons = await retry(() =>
    prisma.lesson.findMany({
      where: { OR: [{ videoUrl: { startsWith: "https://" } }, { videoUrl: { startsWith: "r2:" } }] },
      orderBy: [{ module: { course: { title: "asc" } } }, { module: { order: "asc" } }, { order: "asc" }],
      select: { id: true, title: true, videoUrl: true, thumbUrl: true, module: { select: { order: true } } },
    }),
  );

  mkdirSync(dir, { recursive: true });
  let made = 0, linked = 0, failed = 0;
  for (const l of lessons) {
    const file = `${dir}/${l.id}.jpg`;
    const label = `M${l.module.order} ${l.title.slice(0, 40)}`;
    if (link) {
      if (!existsSync(file) || (l.thumbUrl === `/thumbs/${l.id}.jpg` && !force)) continue;
      await retry(() => prisma.lesson.update({ where: { id: l.id }, data: { thumbUrl: `/thumbs/${l.id}.jpg` } }));
      console.log("ulandi:", label);
      linked++;
      continue;
    }
    if (existsSync(file) && !force) continue;
    try {
      // Yopiq (r2:) video uchun vaqtinchalik imzolangan havola olinadi
      const src = l.videoUrl.startsWith("r2:") ? await ownVideoSrc(l) : l.videoUrl;
      if (!src) throw new Error("video manzili olinmadi (R2_* sozlanganmi?)");
      execFileSync("swift", ["scripts/frame.swift", src, file, "3", "640"], { stdio: ["ignore", "pipe", "pipe"], timeout: 180_000 });
      console.log("tayyor:", label);
      made++;
    } catch (e) {
      console.log("XATO:", label, String((e as { stderr?: Buffer }).stderr ?? e).trim().split("\n").pop());
      failed++;
    }
  }
  console.log(link ? `\nUlandi: ${linked}` : `\nTayyorlandi: ${made}, xato: ${failed}. Endi: git add public/thumbs && git commit && git push, deploydan keyin --link`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
