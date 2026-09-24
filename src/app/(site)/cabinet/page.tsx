import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ProgressBar } from "@/components/ProgressBar";

// "Ali Valiyev" -> "AV"
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

// Kabinet: chap yuqori burchakda yumaloq kapsula — avatar, ism va o'quvchi nechta video dars ko'rgani (progress).
export default async function CabinetPage() {
  const user = await requireUser();
  // O'quvchi yozilgan barcha kurslardagi darslar
  const inMyCourses = { module: { course: { enrollments: { some: { userId: user.id } } } } };
  const [total, done] = await Promise.all([
    prisma.lesson.count({ where: inMyCourses }),
    prisma.lessonProgress.count({ where: { userId: user.id, lesson: inMyCourses } }),
  ]);

  return (
    <div className="glass inline-flex max-w-full items-center gap-4 rounded-full py-3 pl-3 pr-8">
      <span className="gold-gloss relative isolate flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg before:rounded-none!" aria-hidden>
        {initials(user.name)}
      </span>
      <div className="min-w-0 space-y-2 sm:min-w-64">
        <p className="truncate text-xl font-bold text-gold-text">{user.name}</p>
        {total > 0 && (
          <>
            <ProgressBar dark value={(done / total) * 100} />
            <p className="text-sm text-gold-text/75">{done} / {total} video dars ko&apos;rildi</p>
          </>
        )}
      </div>
    </div>
  );
}
