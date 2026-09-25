"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { unreadPeople } from "@/lib/actions/chat";

// Kurator menyusidagi "Chat": yonida nechta o'quvchi yozgani (o'qilmagan) qizil belgida; har 10 soniyada o'zi yangilanadi.
export function ChatNavLink({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);
  const [fresh, setFresh] = useState(false); // yangi o'quvchi yozganda belgi bir necha soniya "uradi"
  const prev = useRef(initial);

  useEffect(() => {
    setCount(initial);
  }, [initial]);

  useEffect(() => {
    if (count > prev.current) {
      setFresh(true);
      const t = setTimeout(() => setFresh(false), 4000);
      prev.current = count;
      return () => clearTimeout(t);
    }
    prev.current = count;
  }, [count]);

  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && unreadPeople().then(setCount).catch(() => {});
    const timer = setInterval(tick, 10_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  return (
    <Link href="/curator/chat" className="btn gap-1.5 text-gold-text/85 hover:text-gold-text" title={count > 0 ? `${count} ta o'quvchi yozgan` : "Chat"}>
      Chat
      {count > 0 && (
        <span className="relative flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
          {fresh && <span className="absolute inset-0 animate-ping rounded-full bg-red-500/60" aria-hidden />}
          <span className="relative">{count}</span>
        </span>
      )}
    </Link>
  );
}
