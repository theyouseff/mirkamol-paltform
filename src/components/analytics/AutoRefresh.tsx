"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Sahifa ochiq turganda har 20 soniyada ma'lumotni yangilaydi: "online" holati jonli o'zgarib turadi.
export function AutoRefresh({ everyMs = 20_000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => document.visibilityState === "visible" && router.refresh(), everyMs);
    return () => clearInterval(timer);
  }, [router, everyMs]);
  return null;
}
