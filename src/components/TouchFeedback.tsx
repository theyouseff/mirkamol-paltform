"use client";

import { useEffect } from "react";

// iOS Safari'da hech qanday "touchstart" tinglovchisi bo'lmasa, :active holati ishlamaydi
// (tugma bosilganda darhol o'zgarish ko'rinmaydi). Bo'sh tinglovchi shu muammoni hal qiladi —
// shundan keyin har bir tugma/havoladagi :active effekti (globals.css) telefonda ham ishlaydi.
export function TouchFeedback() {
  useEffect(() => {
    document.addEventListener("touchstart", () => {}, { passive: true });
  }, []);
  return null;
}
