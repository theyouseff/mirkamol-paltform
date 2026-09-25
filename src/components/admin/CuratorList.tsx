import { setCuratorCourses } from "@/lib/actions/admin";
import { SubmitButton } from "../SubmitButton";
import { CourseMenu } from "./CourseMenu";

type Curator = { id: string; name: string; email: string; courseIds: string[]; students: number };

// Mavjud kuratorlar: har biri bir qatorda. Kurslar tugmasi bosilsa pastga menyu ochiladi (tanlab «Saqlash»).
export function CuratorList({ curators, courses }: { curators: Curator[]; courses: { id: string; title: string }[] }) {
  if (curators.length === 0) return null;
  return (
    <div className="card space-y-3">
      <div>
        <h2 className="font-semibold">Kuratorlar</h2>
        <p className="text-sm text-zinc-500">Kurs biriktirilsa, kurator shu kursdagi hamma o&apos;quvchini ko&apos;radi. Kurslar tugmasini bosib tanlang va «Saqlash»ni bosing.</p>
      </div>
      <ul className="divide-y divide-zinc-100">
        {curators.map((c) => (
          <li key={c.id} className="py-3">
            <form action={setCuratorCourses} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <input type="hidden" name="id" value={c.id} />
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-xs text-zinc-400">{c.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge shrink-0 bg-brand-soft text-brand">{c.students} ta o&apos;quvchi</span>
                <CourseMenu courses={courses} selected={c.courseIds} align="right" footer={<SubmitButton className="btn-primary w-full">Saqlash</SubmitButton>} />
              </div>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
