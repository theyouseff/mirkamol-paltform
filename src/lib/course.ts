import { prisma } from "./db";
import { getEnrollment, lessonState } from "./access";

// Kurs dasturi + har bir darsning o'quvchi uchun holati (ochiq / sana / yopiq).
export async function loadCourseForStudent(courseId: string, user: { id: string; role: string }) {
  const [course, enrollment, progress] = await Promise.all([
    prisma.course.findUniqueOrThrow({
      where: { id: courseId },
      include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
    }),
    getEnrollment(user.id, courseId),
    prisma.lessonProgress.findMany({ where: { userId: user.id, lesson: { module: { courseId } } }, select: { lessonId: true } }),
  ]);
  const isAdmin = user.role === "ADMIN";
  const modules = course.modules.map((m) => ({
    ...m,
    lessons: m.lessons.map((l) => ({ ...l, state: lessonState(l, !!enrollment, isAdmin) })),
  }));
  return {
    course,
    enrollment,
    modules,
    hasAccess: !!enrollment || isAdmin,
    done: new Set(progress.map((p) => p.lessonId)),
    flatLessons: modules.flatMap((m) => m.lessons),
  };
}
