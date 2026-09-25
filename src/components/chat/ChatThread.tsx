"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { fetchMessages, sendMessage, type ChatMsg } from "@/lib/actions/chat";

const POLL_MS = 4000;

const clock = (iso: string) => new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tashkent" });

function merge(prev: ChatMsg[], incoming: ChatMsg[]) {
  const seen = new Set(prev.map((m) => m.id));
  const add = incoming.filter((m) => !seen.has(m.id));
  return add.length ? [...prev, ...add].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : prev;
}

// Bitta suhbat: xabarlar va yozish maydoni. Har 4 soniyada yangi xabarlarni tekshiradi (sahifa ochiq turganda).
// mine — kim ko'rib turibdi (o'z xabarlari o'ngda, oltin rangda).
export function ChatThread({ studentId, mine, disabledNote }: { studentId: string; mine: "STUDENT" | "STAFF"; disabledNote?: string }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const box = useRef<HTMLDivElement>(null);
  const stick = useRef(true); // pastda turgan bo'lsa yangi xabarda pastga tushadi

  useEffect(() => {
    let alive = true;
    let last: string | undefined;
    setMsgs([]);
    setLoaded(false);
    setError("");
    const load = async () => {
      const res = await fetchMessages(studentId, last);
      if (!alive) return;
      if (res.ok) {
        if (res.messages.length) {
          last = res.messages[res.messages.length - 1].createdAt;
          setMsgs((prev) => merge(prev, res.messages));
        }
        setLoaded(true);
      }
    };
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [studentId]);

  useEffect(() => {
    const el = box.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const send = () => {
    const body = text.trim();
    if (!body || pending) return;
    startTransition(async () => {
      const res = await sendMessage(studentId, body);
      if (!res.ok) return setError(res.error);
      setError("");
      setText("");
      stick.current = true;
      setMsgs((prev) => merge(prev, [res.message]));
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={box}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-1 py-2"
      >
        {!loaded && <p className="py-10 text-center text-sm text-gold-text/60">Yuklanmoqda...</p>}
        {loaded && msgs.length === 0 && <p className="py-10 text-center text-sm text-gold-text/60">Hali xabarlar yo&apos;q. Birinchi bo&apos;lib yozing.</p>}
        {msgs.map((m) => {
          const own = m.authorRole === mine;
          return (
            <div key={m.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${own ? "gold-gloss relative isolate overflow-hidden rounded-br-md" : "rounded-bl-md border border-white/15 bg-white/10 text-gold-text"}`}>
                {!own && <p className="mb-0.5 text-xs font-semibold opacity-70">{m.authorName}{m.authorRole === "STAFF" ? " · kurator" : ""}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-right text-[11px] ${own ? "opacity-60" : "text-gold-text/50"}`}>{clock(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="mb-2 rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-200">{error}</p>}
      {disabledNote ? (
        <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-gold-text/70">{disabledNote}</p>
      ) : (
        <div className="flex items-end gap-2 border-t border-white/10 pt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="Xabar yozing..." title="Enter — yuborish, Shift+Enter — yangi qator"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-gold-text placeholder:text-gold-text/40 focus:border-gold focus:outline-none"
          />
          <button type="button" onClick={send} disabled={pending || !text.trim()} className="btn-primary h-11 shrink-0 disabled:opacity-50">Yuborish</button>
        </div>
      )}
    </div>
  );
}
