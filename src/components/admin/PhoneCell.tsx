"use client";

import { useState, useTransition } from "react";
import { updatePhone } from "@/lib/actions/admin";
import { formatPhone } from "@/lib/phone";

// O'quvchining telefon raqami (faqat admin sahifasida): raqam ko'rinadi, ✎ bilan o'zgartiriladi, bo'sh qoldirib saqlansa — o'chadi.
export function PhoneCell({ userId, phone }: { userId: string; phone: string | null }) {
  const [value, setValue] = useState(phone);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      const r = await updatePhone(userId, draft);
      if (r.ok) {
        setValue(r.phone ?? null);
        setEditing(false);
        setErr("");
      } else setErr(r.error ?? "Saqlab bo'lmadi");
    });

  if (editing) {
    return (
      <span className="mt-1 flex flex-wrap items-center gap-1">
        <input
          autoFocus
          type="tel"
          inputMode="tel"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder="+998 90 123 45 67"
          className="input w-44 py-1 text-xs"
        />
        <button type="button" disabled={pending} onClick={save} className="btn-outline px-2 py-1 text-xs">{pending ? "..." : "Saqlash"}</button>
        <button type="button" onClick={() => { setEditing(false); setErr(""); }} className="text-xs text-zinc-400 hover:text-zinc-600">Bekor</button>
        {err && <span className="w-full text-xs text-red-600">{err}</span>}
      </span>
    );
  }

  return (
    <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs">
      {value ? <a href={`tel:${value}`} className="text-zinc-600 hover:underline">{formatPhone(value)}</a> : <span className="text-zinc-400">Telefon yo&apos;q</span>}
      <button type="button" title={value ? "Raqamni o'zgartirish" : "Telefon raqam qo'shish"} onClick={() => { setDraft(value ?? ""); setEditing(true); }} className="rounded px-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">✎</button>
    </span>
  );
}
