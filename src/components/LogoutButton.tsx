"use client";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { logout } from "@/lib/actions/auth";

// "Chiqish": bosilgan zahoti tugma o'zgaradi va butun sahifa ustida "Chiqilmoqda…" chiqadi — server javobini kutib o'tirmaymiz.
function Button({ className }: { className: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button type="submit" disabled={pending} className={`${className} ${pending ? "opacity-60" : ""}`}>
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
    </>
  );
}

export function LogoutButton({ className = "btn", formClassName }: { className?: string; formClassName?: string }) {
  return (
    <form action={logout} className={formClassName}>
      <Button className={className} />
    </form>
  );
}
