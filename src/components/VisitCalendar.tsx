"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearDayNote, saveDayNote } from "@/lib/actions/curator";
import { DAY_STATUSES, type DayNote, type DayStatus } from "@/lib/day-status";

const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktyabr", "Noyabr", "Dekabr"];
const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

const pad = (n: number) => String(n).padStart(2, "0");

// O'quvchi platformaga kirgan kunlar oltin doirada, kirmagan kunlar (from dan kechagacha) qizil rangda belgilanadi.
// today — "2026-09-24" (Toshkent vaqti); bugun hali tugamagani uchun qizil emas.
// annotate — kurator/admin uchun: kelmagan kun bosilsa, kalendar ostida oyna ochiladi (holat va sabab yoziladi).
export function VisitCalendar({ days, today, from, subject = "you", annotate }: { days: string[]; today: string; from?: string; subject?: "you" | "student"; annotate?: { studentId: string; notes: DayNote[] } }) {
  const visited = new Set(days);
  const [ty, tm] = today.split("-").map(Number);
  const [view, setView] = useState({ year: ty, month: tm - 1 }); // month: 0..11

  // Kurator izohlari (kelmagan kunga qo'yilgan holat va sabab)
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState<Record<string, DayNote>>(() => Object.fromEntries((annotate?.notes ?? []).map((n) => [n.day, n])));
  const [sel, setSel] = useState<string | null>(null);
  const [status, setStatus] = useState<DayStatus | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const openDay = (k: string) => {
    setSel(k);
    setStatus(notes[k]?.status ?? null);
    setReason(notes[k]?.reason ?? "");
    setError("");
  };
  const done = (next: Record<string, DayNote>) => {
    setNotes(next);
    setSel(null);
    router.refresh();
  };
  const save = () =>
    startTransition(async () => {
      if (!annotate || !sel || !status) return;
      const res = await saveDayNote(annotate.studentId, sel, status, reason);
      if (!res.ok) return setError(res.error ?? "Saqlanmadi");
      done({ ...notes, [sel]: { day: sel, status, reason: reason.trim(), author: "Siz" } });
    });
  const clear = () =>
    startTransition(async () => {
      if (!annotate || !sel) return;
      const res = await clearDayNote(annotate.studentId, sel);
      if (!res.ok) return setError(res.error ?? "O'chirilmadi");
      const rest = { ...notes };
      delete rest[sel];
      done(rest);
    });

  const first = new Date(Date.UTC(view.year, view.month, 1));
  const offset = (first.getUTCDay() + 6) % 7; // haftani dushanbadan boshlaymiz
  const count = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const key = (d: number) => `${view.year}-${pad(view.month + 1)}-${pad(d)}`;
  const isMissed = (k: string) => !!from && k >= from && k < today && !visited.has(k);
  const keys = Array.from({ length: count }, (_, i) => key(i + 1));
  const monthCount = keys.filter((k) => visited.has(k)).length;
  // Kurator holatlari: "ko'rdi" va "sababli" kunlar kirmagan hisoblanmaydi
  const covered = (k: string) => notes[k]?.status === "SEEN" || notes[k]?.status === "EXCUSED";
  const missedCount = keys.filter((k) => isMissed(k) && !covered(k)).length;
  const seenCount = keys.filter((k) => isMissed(k) && notes[k]?.status === "SEEN").length;
  const excusedCount = keys.filter((k) => isMissed(k) && notes[k]?.status === "EXCUSED").length;
  const tone = { SEEN: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/60", NOT_SEEN: "bg-red-500/30 text-red-200 ring-2 ring-red-400/70", EXCUSED: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/60" } as const;

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
          ) : isMissed(key(d)) ? (
            annotate ? (
              <button
                key={d}
                type="button"
                onClick={() => openDay(key(d))}
                title={notes[key(d)] ? DAY_STATUSES.find((x) => x.value === notes[key(d)].status)?.label : "Shu kuni kirmagan (bosib holat belgilang)"}
                className={`mx-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-sm font-medium transition hover:scale-110 ${notes[key(d)] ? tone[notes[key(d)].status] : "bg-red-500/20 text-red-300 ring-1 ring-red-400/50"} ${sel === key(d) ? "outline outline-2 outline-offset-2 outline-gold" : ""}`}
              >
                {d}
              </button>
            ) : (
              <span key={d} title="Shu kuni kirmagan" className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-sm font-medium text-red-300 ring-1 ring-red-400/50">{d}</span>
            )
          ) : (
            <span key={d} className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm ${key(d) === today ? "ring-1 ring-gold text-gold-text" : "text-gold-text/60"}`}>{d}</span>
          ),
        )}
      </div>

      <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-sm text-gold-text/80">
        <p className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gradient-to-b from-[#f8d27a] to-[#dba548]" aria-hidden />
          {isCurrent ? "Shu oyda" : `${MONTHS[view.month]} oyida`} <b className="text-gold-text">{monthCount}</b> kun {subject === "student" ? "kirgan" : "kirgansiz"}
        </p>
        {!!from && (
          <p className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500/60 ring-1 ring-red-400/60" aria-hidden />
            <b className="text-red-300">{missedCount}</b> kun {subject === "student" ? "kirmagan" : "kirmagansiz"}
          </p>
        )}
        {seenCount > 0 && (
          <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500/60 ring-1 ring-emerald-400/60" aria-hidden /><b className="text-emerald-300">{seenCount}</b> kun kirmagan, lekin dars ko&apos;rgan</p>
        )}
        {excusedCount > 0 && (
          <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-sky-500/60 ring-1 ring-sky-400/60" aria-hidden /><b className="text-sky-300">{excusedCount}</b> kun sababli</p>
        )}
      </div>

      {/* Kurator oynasi: kelmagan kun bosilganda kalendar ostida ochiladi */}
      {annotate && sel && (
        <div className="panel-in mt-4 space-y-3 rounded-xl border border-gold/30 bg-black/25 p-4" role="dialog" aria-label="Kelmagan kun holati">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gold-text">{Number(sel.slice(8))}-{MONTHS[Number(sel.slice(5, 7)) - 1].toLowerCase()}, {sel.slice(0, 4)}</p>
              <p className="text-xs text-gold-text/60">Bu kuni o&apos;quvchi platformaga kirmagan</p>
            </div>
            <button type="button" onClick={() => setSel(null)} className="rounded-full px-2 text-gold-text/70 transition hover:bg-white/10 hover:text-gold-text" aria-label="Yopish">✕</button>
          </div>

          <div className="grid gap-2">
            {DAY_STATUSES.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setStatus(st.value)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${status === st.value ? `${tone[st.value]} border-transparent font-semibold` : "border-white/15 text-gold-text/80 hover:bg-white/5"}`}
              >
                {status === st.value ? "● " : "○ "}{st.label}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gold-text/70" htmlFor="day-reason">Sababi</label>
            <textarea
              id="day-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Masalan: kasal bo'lgan, safarda edi, aloqaga chiqmadi..."
              className="w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-gold-text placeholder:text-gold-text/40 focus:border-gold focus:outline-none"
            />
          </div>

          {notes[sel] && <p className="text-xs text-gold-text/50">Oxirgi belgilagan: {notes[sel].author}</p>}
          {error && <p className="rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-200">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={!status || pending} className="btn-primary flex-1 disabled:opacity-50">{pending ? "Saqlanmoqda..." : "Saqlash"}</button>
            {notes[sel] && (
              <button type="button" onClick={clear} disabled={pending} className="btn border border-white/20 text-gold-text/80 hover:bg-white/10 disabled:opacity-50">Tozalash</button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
