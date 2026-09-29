"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Summani qo'lda yozish maydoni: oddiy matn maydoni (strelka va g'ildirak bilan o'zgarmaydi), faqat raqam qabul qiladi,
// yozganda uch xonadan bo'shliq bilan ajratib ko'rsatadi (1 500 000). Serverga "1 500 000" ketadi — u bo'shliqlarni o'zi olib tashlaydi.
// value + onValueChange berilsa tashqaridan boshqariladi (masalan kurs tanlansa summa o'zi to'ladi), aks holda o'z holatini o'zi saqlaydi.
const MAX_DIGITS = 12;
const fmt = (n: number) => (n ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "");

export function MoneyInput({
  name,
  defaultValue = 0,
  value,
  onValueChange,
  className = "input",
  placeholder = "0",
}: {
  name: string;
  defaultValue?: number;
  value?: number;
  onValueChange?: (n: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const [inner, setInner] = useState(defaultValue);
  const num = value ?? inner;
  const ref = useRef<HTMLInputElement>(null);
  const caretDigits = useRef<number | null>(null); // kursordan chapda nechta raqam bor edi — qayta formatlagach shu joyga qaytariladi

  const restoreCaret = () => {
    const el = ref.current;
    const want = caretDigits.current;
    if (!el || want === null) return;
    caretDigits.current = null;
    let seen = 0;
    let pos = 0;
    while (pos < el.value.length && seen < want) {
      if (/\d/.test(el.value[pos])) seen++;
      pos++;
    }
    el.setSelectionRange(pos, pos);
  };
  useLayoutEffect(restoreCaret); // qiymat o'zgarib qayta chizilganda

  return (
    <input
      ref={ref}
      name={name}
      inputMode="numeric"
      autoComplete="off"
      className={className}
      placeholder={placeholder}
      value={fmt(num)}
      onChange={(e) => {
        const raw = e.target.value;
        caretDigits.current = raw.slice(0, e.target.selectionStart ?? raw.length).replace(/\D/g, "").length;
        const digits = raw.replace(/\D/g, "").slice(0, MAX_DIGITS);
        const n = digits ? Number(digits) : 0;
        setInner(n);
        onValueChange?.(n);
        // Harf yozilsa qiymat o'zgarmaydi, qayta chizish bo'lmaydi, React esa maydonni asl qiymatga qaytarib kursorni oxiriga uloqtiradi — shuni tuzatamiz
        queueMicrotask(restoreCaret);
      }}
    />
  );
}
