"use client";

import { useEffect, useState, type ComponentProps } from "react";
import Link from "next/link";

// Kartochka havolasi (kurs, modul, dars bloki). Bosilganda blok oldinga chiqadi va yangi sahifa ochilguncha
// shu holatda turadi (data-opening) — barmoq qo'yib yuborilganda orqaga qaytib, "hech narsa bo'lmayapti" degan taassurot qolmaydi.
export function CardLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const [opening, setOpening] = useState(false);

  // Sahifa ochilsa kartochka yo'qoladi; ochilmasa (internet uzilgan va h.k.) bir necha soniyadan keyin asl holiga qaytadi
  useEffect(() => {
    if (!opening) return;
    const timer = setTimeout(() => setOpening(false), 4000);
    return () => clearTimeout(timer);
  }, [opening]);

  return (
    <Link
      {...props}
      data-opening={opening || undefined}
      onClick={(e) => {
        onClick?.(e);
        // Yangi oynada ochish (Ctrl/Cmd/Shift, o'rta tugma) — joriy sahifa o'z joyida qoladi
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        setOpening(true);
      }}
    />
  );
}
