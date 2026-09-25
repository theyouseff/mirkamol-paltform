"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPost, type PostState } from "@/lib/actions/posts";

// Kurator uchun yangi post formasi: kurs (faqat o'ziga biriktirilganlar) va matn.
export function PostComposer({ courses }: { courses: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState<PostState, FormData>(createPost, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  if (courses.length === 0) return <div className="glass p-6 text-gold-text/70">Sizga hali kurs biriktirilmagan, shuning uchun post yoza olmaysiz.</div>;
  return (
    <form ref={form} action={action} className="glass space-y-3 p-5 sm:p-6">
      <h2 className="font-semibold text-gold-text">Yangi post</h2>
      {courses.length > 1 ? (
        <select name="courseId" required defaultValue="" className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-gold-text focus:border-gold focus:outline-none">
          <option value="" disabled className="text-zinc-900">Qaysi kurs uchun?</option>
          {courses.map((c) => <option key={c.id} value={c.id} className="text-zinc-900">{c.title}</option>)}
        </select>
      ) : (
        <>
          <input type="hidden" name="courseId" value={courses[0].id} />
          <p className="text-sm text-gold-text/70">Kurs: <b className="text-gold-text">{courses[0].title}</b></p>
        </>
      )}
      <textarea
        name="body"
        required
        rows={4}
        maxLength={4000}
        placeholder="O'quvchilarga e'lon yoki yangilik yozing..."
        className="w-full resize-y rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-gold-text placeholder:text-gold-text/40 focus:border-gold focus:outline-none"
      />
      {state.error && <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-200">{state.error}</p>}
      {state.ok && <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">Post joylandi</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary px-6 disabled:opacity-60">{pending ? "Joylanmoqda..." : "Joylash"}</button>
      </div>
    </form>
  );
}
