import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurator } from "@/lib/auth";
import { scopedStudents } from "@/lib/curator-scope";
import { ChatPanel, type ChatStudent } from "@/components/chat/ChatPanel";

// Kurator chati: kuratorning o'quvchilari; tanlansa shu kuratorning o'zining suhbati ochiladi.
export default async function CuratorChatPage() {
  const user = await requireCurator();
  if (user.role === "ADMIN") redirect("/admin/analytics"); // adminning o'z suhbatlari yo'q: kuratorlar chatini Analitika ostida ko'radi
  const students = await scopedStudents(user);
  const msgs = students.length
    ? await prisma.chatMessage.findMany({
        where: { curatorId: user.id, studentId: { in: students.map((s) => s.id) } },
        orderBy: { createdAt: "desc" },
        select: { studentId: true, body: true, createdAt: true, authorRole: true, readAt: true },
      })
    : [];
  const items: ChatStudent[] = students.map((s) => {
    const mine = msgs.filter((m) => m.studentId === s.id);
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      unread: mine.filter((m) => m.authorRole === "STUDENT" && !m.readAt).length,
      lastAt: mine[0]?.createdAt.toISOString() ?? null,
      lastBody: mine[0] ? `${mine[0].authorRole === "STAFF" ? "Siz: " : ""}${mine[0].body}`.slice(0, 80) : "",
    };
  });
  return <ChatPanel students={items} curatorId={user.id} />;
}
