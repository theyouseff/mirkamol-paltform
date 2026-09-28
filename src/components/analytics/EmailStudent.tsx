"use client";

import { useState, useTransition } from "react";
import { emailStudent } from "@/lib/actions/email";

// "Email yozish": bosilganda matn maydoni ochiladi (tepada o'quvchining emaili), «Yuborish» xatni shu emailga jo'natadi.
export function EmailStudent({ studentId, name, email }: { studentId: string; name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () => {
    if (!text.trim() || pending) return;
    startTransition(async () => {
      const res = await emailStudent(studentId, text);
      if (res.ok) {
        setState({ ok: true, text: "Xat yuborildi" });
        setText("");
        setOpen(false);
      } else setState({ ok: false, text: res.error ?? "Yuborib bo'lmadi" });
    });
  };

  return (
    <>
      <button type="button" onClick={() => { setOpen((o) => !o); setState(null); }} className="btn-outline shrink-0 px-3 py-1.5 text-xs">
        {open ? "Yopish" : "Email yozish"}
      </button>
      {state?.ok && !open && <span className="text-xs text-green-700">✓ {state.text}</span>}
      {open && (
        <div className="basis-full rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-sm text-zinc-500">
            Kimga: <b className="text-zinc-900">{email}</b> <span className="text-zinc-400">({name})</span>
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={3000}
            autoFocus
            placeholder="Xabaringizni yozing..."
            className="input mt-2 resize-y"
          />
          {state && !state.ok && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.text}</p>}
          <div className="mt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-outline px-3 py-1.5 text-xs">Bekor qilish</button>
            <button type="button" onClick={send} disabled={pending || !text.trim()} className="btn-primary px-4 py-1.5 text-xs disabled:opacity-60">{pending ? "Yuborilmoqda..." : "Yuborish"}</button>
          </div>
        </div>
      )}
    </>
  );
}
