"use client";

import { useState } from "react";
import { ChatThread } from "./ChatThread";

export type StudentCurator = { id: string; name: string; unread: number };

// O'quvchi chati: har bir kurator bilan alohida suhbat. Bitta kurator bo'lsa — to'g'ridan-to'g'ri, bir nechta bo'lsa — tanlash tugmalari.
export function StudentChat({ studentId, curators }: { studentId: string; curators: StudentCurator[] }) {
  const [id, setId] = useState(curators[0]?.id ?? "");
  const [read, setRead] = useState<Record<string, true>>({});
  if (curators.length === 0) return null;
  return (
    <div className="flex h-full min-h-0 flex-col">
      {curators.length > 1 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {curators.map((c) => {
            const unread = read[c.id] || c.id === id ? 0 : c.unread;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setId(c.id);
                  setRead((r) => ({ ...r, [c.id]: true }));
                }}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${c.id === id ? "border-gold/40 bg-gradient-to-r from-gold/20 to-transparent text-gold-text shadow-[inset_3px_0_0_#c9a227]" : "border-white/10 bg-white/5 text-gold-text/80 hover:bg-white/10"}`}
              >
                {c.name}
                {unread > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{unread}</span>}
              </button>
            );
          })}
        </div>
      )}
      <div className="min-h-0 flex-1">
        <ChatThread key={id} studentId={studentId} curatorId={id} mine="STUDENT" />
      </div>
    </div>
  );
}
