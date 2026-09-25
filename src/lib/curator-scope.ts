import { prisma } from "./db";

// Kurator qaysi kurslarga biriktirilgan (admin uchun — null: cheklov yo'q)
export async function curatorCourseIds(user: { id: string; role: string }): Promise<string[] | null> {
  if (user.role === "ADMIN") return null;
  return (await prisma.curatorCourse.findMany({ where: { curatorId: user.id }, select: { courseId: true } })).map((a) => a.courseId);
}

// Kurator faqat o'ziga biriktirilgan kurslardagi o'quvchini boshqara oladi; admin — hammasini.
export async function canManageStudent(user: { id: string; role: string }, studentId: string) {
  const courseIds = await curatorCourseIds(user);
  if (courseIds === null) return true;
  if (courseIds.length === 0) return false;
  return !!(await prisma.enrollment.findFirst({ where: { userId: studentId, courseId: { in: courseIds } } }));
}

// Kuratorning o'quvchilari (id, ism, email)
export async function scopedStudents(user: { id: string; role: string }) {
  const courseIds = await curatorCourseIds(user);
  return prisma.user.findMany({
    where: { role: "STUDENT", enrollments: { some: courseIds === null ? {} : { courseId: { in: courseIds } } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}

// Nechta o'quvchi shu kuratorga yozgan va xabarlari hali o'qilmagan (menyudagi belgi uchun; xabar soni emas, odam soni)
export async function curatorUnread(user: { id: string; role: string }) {
  const students = await scopedStudents(user);
  if (students.length === 0) return 0;
  const rows = await prisma.chatMessage.groupBy({
    by: ["studentId"],
    where: { curatorId: user.id, studentId: { in: students.map((s) => s.id) }, authorRole: "STUDENT", readAt: null },
  });
  return rows.length;
}

// O'quvchiga kelgan, hali o'qilmagan kurator xabarlari soni
export const studentUnread = (studentId: string) => prisma.chatMessage.count({ where: { studentId, authorRole: "STAFF", readAt: null } });
