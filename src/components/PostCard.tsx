import { timeAgo } from "@/lib/format";

export type PostItem = { id: string; courseTitle: string; authorName: string; body: string; createdAt: Date };

// Bitta post: qaysi kursniki, kim yozgani va matni. Matn oddiy (HTML emas), qatorlar saqlanadi.
export function PostCard({ post, action }: { post: PostItem; action?: React.ReactNode }) {
  return (
    <article className="glass p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="badge bg-gold/20 text-gold-text ring-1 ring-gold/40">{post.courseTitle}</span>
          <span className="text-sm font-medium text-gold-text">{post.authorName}</span>
          <span className="text-sm text-gold-text/55">{timeAgo(post.createdAt)}</span>
        </div>
        {action}
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-base leading-relaxed text-gold-text/90 sm:text-[17px]">{post.body}</p>
    </article>
  );
}
