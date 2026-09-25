"use client";
import { useState } from "react";
import { createPortal } from "react-dom";

// "Chiqish": bosilgan zahoti tugma o'chadi, sahifa ustida "Chiqilmoqda…" chiqadi va brauzer to'g'ridan-to'g'ri
// /api/session/logout ga o'tadi (cookie o'chiriladi, bosh sahifaga yo'naltiriladi) — server action va sahifa yangilanishini kutmaymiz.
export function LogoutButton({ className = "btn", formClassName }: { className?: string; formClassName?: string }) {
  const [pending, setPending] = useState(false);
  return (
    <div className={formClassName}>
      <button
        type="button"
        disabled={pending}
        className={`${className} ${pending ? "opacity-60" : ""}`}
        onClick={() => {
          setPending(true);
          window.location.assign("/api/session/logout");
        }}
      >
        Chiqish
      </button>
      {pending &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/70 backdrop-blur-sm" role="status" aria-live="polite">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900 px-6 py-4 text-gold-text shadow-2xl">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold-text/30 border-t-gold-text" aria-hidden />
              Chiqilmoqda…
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
