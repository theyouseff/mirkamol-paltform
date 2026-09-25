import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ChatThread } from "@/components/chat/ChatThread";

// O'quvchi chati: kuratorlar bilan bitta suhbat.
export default async function StudentChatPage() {
  const user = await requireUser();
  const enrolled = await prisma.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true } });
  const curators = enrolled.length
    ? await prisma.curatorCourse.findMany({ where: { courseId: { in: enrolled.map((e) => e.courseId) } }, include: { curator: { select: { name: true } } } })
    : [];
  const names = [...new Set(curators.map((c) => c.curator.name))];

  return (
    <div className="glass mx-auto flex h-[calc(100dvh-11rem)] min-h-[26rem] max-w-3xl flex-col p-4 sm:p-6">
      <div className="mb-2 border-b border-white/10 pb-3">
        <h1 className="text-xl font-bold text-gold-text">Kurator bilan chat</h1>
        <p className="text-sm text-gold-text/65">{names.length ? `Kuratorlaringiz: ${names.join(", ")}` : "Sizga hali kurator biriktirilmagan"}</p>
      </div>
      <div className="min-h-0 flex-1">
        <ChatThread studentId={user.id} mine="STUDENT" disabledNote={names.length ? undefined : "Sizga kurator biriktirilgach shu yerda yozishingiz mumkin bo'ladi."} />
      </div>
    </div>
  );
}
