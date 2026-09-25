"use client";

import { useEffect, useRef, useState } from "react";

type Course = { id: string; title: string };

// Kurslarni tanlash menyusi: tugma bosilsa pastga ro'yxat ochiladi. Tanlanganlar formaga "courseId" bo'lib yuboriladi.
// footer — menyu ichida pastda turadigan tugma (masalan, «Saqlash»).
export function CourseMenu({ courses, selected = [], footer, align = "left" }: { courses: Course[]; selected?: string[]; footer?: React.ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>(selected);
  const box = useRef<HTMLDivElement>(null);

  // Saqlangandan keyin (server yangi ro'yxat qaytarganda) menyu yopiladi va tanlov yangilanadi
  const key = selected.join(",");
  useEffect(() => {
    setChecked(selected);
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Tashqariga bosilsa yoki Esc bosilsa yopiladi
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = checked.length === 0 ? "Kurs biriktirish" : checked.length === 1 ? (courses.find((c) => c.id === checked[0])?.title ?? "1 ta kurs") : `${checked.length} ta kurs`;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`btn-outline min-w-44 justify-between gap-3 ${checked.length ? "border-brand" : ""}`}
      >
        <span className="truncate">{label}</span>
        <svg viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>

      {/* Yopiq bo'lsa ham katakchalar formada qoladi: yuborilganda tanlov yo'qolmaydi */}
      <div
        className={`absolute top-full z-30 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-zinc-200 bg-white p-2 shadow-xl ${align === "right" ? "right-0" : "left-0"} ${open ? "" : "hidden"}`}
        role="menu"
      >
        <div className="max-h-60 overflow-y-auto">
          {courses.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-zinc-50">
              <input
                type="checkbox"
                name="courseId"
                value={c.id}
                checked={checked.includes(c.id)}
                onChange={(e) => setChecked((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)))}
              />
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
            </label>
          ))}
          {courses.length === 0 && <p className="px-3 py-2 text-sm text-zinc-400">Kurslar yo&apos;q</p>}
        </div>
        {footer && <div className="mt-1 border-t border-zinc-100 p-1 pt-2" onClick={() => setOpen(false)}>{footer}</div>}
      </div>
    </div>
  );
}
