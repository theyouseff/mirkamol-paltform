"use client";

import { useEffect, useState, useTransition } from "react";
import { revealPassword } from "@/lib/actions/admin";

// Admin ro'yxatida o'quvchi parolini ko'rsatadi. Parol sahifa bilan birga kelmaydi: "Ko'rsatish" bosilganda serverdan olinadi
// va 30 soniyadan keyin yana yashiriladi. has=false: parol saqlanmagan (o'quvchi o'zi o'zgartirgan yoki eski akkaunt).
export function PasswordReveal({ userId, has }: { userId: string; has: boolean }) {
  const [pw, setPw] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!pw) return;
    const t = setTimeout(() => setPw(null), 30_000);
    return () => clearTimeout(t);
  }, [pw]);

  if (!has) return <span className="text-xs text-zinc-400" title="O'quvchi parolni o'zi o'zgartirgan yoki akkaunt eski. «Yangi parol» tugmasi bilan yangisini yaratsangiz, shu yerda ko'rinadi.">—</span>;

  if (pw) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <b className="select-all rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[13px] text-zinc-900">{pw}</b>
        <button
          type="button"
          className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-50"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(pw);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
        >
          {copied ? "✓" : "Nusxa"}
        </button>
        <button type="button" className="text-xs text-zinc-400 hover:text-zinc-600" onClick={() => setPw(null)}>Yashirish</button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-zinc-400" aria-hidden>••••••••</span>
      <button
        type="button"
        disabled={pending}
        className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        onClick={() =>
          start(async () => {
            setErr("");
            const r = await revealPassword(userId);
            if (r.password) setPw(r.password);
            else setErr(r.error ?? "Parol topilmadi");
          })
        }
      >
        {pending ? "..." : "Ko'rsatish"}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </span>
  );
}
