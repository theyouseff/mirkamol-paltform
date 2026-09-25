import { setCuratorCourses } from "@/lib/actions/admin";
import { SubmitButton } from "../SubmitButton";

type Curator = { id: string; name: string; email: string; courseIds: string[]; students: number };

// Mavjud kuratorlar: qaysi kurslar biriktirilgani va shu kurslardagi o'quvchilar soni; kurslarni o'zgartirish.
export function CuratorList({ curators, courses }: { curators: Curator[]; courses: { id: string; title: string }[] }) {
  if (curators.length === 0) return null;
  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold">Kuratorlar</h2>
        <p className="text-sm text-zinc-500">Kurs belgilansa, kurator shu kursdagi hamma o&apos;quvchini ko&apos;radi. O&apos;zgartirgach «Saqlash»ni bosing.</p>
      </div>
      <ul className="divide-y divide-zinc-100">
        {curators.map((c) => (
          <li key={c.id} className="py-4">
            <form action={setCuratorCourses} className="space-y-3">
              <input type="hidden" name="id" value={c.id} />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{c.name}</p>
                  <p className="truncate text-xs text-zinc-400">{c.email}</p>
                </div>
                <span className="badge bg-brand-soft text-brand">{c.students} ta o&apos;quvchi</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {courses.map((course) => (
                  <label key={course.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                    <input type="checkbox" name="courseId" value={course.id} defaultChecked={c.courseIds.includes(course.id)} /> {course.title}
                  </label>
                ))}
              </div>
              <SubmitButton className="btn-outline">Saqlash</SubmitButton>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
