import { prisma } from "@/lib/db";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { CourseChats, type CourseChatData } from "@/components/admin/CourseChats";

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ q?: string; student?: string }> }) {
  const { q, student } = await searchParams;

  const [courses, last, unread] = await Promise.all([
    prisma.course.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        curators: { select: { curator: { select: { id: true, name: true, email: true } } } },
        enrollments: { select: { user: { select: { id: true, name: true, email: true, role: true } } } },
      },
    }),
    prisma.chatMessage.findMany({
      distinct: ["studentId"],
      orderBy: { createdAt: "desc" },
      select: { studentId: true, body: true, createdAt: true, authorRole: true },
    }),
    prisma.chatMessage.groupBy({ by: ["studentId"], where: { authorRole: "STUDENT", readAt: null }, _count: true }),
  ]);
  const lastBy = new Map(last.map((m) => [m.studentId, m]));
  const unreadBy = new Map(unread.map((u) => [u.studentId, u._count]));

  const chats: CourseChatData[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    curators: c.curators.map((k) => k.curator).sort((a, b) => a.name.localeCompare(b.name)),
    students: c.enrollments
      .map((e) => e.user)
      .filter((u) => u.role === "STUDENT")
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((u) => {
        const m = lastBy.get(u.id);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          unread: unreadBy.get(u.id) ?? 0,
          lastAt: m?.createdAt.toISOString() ?? null,
          lastBody: m ? `${m.authorRole === "STAFF" ? "Kurator: " : ""}${m.body}`.slice(0, 80) : "",
        };
      }),
  }));

  return (
    <div className="space-y-10">
      <AnalyticsView basePath="/admin/analytics" q={q} student={student} canAnnotate />
      <CourseChats courses={chats} />
    </div>
  );
}
