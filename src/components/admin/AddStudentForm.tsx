"use client";

import { useActionState, useState } from "react";
import { addStudent, type AddStudentState } from "@/lib/actions/admin";
import { SubmitButton } from "../SubmitButton";
import { MoneyInput } from "./MoneyInput";

type CourseOption = { id: string; label: string; price: number };

const MAIL_TEXT = {
  sent: "✓ Login va parol emailga yuborildi",
  failed: "⚠ Email yuborilmadi",
  skipped: "Email yuborilmadi (tanlanmagan)",
} as const;

export function AddStudentForm({ courses }: { courses: CourseOption[] }) {
  const [state, action] = useActionState<AddStudentState, FormData>(addStudent, {});
  // Belgilangan kurslar va har birining summasi (kurs narxi bilan to'ladi, qo'lda o'zgartirsa bo'ladi). Soni cheklanmagan.
  const [picked, setPicked] = useState<Record<string, number>>({});
  const r = state.result;
  const toggle = (c: CourseOption, on: boolean) =>
    setPicked((p) => {
      const next = { ...p };
      if (on) next[c.id] = c.price;
      else delete next[c.id];
      return next;
    });
  const count = Object.keys(picked).length;
  const total = Object.values(picked).reduce((a, b) => a + b, 0);

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold">O&apos;quvchi qo&apos;shish / kurs ochish</h2>
        <p className="text-sm text-zinc-500">
          To&apos;lov kelgach shu yerda kiriting: yangi o&apos;quvchiga akkaunt ochiladi, tayyor parol yaratilib emailiga yuboriladi — o&apos;quvchi email va shu parol bilan kiradi (keyin «Parol» bo&apos;limida o&apos;zgartira oladi). Bir nechta kursni birdan belgilasangiz bo&apos;ladi. Mavjud o&apos;quvchiga faqat yangi kurslar qo&apos;shiladi (eskilari qoladi).
        </p>
      </div>
      <form action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input" placeholder="ism@gmail.com" required />
          </div>
          <div>
            <label className="label">Ism va familiya <span className="font-normal text-zinc-400">(yangi o&apos;quvchi uchun)</span></label>
            <input name="name" className="input" placeholder="Masalan, Aziz Karimov" />
          </div>
        </div>

        <div>
          <label className="label">Kurslar <span className="font-normal text-zinc-400">(bir yoki bir nechta)</span></label>
          <div className="space-y-2 rounded-xl border border-zinc-200 p-2">
            {courses.map((c) => {
              const on = c.id in picked;
              return (
                <div key={c.id} className={`flex flex-wrap items-center gap-3 rounded-lg px-3 py-2 transition ${on ? "bg-amber-50" : "hover:bg-zinc-50"}`}>
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-sm">
                    <input type="checkbox" name="courseId" value={c.id} checked={on} onChange={(e) => toggle(c, e.target.checked)} className="h-4 w-4 accent-amber-600" />
                    <span className="truncate font-medium">{c.label}</span>
                  </label>
                  {on && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Summa</span>
                      <MoneyInput name={`amount_${c.id}`} value={picked[c.id]} onValueChange={(n) => setPicked((p) => ({ ...p, [c.id]: n }))} className="input w-40 py-1.5" />
                    </div>
                  )}
                </div>
              );
            })}
            {courses.length === 0 && <p className="px-3 py-2 text-sm text-zinc-500">Avval kurs yarating.</p>}
          </div>
          {count > 0 && <p className="mt-1 text-xs text-zinc-500">Belgilangan: {count} ta kurs · jami {total.toLocaleString("ru-RU")} so&apos;m</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Manba</label>
            <input name="source" list="sources" className="input" placeholder="Instagram" />
            <datalist id="sources">
              <option value="Instagram" /><option value="Telegram" /><option value="Vebinar" /><option value="Tavsiya" /><option value="Reklama" />
            </datalist>
          </div>
          <div>
            <label className="label">Izoh</label>
            <input name="note" className="input" placeholder="Masalan: kartaga tushdi, skrinshot Telegramda" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="sendMail" defaultChecked /> Emailga login va parol yuborilsin
        </label>
        <SubmitButton disabled={count === 0}>{count > 1 ? `${count} ta kursni ochish` : "Kirish ochish"}</SubmitButton>
      </form>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      {r && (
        <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-800">
            {r.isNew ? "Yangi akkaunt ochildi" : "Mavjud akkauntga kurs qo'shildi"}: {r.name} → {r.courses.map((t) => `«${t}»`).join(", ")}
          </p>
          {r.skipped.length > 0 && <p className="text-amber-700">Allaqachon ochiq edi (o&apos;zgarmadi): {r.skipped.map((t) => `«${t}»`).join(", ")}</p>}
          {r.password && (
            <div className="rounded-lg bg-white p-3">
              <p>Login (email): <b>{r.email}</b></p>
              <p>Parol: <b className="font-mono text-base">{r.password}</b></p>
              <p className="mt-1 text-xs text-zinc-500">O&apos;quvchi shu email va parol bilan kiradi. Xat ketmasa yoki yo&apos;qolsa, parolni o&apos;quvchiga Telegramda shaxsiy xabarda yuboring. Parolni keyin ham o&apos;quvchilar ro&apos;yxatida «Ko&apos;rsatish» tugmasi bilan ko&apos;rishingiz mumkin (o&apos;quvchi uni o&apos;zi o&apos;zgartirmaguncha).</p>
            </div>
          )}
          <p className={r.mail === "failed" ? "text-amber-700" : "text-zinc-600"}>
            {MAIL_TEXT[r.mail]}{r.mailReason ? `: ${r.mailReason}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
