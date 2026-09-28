"use client";

import { useEffect, useState } from "react";
import { pollEntries, type EntryNotice } from "@/lib/actions/presence";

const POLL_MS = 10_000;
const SHOW_MS = 7000;
const CURSOR_KEY = "entryCursor";

// Admin/kurator uchun: o'quvchi platformaga kirganda tepada o'ngda "Aziz platformaga kirdi" xabari chiqadi.
export function EntryToaster() {
  const [queue, setQueue] = useState<EntryNotice[]>([]);

  useEffect(() => {
    let cursor: string | null = null;
    try {
      cursor = localStorage.getItem(CURSOR_KEY);
    } catch {}
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await pollEntries(cursor);
        cursor = res.now;
        try {
          localStorage.setItem(CURSOR_KEY, res.now);
        } catch {}
        if (res.items.length) setQueue((q) => [...q, ...res.items].slice(-4));
      } catch {}
    };
    tick();
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  useEffect(() => {
    if (queue.length === 0) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), SHOW_MS);
    return () => clearTimeout(t);
  }, [queue]);

  if (queue.length === 0) return null;
  const n = queue[0];
  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[70] max-w-[calc(100vw-1.5rem)]">
      <div key={n.id} className="toast-in pointer-events-auto flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-ink-900/95 px-4 py-3 shadow-2xl backdrop-blur-md" role="status" aria-live="polite">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <p className="min-w-0 break-words text-sm text-gold-text">
          <b>{n.name}</b> platformaga kirdi{queue.length > 1 ? ` · yana ${queue.length - 1} ta` : ""}
        </p>
        <button type="button" onClick={() => setQueue((q) => q.slice(1))} className="shrink-0 rounded-full px-1.5 text-lg leading-none text-gold-text/60 hover:text-gold-text" aria-label="Yopish">
          ×
        </button>
      </div>
    </div>
  );
}
