"use client";

import { useState } from "react";

const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktyabr", "Noyabr", "Dekabr"];
const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

const pad = (n: number) => String(n).padStart(2, "0");

// O'quvchi platformaga kirgan kunlar oltin doirada belgilanadi. today — "2026-09-24" (Toshkent vaqti).
export function VisitCalendar({ days, today }: { days: string[]; today: string }) {
  const visited = new Set(days);
  const [ty, tm] = today.split("-").map(Number);
  const [view, setView] = useState({ year: ty, month: tm - 1 }); // month: 0..11

  const first = new Date(Date.UTC(view.year, view.month, 1));
  const offset = (first.getUTCDay() + 6) % 7; // haftani dushanbadan boshlaymiz
  const count = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const key = (d: number) => `${view.year}-${pad(view.month + 1)}-${pad(d)}`;
  const monthCount = Array.from({ length: count }, (_, i) => key(i + 1)).filter((k) => visited.has(k)).length;

  const move = (delta: number) =>
    setView(({ year, month }) => {
      const m = month + delta;
      return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  const isCurrent = view.year === ty && view.month === tm - 1;

  return (
    <section className="glass p-5" aria-label="Kirgan kunlar kalendari">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} className="flex h-9 w-9 items-center justify-center rounded-full text-gold-text/80 transition hover:bg-white/10 hover:text-gold-text" aria-label="Oldingi oy">←</button>
        <p className="font-bold text-gold-text">{MONTHS[view.month]} {view.year}</p>
        <button type="button" onClick={() => move(1)} disabled={isCurrent} className="flex h-9 w-9 items-center justify-center rounded-full text-gold-text/80 transition hover:bg-white/10 hover:text-gold-text disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Keyingi oy">→</button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-1.5 text-center text-sm">
        {WEEKDAYS.map((w) => (
          <span key={w} className="pb-1 text-xs font-medium uppercase tracking-wider text-gold-text/50">{w}</span>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <span key={`e${i}`} />
          ) : visited.has(key(d)) ? (
            <span key={d} title="Shu kuni kirgan" className="gold-gloss relative isolate mx-auto flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-sm before:rounded-none!">{d}</span>
          ) : (
            <span key={d} className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm ${key(d) === today ? "ring-1 ring-gold text-gold-text" : "text-gold-text/60"}`}>{d}</span>
          ),
        )}
      </div>

      <p className="mt-4 border-t border-white/10 pt-3 text-sm text-gold-text/80">
        {isCurrent ? "Shu oyda" : `${MONTHS[view.month]} oyida`} <b className="text-gold-text">{monthCount}</b> kun kirgansiz
      </p>
    </section>
  );
}
