"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { pollChatNotices, type ChatNotice } from "@/lib/actions/chat";

const POLL_MS = 8000;
const SHOW_MS = 9000;
const SEEN_KEY = "chatToastSeen";

const readSeen = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
  } catch {
    return [];
  }
};
const writeSeen = (ids: string[]) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-50)));
  } catch {}
};

// Platforma ichida tepada chiqadigan bildirishnoma: "CHAT abduholiq: salom". Har bir xabar bir marta ko'rsatiladi;
// bosilsa chat ochiladi; chat sahifasining o'zida ko'rsatilmaydi. Xabar faqat shu foydalanuvchining o'z suhbatidan keladi.
export function ChatToaster({ chatHref }: { chatHref: string }) {
  const path = usePathname();
  const onChat = path.startsWith(chatHref);
  const onChatRef = useRef(onChat);
  const [queue, setQueue] = useState<ChatNotice[]>([]);
  onChatRef.current = onChat;

  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const notices = await pollChatNotices();
        const seen = readSeen();
        const fresh = notices.filter((n) => !seen.includes(n.id));
        if (fresh.length === 0) return;
        // Chat ochiq bo'lsa xabar u yerda ko'rinadi — bildirishnoma chiqmaydi, lekin "ko'rildi" deb belgilanadi
        writeSeen([...seen, ...fresh.map((n) => n.id)]);
        if (!onChatRef.current) setQueue((q) => [...q, ...fresh.reverse()].slice(-3));
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

  // Bildirishnoma bir necha soniyadan keyin o'zi yo'qoladi
  useEffect(() => {
    if (queue.length === 0) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), SHOW_MS);
    return () => clearTimeout(t);
  }, [queue]);

  if (queue.length === 0 || onChat) return null;
  const n = queue[0];
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex justify-center px-3">
      <div key={n.id} className="toast-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-gold/40 bg-ink-900/95 px-4 py-3 shadow-2xl backdrop-blur-md" role="status" aria-live="polite">
        <Link href={chatHref} onClick={() => setQueue([])} className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold">Chat{queue.length > 1 ? ` · yana ${queue.length - 1} ta` : ""}</p>
          <p className="mt-0.5 line-clamp-2 break-words text-sm text-gold-text">
            <b>{n.from}:</b> {n.body}
          </p>
        </Link>
        <button type="button" onClick={() => setQueue((q) => q.slice(1))} className="shrink-0 rounded-full px-2 text-lg leading-none text-gold-text/60 hover:text-gold-text" aria-label="Yopish">
          ×
        </button>
      </div>
    </div>
  );
}
