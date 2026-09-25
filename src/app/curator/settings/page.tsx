import { prisma } from "@/lib/db";
import { requireCurator } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { StudentPasswords } from "@/components/curator/StudentPasswords";

// Parol sahifasi: chapda kuratorning o'quvchilari (tanlansa — o'quvchining logini va yangi parol o'rnatish), o'ngda o'zining paroli.
export default async function CuratorSettingsPage() {
  const user = await requireCurator();
  let courseFilter: object = {}; // admin — hamma o'quvchi
  if (user.role === "CURATOR") {
    const assigned = await prisma.curatorCourse.findMany({ where: { curatorId: user.id }, select: { courseId: true } });
    courseFilter = { courseId: { in: assigned.map((a) => a.courseId) } };
  }
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", enrollments: { some: courseFilter } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
  return <StudentPasswords students={students} ownForm={<div className="max-w-md"><ChangePasswordForm /></div>} />;
}
