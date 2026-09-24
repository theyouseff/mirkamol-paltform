// Demo kursning modul/darslarini demo-content.ts dagi 3 modul x 5 dars bilan almashtiradi.
// Xavfsizlik: kursda yozilgan o'quvchi yoki darsni tugatgan progress bo'lsa — hech narsa o'zgartirilmaydi.
// Ishga tushirish: npx tsx prisma/import-demo.ts
import { PrismaClient } from "@prisma/client";
import { DEMO_MODULES, lessonContent } from "./demo-content";

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findUnique({ where: { slug: "demo-kurs" } });
  if (!course) return console.log("demo-kurs topilmadi — seed ishga tushirilmagan.");

  const enrollments = await prisma.enrollment.count({ where: { courseId: course.id } });
  const progress = await prisma.lessonProgress.count({ where: { lesson: { module: { courseId: course.id } } } });
  if (enrollments || progress) return console.log(`To'xtatildi: kursda ${enrollments} ta o'quvchi va ${progress} ta progress bor.`);

  await prisma.$transaction(async (tx) => {
    await tx.module.deleteMany({ where: { courseId: course.id } });
    for (const [mi, m] of DEMO_MODULES.entries()) {
      await tx.module.create({
        data: {
          courseId: course.id,
          title: m.title,
          description: m.description,
          order: mi + 1,
          lessons: {
            create: m.lessons.map((l, li) => ({
              title: l.title,
              duration: l.duration,
              videoUrl: l.videoUrl ?? "",
              content: lessonContent(l),
              order: li + 1,
            })),
          },
        },
      });
    }
  });
  console.log(`Tayyor: ${DEMO_MODULES.length} modul, ${DEMO_MODULES.reduce((n, m) => n + m.lessons.length, 0)} dars.`);
}

main().finally(() => prisma.$disconnect());
