"use client";

import { useEffect } from "react";
import { courseFileLink } from "@/lib/actions/files";

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  Plugins?: { Browser?: { open: (o: { url: string }) => Promise<void> } };
};

// Mobil ilovada (Capacitor) ishlaydi, oddiy brauzerda hech narsa qilmaydi.
// - Tashqi havolalar (Telegram va h.k.) va target=_blank — tizim brauzerida ochiladi (ilova ichida yo'qolib qolmasin).
// - Check-list PDF — Android WebView PDF ko'rsatmaydi: qisqa muddatli imzolangan havola olinib, tizim brauzerida ochiladi.
export function AppBridge() {
  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    const open = (url: string) => (cap.Plugins?.Browser ? cap.Plugins.Browser.open({ url }) : Promise.resolve(void window.open(url, "_system")));

    const onClick = async (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, location.href);
      const file = url.origin === location.origin && url.pathname.match(/^\/api\/file\/([^/]+)$/);
      if (file) {
        e.preventDefault();
        const link = await courseFileLink(file[1]).catch(() => null);
        if (link) await open(link);
        return;
      }
      if (url.origin !== location.origin || a.target === "_blank") {
        if (!/^https?:$/.test(url.protocol)) return; // tel:, mailto: — tizimning o'zi ochadi
        e.preventDefault();
        await open(url.href);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
