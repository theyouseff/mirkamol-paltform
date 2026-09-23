import Link from "next/link";
import { prisma } from "@/lib/db";
import { createCourse } from "@/lib/actions/admin";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { enrollments: true, modules: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kurslar</h1>
      <form action={createCourse} className="card flex flex-wrap gap-3">
        <input name="title" className="input flex-1" placeholder="Yangi kurs nomi" required />
        <SubmitButton>+ Kurs yaratish</SubmitButton>
      </form>
      <div className="grid gap-4">
        {courses.map((c) => (
          <Link key={c.id} href={`/admin/courses/${c.id}`} className="card flex items-center justify-between transition hover:border-brand">
            <div>
              <h2 className="font-semibold">{c.title}</h2>
              <p className="text-sm text-zinc-500">/{c.slug} · {c._count.modules} modul · {c._count.enrollments} o&apos;quvchi</p>
            </div>
            <span className={`badge ${c.published ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
              {c.published ? "Nashr qilingan" : "Qoralama"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
