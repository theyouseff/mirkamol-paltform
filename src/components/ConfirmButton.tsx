"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: React.ReactNode;
  message: string;
  className?: string;
  disabled?: boolean;
  formAction?: (formData: FormData) => void | Promise<void>;
};

// Server action formasi ichida: bosilganda saytning o'z tasdiq oynasi chiqadi (brauzerning "Подтвердите действие" oynasi emas).
// "Ha" bosilsa forma shu tugma bilan yuboriladi.
export function ConfirmButton({ children, message, className = "btn-danger", disabled, formAction }: Props) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const confirm = () => {
    setOpen(false);
    const b = btn.current;
    b?.form?.requestSubmit(b);
  };

  return (
    <>
      <button
        ref={btn}
        type="submit"
        formAction={formAction}
        disabled={disabled}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <p className="whitespace-pre-line text-sm leading-relaxed">{message}</p>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-outline px-4 py-2 text-sm" autoFocus>
                  Bekor qilish
                </button>
                <button type="button" onClick={confirm} className="btn-danger px-4 py-2 text-sm">
                  Ha, davom etish
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
