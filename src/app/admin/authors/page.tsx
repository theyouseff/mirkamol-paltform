import { prisma } from "@/lib/db";
import { createAuthor, deleteAuthor, setAuthorCourses, updateAuthor } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CourseMenu } from "@/components/admin/CourseMenu";

export default async function AdminAuthorsPage() {
  const [authors, paid, courses] = await Promise.all([
    prisma.author.findMany({ orderBy: { name: "asc" }, include: { courses: { select: { id: true, title: true } } } }),
    prisma.order.findMany({ where: { status: "PAID" }, select: { amount: true, course: { select: { authorId: true } } } }),
    prisma.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, authorId: true, author: { select: { name: true } } } }),
  ]);
  const sales = new Map<string, { count: number; sum: number }>();
  for (const o of paid) {
    const id = o.course.authorId ?? "";
    const cur = sales.get(id) ?? { count: 0, sum: 0 };
    sales.set(id, { count: cur.count + 1, sum: cur.sum + o.amount });
  }
  // Menyudagi kurslar: boshqa muallifga tegishli bo'lsa, egasi yoziladi (belgilansa shu muallifga o'tadi)
  const menuFor = (authorId: string | null) => courses.map((c) => ({ id: c.id, title: c.title, note: c.authorId && c.authorId !== authorId ? c.author?.name : undefined }));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mualliflar</h1>
        <p className="text-sm text-gold-text/80">
          Kurs egalari: siz, mijozlaringiz. Kursni muallifga biriktirsangiz, sotuvlar muallif bo&apos;yicha hisoblanadi (hisob-kitob uchun).
          Kurs bitta muallifga tegishli: boshqa muallifdagi kursni belgilasangiz, u shu muallifga o&apos;tadi.
        </p>
      </div>

      <form action={createAuthor} className="card flex flex-wrap gap-2">
        <input name="name" className="input min-w-0 flex-1 max-sm:basis-full" placeholder="Muallif ismi (masalan, Mirkamol yoki Arab tili maktabi)" required />
        <CourseMenu courses={menuFor(null)} align="right" emptyLabel="Kurs biriktirish" />
        <SubmitButton>+ Qo&apos;shish</SubmitButton>
      </form>

      {authors.map((a) => {
        const s = sales.get(a.id) ?? { count: 0, sum: 0 };
        return (
          <div key={a.id} className="card space-y-3">
            <form action={updateAuthor} className="flex gap-2">
              <input type="hidden" name="id" value={a.id} />
              <input name="name" className="input min-w-0 flex-1 font-medium" defaultValue={a.name} required />
              <SubmitButton className="btn-outline">Saqlash</SubmitButton>
              <ConfirmButton formAction={deleteAuthor} message="Muallifni o'chirasizmi? Kurslari o'chmaydi, faqat muallifsiz bo'lib qoladi.">✕</ConfirmButton>
            </form>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="min-w-0 flex-1 text-sm text-zinc-600">{a.courses.length ? a.courses.map((c) => c.title).join(", ") : "Kurslari yo'q"}</p>
              <form action={setAuthorCourses}>
                <input type="hidden" name="id" value={a.id} />
                <CourseMenu
                  courses={menuFor(a.id)}
                  selected={a.courses.map((c) => c.id)}
                  align="right"
                  footer={<SubmitButton className="btn-primary w-full">Saqlash</SubmitButton>}
                />
              </form>
            </div>
            <p className="text-right text-sm font-medium text-zinc-600">{s.count} ta to&apos;lov · {formatPrice(s.sum)}</p>
          </div>
        );
      })}
      {authors.length === 0 && <p className="text-sm text-gold-text/80">Hali mualliflar yo&apos;q.</p>}
    </div>
  );
}
