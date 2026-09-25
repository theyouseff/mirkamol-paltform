import type { CSSProperties } from "react";
import Link from "next/link";
import { ProgressBar } from "./ProgressBar";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

export type ModuleCard = { id: string; title: string; description: string; lessonCount: number; doneCount: number; available: number; totalTime?: string };

// Kurs ichidagi modul bloklari; bosilganda modul ichidagi video darslar ochiladi.
export function ModuleGrid({ modules }: { modules: ModuleCard[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((m, i) => (
        <Link
          key={m.id}
          href={`/cabinet/modules/${m.id}`}
          className="enter glass group block overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-gold/70 hover:bg-ink-950/70"
          style={step(i)}
        >
          <div className="relative flex aspect-[16/8] items-center justify-center bg-gradient-to-br from-ink-800 via-ink-700 to-steel-600">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(241,198,87,0.28),transparent_58%)]" />
            {/* Modul ustida: ichidagi darslarning umumiy davomiyligi (dars kartochkasidagi vaqt belgisi kabi) */}
            {m.totalTime && <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white">{m.totalTime}</span>}
          </div>
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-gold-text/60">{i + 1}-modul</p>
            <h3 className="mt-1 text-xl font-bold text-gold-text">{m.title}</h3>
            {m.description && <p className="mt-2 text-sm leading-relaxed text-gold-text/80">{m.description}</p>}
            <div className="mt-4 space-y-2">
              <ProgressBar dark value={m.available ? (m.doneCount / m.available) * 100 : 0} />
              <p className="text-sm font-medium text-gold-text">{m.doneCount} / {m.available} dars · {m.lessonCount} ta video →</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
