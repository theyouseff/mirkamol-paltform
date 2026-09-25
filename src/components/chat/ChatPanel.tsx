"use client";

import { useState } from "react";
import { ChatThread } from "./ChatThread";

export type ChatStudent = { id: string; name: string; email: string; unread: number; lastAt: string | null; lastBody: string };

// Kurator chati: chapda o'quvchilar ro'yxati, tanlansa o'ngda suhbat ochiladi. Telefonda ro'yxat va suhbat almashadi.
// readOnly — admin kuzatuvi: yozish yopiq, "o'qildi" belgisi o'zgarmaydi.
export function ChatPanel({ students, curatorId, readOnly = false }: { students: ChatStudent[]; curatorId: string; readOnly?: boolean }) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Ochilgan suhbatdagi "yangi" belgisi o'chadi
  const [read, setRead] = useState<Record<string, true>>({});

  const selected = students.find((s) => s.id === selectedId) ?? null;
  const list = students
    .filter((s) => !q || `${s.name} ${s.email}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? "") || a.name.localeCompare(b.name));

  return (
    <div className={`glass grid overflow-hidden lg:grid-cols-[320px_1fr] ${readOnly ? "h-[36rem] max-h-[85dvh]" : "h-[calc(100dvh-9rem)] min-h-[28rem]"}`}>
      {/* Chap: o'quvchilar */}
      <aside className={`flex min-h-0 flex-col border-white/10 p-4 lg:border-r ${selected ? "max-lg:hidden" : ""}`}>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold text-gold-text">O&apos;quvchilar</h2>
          <span className="text-xs text-gold-text/60">{students.length} ta</span>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ism yoki email"
          className="mb-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-gold-text placeholder:text-gold-text/40 focus:border-gold focus:outline-none"
        />
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-0.5">
          {list.map((s) => {
            const unread = read[s.id] ? 0 : s.unread;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(s.id);
                    if (!readOnly) setRead((r) => ({ ...r, [s.id]: true }));
                  }}
                  className={`w-full rounded-xl border px-4 py-2.5 text-left transition ${s.id === selectedId ? "border-gold/40 bg-gradient-to-r from-gold/20 to-transparent shadow-[inset_3px_0_0_#c9a227]" : "border-transparent hover:bg-white/5"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-gold-text">{s.name}</p>
                    {unread > 0 && <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">{unread}</span>}
                  </div>
                  <p className="truncate text-xs text-gold-text/55">{s.lastBody || s.email}</p>
                </button>
              </li>
            );
          })}
          {list.length === 0 && <li className="px-3 py-8 text-center text-sm text-gold-text/60">{students.length === 0 ? (readOnly ? "Kursda o'quvchilar yo'q" : "Sizga o'quvchilar biriktirilmagan") : "Topilmadi"}</li>}
        </ul>
      </aside>

      {/* O'ng: suhbat */}
      <section className={`flex min-h-0 flex-col p-4 ${selected ? "" : "max-lg:hidden"}`}>
        {selected ? (
          <>
            <div className="mb-2 flex items-center gap-3 border-b border-white/10 pb-3">
              <button type="button" onClick={() => setSelectedId(null)} className="text-gold-text/80 hover:text-gold-text lg:hidden" aria-label="Ro'yxatga qaytish">←</button>
              <div className="min-w-0">
                <p className="truncate font-semibold text-gold-text">{selected.name}</p>
                <p className="truncate text-xs text-gold-text/60">{selected.email}</p>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <ChatThread key={selected.id} studentId={selected.id} curatorId={curatorId} mine="STAFF" disabledNote={readOnly ? "Admin sifatida faqat ko'rasiz — yozish kuratorlar uchun" : undefined} />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-sm text-gold-text/60">Suhbatni ochish uchun chapdan o&apos;quvchini tanlang</div>
        )}
      </section>
    </div>
  );
}
