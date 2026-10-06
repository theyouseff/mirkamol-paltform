import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { changeCourse, deleteStudent, removeFromCourse, setUserRole } from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import { AddStudentForm } from "@/components/admin/AddStudentForm";
import { AddCuratorForm } from "@/components/admin/AddCuratorForm";
import { CuratorList } from "@/components/admin/CuratorList";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";
import { AddCourseInline } from "@/components/admin/AddCourseInline";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";

// Kurs belgisi: yonidagi × — o'quvchini shu kursdan chiqarish (tasdiq so'raladi); ⇄ — boshqa kursga almashtirish
function CourseBadge({ userId, userName, courseId, title, others }: { userId: string; userName: string; courseId: string; title: string; others: { id: string; title: string }[] }) {
  return (
    <div className="inline-flex flex-wrap items-start gap-1">
      <form action={removeFromCourse} className="inline-flex">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="courseId" value={courseId} />
        <span className="badge items-center gap-1 bg-brand-soft text-brand">
          {title}
          <ConfirmButton
            className="rounded-full px-1 leading-none text-brand/60 hover:bg-red-100 hover:text-red-600"
            message={`${userName} «${title}» kursidan chiqarilsinmi?\n\nKursga kirish yopiladi. Akkaunt, to'lov yozuvi va natijalari saqlanadi.`}
          >
            <span title="Kursdan chiqarish">×</span>
          </ConfirmButton>
        </span>
      </form>
      {others.length > 0 && (
        <details className="group">
          <summary className="badge cursor-pointer list-none bg-zinc-100 text-zinc-600 hover:bg-zinc-200" title="Boshqa kursga almashtirish">⇄</summary>
          <form action={changeCourse} className="mt-1 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-sm">
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="fromCourseId" value={courseId} />
            <select name="toCourseId" required defaultValue="" className="input max-w-[180px] py-1 text-xs">
              <option value="" disabled>Qaysi kursga?</option>
              {others.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <SubmitButton className="btn-outline px-2 py-1 text-xs">Almashtirish</SubmitButton>
          </form>
        </details>
      )}
    </div>
  );
}

// "+ kurs": o'quvchi hali yozilmagan kurslarni qo'shish (hammasiga yozilgan bo'lsa — ko'rinmaydi)
function AddCourseSlot({ u, courses }: { u: { id: string; enrollments: { courseId: string }[] }; courses: { id: string; title: string; price: number }[] }) {
  const rest = courses.filter((c) => !u.enrollments.some((e) => e.courseId === c.id));
  return rest.length > 0 ? <AddCourseInline userId={u.id} courses={rest} /> : null;
}

// Akkauntni butunlay o'chirish (faqat o'quvchi uchun)
function DeleteStudent({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteStudent}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton
        className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
        message={`${name} akkaunti BUTUNLAY o'chirilsinmi?\n\nO'chadi: kirish, kurslar, ko'rish natijalari va chat yozuvlari.\nSaqlanadi: to'lov yozuvi (hisobotlar buzilmaydi).\n\nBuni ortga qaytarib bo'lmaydi.`}
      >
        O&apos;chirish
      </ConfirmButton>
    </form>
  );
}

