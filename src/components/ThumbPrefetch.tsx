"use client";

import { useEffect } from "react";

// Kurs sahifasida (modullar ro'yxati) darslarning tayyor rasmlarini fonda oldindan yuklab qo'yadi: modulga kirilganda
// ular brauzer xotirasida tayyor turadi va dars bloklari rasm bilan darhol chiqadi. Rasmlar kichik (~40 KB), sahifani sekinlashtirmaydi:
// yuklash sahifa chizilgandan keyin, bo'sh vaqtda boshlanadi.
export function ThumbPrefetch({ urls }: { urls: string[] }) {
  useEffect(() => {
    const load = () => {
      for (const u of urls) {
        const img = new Image();
        img.decoding = "async";
        img.src = u;
      }
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(load, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [urls]);
  return null;
}
