import type { CSSProperties } from "react";
import Link from "next/link";
import { DEMO_MODULES } from "@/lib/demo-course";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

// Kurs sahifasidagi modul bloklari; bosilganda modul ichidagi video darslar sahifasi ochiladi.
export function ModuleGrid({ courseSlug }: { courseSlug: string }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {DEMO_MODULES.map((m, i) => (
        <Link
          key={m.slug}
          href={`/courses/${courseSlug}/${m.slug}`}
          className="enter group block overflow-hidden rounded-2xl border border-gold/30 bg-ink-950/55 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-gold/70 hover:bg-ink-950/70"
          style={step(i)}
        >
          <div className="relative flex aspect-[16/8] items-center justify-center bg-gradient-to-br from-ink-800 via-ink-700 to-steel-600">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(241,198,87,0.28),transparent_58%)]" />
          </div>
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gold-text/60">{i + 1}-modul</p>
            <h3 className="mt-1 text-xl font-bold text-gold-text">{m.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gold-text/80">{m.description}</p>
            <p className="mt-4 text-sm font-medium text-gold-text">{m.lessons.length} ta video dars →</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
