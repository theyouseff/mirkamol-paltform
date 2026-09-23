import Link from "next/link";
import type { Lesson, Module } from "@prisma/client";
import { formatDate } from "@/lib/format";
import type { LessonState } from "@/lib/access";

type Props = {
  modules: (Module & { lessons: (Lesson & { state: LessonState })[] })[];
  done: Set<string>;
  activeId?: string;
};

export function LessonList({ modules, done, activeId }: Props) {
  return (
    <div className="space-y-5">
      {modules.map((m) => (
        <div key={m.id}>
          <h3 className="mb-2 text-sm font-semibold text-zinc-500">{m.title}</h3>
          <ul className="space-y-1">
            {m.lessons.map((l) => {
              const icon = l.state !== "open" ? "🔒" : done.has(l.id) ? "✅" : "▶️";
              const hint = l.state === "tariff" ? "Yuqori tarifda" : l.state === "scheduled" && l.openAt ? `${formatDate(l.openAt)} da ochiladi` : null;
              const cls = `flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${l.id === activeId ? "bg-brand-soft font-medium text-brand" : ""}`;
              return (
                <li key={l.id}>
                  {l.state === "open" ? (
                    <Link href={`/cabinet/lessons/${l.id}`} className={`${cls} hover:bg-zinc-50`}>
                      <span>{icon}</span><span>{l.title}</span>
                    </Link>
                  ) : (
                    <div className={`${cls} text-zinc-400`}>
                      <span>{icon}</span>
                      <span>{l.title}{hint && <span className="block text-xs">{hint}</span>}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
