import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurator } from "@/lib/auth";
import { deletePost } from "@/lib/actions/posts";
import { PostComposer } from "@/components/curator/PostComposer";
import { PostCard } from "@/components/PostCard";
import { ConfirmButton } from "@/components/ConfirmButton";

// Kurator postlari: o'ziga biriktirilgan kurslar uchun yozadi; shu kurslarning postlari (boshqa kuratorlarniki ham) ro'yxatda, o'chirish — faqat o'zinikini.
export default async function CuratorPostsPage() {
  const user = await requireCurator();
  if (user.role === "ADMIN") redirect("/admin");
  const courses = await prisma.course.findMany({ where: { curators: { some: { curatorId: user.id } } }, orderBy: { createdAt: "asc" }, select: { id: true, title: true } });
  const posts = courses.length
    ? await prisma.post.findMany({ where: { courseId: { in: courses.map((c) => c.id) } }, orderBy: { createdAt: "desc" }, take: 100, include: { course: { select: { title: true } } } })
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PostComposer courses={courses} />
      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={{ id: p.id, courseTitle: p.course.title, authorName: p.authorName, body: p.body, createdAt: p.createdAt }}
          action={
            p.authorId === user.id ? (
              <form action={deletePost}>
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton message="Post o'chirilsinmi?" className="btn text-sm text-red-300 hover:text-red-200">O&apos;chirish</ConfirmButton>
              </form>
            ) : null
          }
        />
      ))}
      {posts.length === 0 && courses.length > 0 && <p className="text-center text-sm text-gold-text/60">Hali post yozilmagan</p>}
    </div>
  );
}
