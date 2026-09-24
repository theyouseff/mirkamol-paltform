import type { CSSProperties } from "react";
import Link from "next/link";
import type { DemoLesson } from "@/lib/demo-course";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

function Play() {
  return (
    <span className="gold-gloss relative isolate flex h-14 w-14 items-center justify-center overflow-hidden rounded-full transition-transform duration-300 before:rounded-none! group-hover:scale-110">
      <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6" fill="currentColor" aria-hidden>
        <path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" />
      </svg>
    </span>
  );
}

export function VideoLessonGrid({ lessons, basePath }: { lessons: DemoLesson[]; basePath: string }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {lessons.map((l, i) => (
        <Link
          key={l.title}
          href={`${basePath}/${i + 1}`}
          className="enter group block overflow-hidden rounded-2xl border border-gold/30 bg-ink-950/55 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-gold/70 hover:bg-ink-950/70"
          style={step(i)}
        >
          <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-ink-800 via-ink-700 to-steel-600">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(241,198,87,0.28),transparent_58%)]" />
            <Play />
            <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white">{l.duration}</span>
          </div>
          <div className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gold-text/60">{i + 1}-dars</p>
            <h3 className="mt-1 font-semibold leading-snug text-gold-text">{l.title}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
