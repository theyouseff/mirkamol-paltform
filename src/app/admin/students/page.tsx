import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteStudent, removeFromCourse, setUserRole } from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import { AddStudentForm } from "@/components/admin/AddStudentForm";
import { AddCuratorForm } from "@/components/admin/AddCuratorForm";
import { CuratorList } from "@/components/admin/CuratorList";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";

// Kurs belgisi: yonidagi × — o'quvchini shu kursdan chiqarish (tasdiq so'raladi)
function CourseBadge({ userId, userName, courseId, title }: { userId: string; userName: string; courseId: string; title: string }) {
  return (
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
  );
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

      <div className="card overflow-x-auto p-0 max-lg:hidden">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr><th className="px-4 py-3">Ism</th><th>Email</th><th>Kurslar</th><th>Darslar</th><th>Qo&apos;shilgan</th><th>Rol</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-zinc-100 align-top">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {u.enrollments.map((e) => <CourseBadge key={e.id} userId={u.id} userName={u.name} courseId={e.courseId} title={e.course.title} />)}
                    {u.enrollments.length === 0 && <span className="text-zinc-400">—</span>}
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
        {users.length === 0 && <p className="p-6 text-center text-zinc-500">Topilmadi</p>}
      </div>

      {/* Telefon va planshet: jadval o'rniga kartochkalar */}
      <div className="space-y-3 lg:hidden">
        {users.map((u) => (
          <div key={u.id} className="card space-y-3 p-4 text-sm">
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="break-all text-xs text-zinc-400">{u.email}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {u.enrollments.map((e) => <CourseBadge key={e.id} userId={u.id} userName={u.name} courseId={e.courseId} title={e.course.title} />)}
              {u.enrollments.length === 0 && <span className="text-zinc-400">Kursi yo&apos;q</span>}
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
        {users.length === 0 && <p className="card text-center text-zinc-500">Topilmadi</p>}
      </div>
    </div>
  );
}
