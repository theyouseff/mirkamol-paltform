import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { StudentChat } from "@/components/chat/StudentChat";

// O'quvchi chati: har bir kurator bilan alohida suhbat (kuratorlar bir-birining yozishmasini ko'rmaydi).
export default async function StudentChatPage() {
  const user = await requireUser();
  const rows = await prisma.curatorCourse.findMany({
    where: { course: { enrollments: { some: { userId: user.id } } } },
    select: { curator: { select: { id: true, name: true } } },
  });
  const unread = await prisma.chatMessage.groupBy({ by: ["curatorId"], where: { studentId: user.id, authorRole: "STAFF", readAt: null }, _count: true });
  const unreadBy = new Map(unread.map((u) => [u.curatorId, u._count]));
  const curators = [...new Map(rows.map((r) => [r.curator.id, r.curator])).values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ id: c.id, name: c.name, unread: unreadBy.get(c.id) ?? 0 }));

  return (
    <div className="glass mx-auto flex h-[calc(100dvh-11rem)] min-h-[26rem] max-w-3xl flex-col p-4 sm:p-6">
      <div className="mb-2 border-b border-white/10 pb-3">
        <h1 className="text-xl font-bold text-gold-text">Kurator bilan chat</h1>
        <p className="text-sm text-gold-text/65">{curators.length ? `Kuratoringiz: ${curators.map((c) => c.name).join(", ")}` : "Sizga hali kurator biriktirilmagan"}</p>
      </div>
      <div className="min-h-0 flex-1">
        {curators.length ? (
          <StudentChat studentId={user.id} curators={curators} />
        ) : (
          <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-gold-text/70">Sizga kurator biriktirilgach shu yerda yozishingiz mumkin bo&apos;ladi.</p>
        )}
      </div>
    </div>
  );
}
