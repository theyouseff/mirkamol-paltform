import { prisma } from "@/lib/db";
import { createAuthor, deleteAuthor, updateAuthor } from "@/lib/actions/admin";
import { formatPrice } from "@/lib/format";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function AdminAuthorsPage() {
  const [authors, paid] = await Promise.all([
    prisma.author.findMany({ orderBy: { name: "asc" }, include: { courses: { select: { id: true, title: true } } } }),
    prisma.order.findMany({ where: { status: "PAID" }, select: { amount: true, course: { select: { authorId: true } } } }),
  ]);
  const sales = new Map<string, { count: number; sum: number }>();
  for (const o of paid) {
    const id = o.course.authorId ?? "";
    const cur = sales.get(id) ?? { count: 0, sum: 0 };
    sales.set(id, { count: cur.count + 1, sum: cur.sum + o.amount });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mualliflar</h1>
        <p className="text-sm text-gold-text/80">
          Kurs egalari: siz, mijozlaringiz. Kursni muallifga biriktirsangiz, sotuvlar muallif bo&apos;yicha hisoblanadi (hisob-kitob uchun).
        </p>
      </div>

      <form action={createAuthor} className="card flex gap-2">
        <input name="name" className="input flex-1" placeholder="Muallif ismi (masalan, Mirkamol yoki Arab tili maktabi)" required />
        <SubmitButton>+ Qo&apos;shish</SubmitButton>
      </form>

      {authors.map((a) => {
        const s = sales.get(a.id) ?? { count: 0, sum: 0 };
        return (
          <div key={a.id} className="card space-y-3">
            <form action={updateAuthor} className="flex gap-2">
              <input type="hidden" name="id" value={a.id} />
              <input name="name" className="input flex-1 font-medium" defaultValue={a.name} required />
              <SubmitButton className="btn-outline">Saqlash</SubmitButton>
              <ConfirmButton formAction={deleteAuthor} message="Muallifni o'chirasizmi? Kurslari o'chmaydi, faqat muallifsiz bo'lib qoladi.">✕</ConfirmButton>
            </form>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600">
              <span>{a.courses.length ? a.courses.map((c) => c.title).join(", ") : "Kurslari yo'q"}</span>
              <span className="font-medium">{s.count} ta to&apos;lov · {formatPrice(s.sum)}</span>
            </div>
          </div>
        );
      })}
      {authors.length === 0 && <p className="text-sm text-gold-text/80">Hali mualliflar yo&apos;q.</p>}
    </div>
  );
}
