import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_MODULES, lessonContent } from "./demo-content";

const prisma = new PrismaClient();

async function main() {
  // Prod uchun: ADMIN_EMAIL va ADMIN_PASSWORD ni env orqali bering
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "admin123", 10),
    },
  });

  if (await prisma.course.findUnique({ where: { slug: "demo-kurs" } })) return;

  await prisma.course.create({
    data: {
      slug: "demo-kurs",
      title: "Bolajak LORlar uchun",
      subtitle: "Bu ko'nikmalarni bilmasdan Prof.LOR bo'la olmaysiz",
      description:
        "Kurs davomida profilni to'g'ri qadoqlash, kontent-reja tuzish va obunachilarni mijozga aylantirishni o'rganasiz.",
      published: true,
      coverUrl: "/courses/bolajak-lorlar.webp",
      price: 490000,
      modules: {
        create: DEMO_MODULES.map((m, mi) => ({
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
        })),
      },
    },
  });
}

main().finally(() => prisma.$disconnect());
