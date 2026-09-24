import type { CSSProperties } from "react";
import Link from "next/link";
import type { LessonState } from "@/lib/access";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

export type LessonCard = { id: string; title: string; duration: string; state: LessonState; done: boolean; hint: string | null };

function Play() {
  return (
    <span className="gold-gloss relative isolate flex h-14 w-14 items-center justify-center overflow-hidden rounded-full transition-transform duration-300 before:rounded-none! group-hover:scale-110">
      <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6" fill="currentColor" aria-hidden>
        <path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" />
      </svg>
    </span>
  );
}

function Lock() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-black/40 text-gold-text/80">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 118 0v3" />
      </svg>
    </span>
  );
}

export function VideoLessonGrid({ lessons }: { lessons: LessonCard[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {lessons.map((l, i) => {
        const open = l.state === "open";
        const body = (
          <>
            <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-ink-800 via-ink-700 to-steel-600">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(241,198,87,0.28),transparent_58%)]" />
              {open ? <Play /> : <Lock />}
              {l.duration && <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white">{l.duration}</span>}
              {l.done && <span className="absolute left-2 top-2 rounded-md bg-gold px-2 py-0.5 text-xs font-semibold text-ink-950">Tugatilgan</span>}
            </div>
            <div className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gold-text/60">{i + 1}-dars</p>
              <h3 className="mt-1 font-semibold leading-snug text-gold-text">{l.title}</h3>
              {l.hint && <p className="mt-1.5 text-xs text-gold-text/60">{l.hint}</p>}
            </div>
          </>
        );
        return open ? (
          <Link
            key={l.id}
            href={`/cabinet/lessons/${l.id}`}
            className="enter glass group block overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-gold/70 hover:bg-ink-950/70"
            style={step(i)}
          >
            {body}
          </Link>
        ) : (
          <div key={l.id} className="enter glass block overflow-hidden opacity-70" style={step(i)}>{body}</div>
        );
      })}
    </div>
  );
}