const roles = { STUDENT: "O'quvchi", CURATOR: "Kurator", ADMIN: "Admin" } as const;

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; author?: string; course?: string }> }) {
  const admin = await requireAdmin();
  const { q = "", author = "", course = "" } = await searchParams;

  const where: Prisma.UserWhereInput = {
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }),
    ...((author || course) && {
      enrollments: { some: { course: { ...(author && { authorId: author }), ...(course && { id: course }) } } },
    }),
  };

  const [users, authors, courses, curators] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { enrollments: { include: { course: true } }, _count: { select: { progress: true } } },
    }),
    prisma.author.findMany({ orderBy: { name: "asc" } }),
    prisma.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, price: true } }),
    prisma.user.findMany({ where: { role: "CURATOR" }, orderBy: { createdAt: "asc" }, include: { curatorCourses: { select: { courseId: true } } } }),
  ]);
  // Har bir kuratorning o'quvchilari: biriktirilgan kurslarga yozilgan noyob o'quvchilar
  const studentCounts = await Promise.all(
    curators.map((c) => prisma.user.count({ where: { role: "STUDENT", enrollments: { some: { courseId: { in: c.curatorCourses.map((x) => x.courseId) } } } } })),
  );

  // Foydalanuvchilar kurs bo'yicha guruhlanadi: kurs nomi bosilganda o'sha kursning o'quvchilari ro'yxati ochiladi.
  // Bir nechta kursga yozilgan foydalanuvchi har bir kursning ro'yxatida chiqadi; kursi yo'qlar — «Kursi yo'q» guruhida.
  const filtered = !!(q || author || course);
  const groups = [
    ...courses.map((c) => ({ key: c.id, title: c.title, list: users.filter((u) => u.enrollments.some((e) => e.courseId === c.id)) })),
    { key: "none", title: "Kursi yo'q", list: users.filter((u) => u.enrollments.length === 0) },
  ].filter((g) => (filtered || g.key === "none" ? g.list.length > 0 : true)); // filtr yoki «Kursi yo'q» bo'sh bo'lsa — bo'sh guruh yashiriladi

  const renderTable = (list: typeof users) => (
    <div className="overflow-x-auto max-lg:hidden">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr><th className="px-4 py-3">Ism</th><th>Email</th><th>Kurslar</th><th>Darslar</th><th>Qo&apos;shilgan</th><th>Rol</th><th></th></tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-t border-zinc-100 align-top">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {u.enrollments.map((e) => <CourseBadge key={e.id} userId={u.id} userName={u.name} courseId={e.courseId} title={e.course.title} others={courses.filter((c) => !u.enrollments.some((x) => x.courseId === c.id))} />)}
                    {u.enrollments.length === 0 && u.role !== "STUDENT" && <span className="text-zinc-400">—</span>}
                    {u.role === "STUDENT" && <AddCourseSlot u={u} courses={courses} />}
                  </div>
                </td>
                <td>{u._count.progress}</td>
                <td className="text-zinc-500">{formatDate(u.createdAt)}</td>
                <td>
                  {u.id === admin.id ? (
                    <span className="text-zinc-500">{roles[u.role as keyof typeof roles]}</span>
                  ) : (
                    <form action={setUserRole} className="flex gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} className="input py-1.5">
                        {Object.entries(roles).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <SubmitButton className="btn-outline px-2 py-1 text-xs">OK</SubmitButton>
                    </form>
                  )}
                </td>
                <td className="pr-4">{u.id !== admin.id && (
                  <div className="flex flex-wrap items-center gap-1">
                    <ResetPasswordButton userId={u.id} />
                    {u.role === "STUDENT" && <DeleteStudent id={u.id} name={u.name} />}
                  </div>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );

  const renderCards = (list: typeof users) => (
      <div className="space-y-3 p-3 lg:hidden">
        {list.map((u) => (
          <div key={u.id} className="card space-y-3 p-4 text-sm">
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="break-all text-xs text-zinc-400">{u.email}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {u.enrollments.map((e) => <CourseBadge key={e.id} userId={u.id} userName={u.name} courseId={e.courseId} title={e.course.title} others={courses.filter((c) => !u.enrollments.some((x) => x.courseId === c.id))} />)}
              {u.enrollments.length === 0 && u.role !== "STUDENT" && <span className="text-zinc-400">Kursi yo&apos;q</span>}
              {u.role === "STUDENT" && <AddCourseSlot u={u} courses={courses} />}
            </div>
            <p className="text-xs text-zinc-500">Tugatgan darslari: {u._count.progress} · Qo&apos;shilgan: {formatDate(u.createdAt)}</p>
            {u.id === admin.id ? (
              <p className="text-xs text-zinc-500">{roles[u.role as keyof typeof roles]}</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <form action={setUserRole} className="flex gap-1">
                  <input type="hidden" name="id" value={u.id} />
                  <select name="role" defaultValue={u.role} className="input py-1.5">
                    {Object.entries(roles).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <SubmitButton className="btn-outline px-3 py-1 text-xs">OK</SubmitButton>
                </form>
                <ResetPasswordButton userId={u.id} />
                {u.role === "STUDENT" && <DeleteStudent id={u.id} name={u.name} />}
              </div>
            )}
          </div>
        ))}
      </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">O&apos;quvchilar</h1>
      <AddCuratorForm courses={courses.map((c) => ({ id: c.id, title: c.title }))} />
      <CuratorList courses={courses.map((c) => ({ id: c.id, title: c.title }))} curators={curators.map((c, i) => ({ id: c.id, name: c.name, email: c.email, courseIds: c.curatorCourses.map((x) => x.courseId), students: studentCounts[i] }))} />
      <AddStudentForm courses={courses.map((c) => ({ id: c.id, label: c.title, price: c.price }))} />

      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} className="input max-w-xs" placeholder="Ism yoki email bo'yicha qidirish" />
        <select name="author" defaultValue={author} className="input max-w-[200px]">
          <option value="">Barcha mualliflar</option>
          {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select name="course" defaultValue={course} className="input max-w-[220px]">
          <option value="">Barcha kurslar</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <button className="btn-outline">Filtr</button>
        {(q || author || course) && <Link href="/admin/students" className="btn text-gold-text/80 hover:text-gold-text">Tozalash</Link>}
      </form>

      <div className="space-y-3">
        {groups.map((g) => (
          <details key={g.key} open={filtered} className="card group overflow-hidden p-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 hover:bg-zinc-50">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{g.title}</h2>
                <p className="text-sm text-zinc-500">{g.list.length} kishi</p>
              </div>
              <span className="text-zinc-400 transition group-open:rotate-180" aria-hidden>▾</span>
            </summary>
            <div className="border-t border-zinc-100">
              {g.list.length === 0 ? (
                <p className="p-6 text-center text-zinc-500">Bu kursda hali o&apos;quvchi yo&apos;q</p>
              ) : (
                <>
                  {renderTable(g.list)}
                  {renderCards(g.list)}
                </>
              )}
            </div>
          </details>
        ))}
        {groups.length === 0 && <p className="card text-center text-zinc-500">Topilmadi</p>}
      </div>
    </div>
  );
}
