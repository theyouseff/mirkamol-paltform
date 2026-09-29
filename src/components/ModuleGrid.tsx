import type { CSSProperties } from "react";
import { CardLink } from "./CardLink";
import { ProgressBar } from "./ProgressBar";
import { ModuleIcon } from "./ModuleIcon";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

export type ModuleCard = { id: string; title: string; description: string; lessonCount: number; doneCount: number; available: number; totalTime?: string; iconUrl?: string };

// Kurs ichidagi modul bloklari: ikonka, raqam, nom, umumiy vaqt va progress (muqova rasmi yo'q).
// Orqa fonda ikonkaning katta xira nusxasi — blok bo'sh ko'rinmasin. Bosilganda modul ichidagi video darslar ochiladi.
export function ModuleGrid({ modules }: { modules: ModuleCard[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((m, i) => (
        <CardLink
          key={m.id}
          href={`/cabinet/modules/${m.id}`}
          className="enter glass card-press group relative flex flex-col overflow-hidden p-5 sm:p-6"
          style={step(i)}
        >
          {m.iconUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.iconUrl}
              alt=""
              aria-hidden
              className="pointer-events-none absolute -bottom-10 -right-8 h-44 w-44 -rotate-12 object-contain opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.11] group-data-[opening]:opacity-[0.12]"
            />
          )}
          <div className="relative flex items-start gap-4">
            <ModuleIcon src={m.iconUrl} n={i + 1} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-gold-text/60">{i + 1}-modul</p>
                {m.totalTime && <span className="rounded-md border border-gold/20 bg-black/30 px-2 py-0.5 text-xs font-medium tabular-nums text-gold-text/80">{m.totalTime}</span>}
              </div>
              <h3 className="mt-1 text-xl font-bold leading-snug text-gold-text">{m.title}</h3>
            </div>
          </div>
          {m.description && <p className="relative mt-3 text-sm leading-relaxed text-gold-text/80">{m.description}</p>}
          <div className="relative mt-auto space-y-2 pt-5">
            <ProgressBar dark value={m.available ? (m.doneCount / m.available) * 100 : 0} />
            <p className="text-sm font-medium text-gold-text">{m.doneCount} / {m.available} dars · {m.lessonCount} ta video →</p>
          </div>
        </CardLink>
      ))}
    </div>
  );
}
