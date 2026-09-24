"use client";

import { useActionState, useState } from "react";
import { addStudent, type AddStudentState } from "@/lib/actions/admin";
import { SubmitButton } from "../SubmitButton";

type CourseOption = { id: string; label: string; price: number };

const MAIL_TEXT = {
  sent: "✓ Bir martalik kod emailga yuborildi",
  failed: "⚠ Email yuborilmadi",
  skipped: "Email yuborilmadi (tanlanmagan)",
} as const;

export function AddStudentForm({ courses }: { courses: CourseOption[] }) {
  const [state, action] = useActionState<AddStudentState, FormData>(addStudent, {});
  const [amount, setAmount] = useState(courses[0]?.price ?? 0);
  const r = state.result;

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold">O&apos;quvchi qo&apos;shish / kurs ochish</h2>
        <p className="text-sm text-zinc-500">
          To&apos;lov kelgach shu yerda kiriting: yangi o&apos;quvchiga akkaunt ochiladi va emailiga bir martalik kod yuboriladi — o&apos;quvchi kodni saytga kiritib, parolni o&apos;zi qo&apos;yadi. Mavjud o&apos;quvchiga faqat yangi kurs ochiladi.
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
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <label className="label">Kurs</label>
            <select
              name="courseId"
              className="input"
              required
              onChange={(e) => setAmount(courses.find((c) => c.id === e.target.value)?.price ?? 0)}
            >
              {courses.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">To&apos;langan summa</label>
            <input name="amount" type="number" min={0} className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Manba</label>
            <input name="source" list="sources" className="input" placeholder="Instagram" />
            <datalist id="sources">
              <option value="Instagram" /><option value="Telegram" /><option value="Vebinar" /><option value="Tavsiya" /><option value="Reklama" />
            </datalist>
          </div>
        </div>
        <div>
          <label className="label">Izoh</label>
          <input name="note" className="input" placeholder="Masalan: kartaga tushdi, skrinshot Telegramda" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="sendMail" defaultChecked /> Emailga bir martalik kod yuborilsin
        </label>
        <SubmitButton>Kirish ochish</SubmitButton>
      </form>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      {r && (
        <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-800">
            {r.isNew ? "Yangi akkaunt ochildi" : "Mavjud akkauntga kurs qo'shildi"}: {r.name} → «{r.course}»
          </p>
          {r.activationCode && (
            <div className="rounded-lg bg-white p-3">
              <p>Login (email): <b>{r.email}</b></p>
              <p>Bir martalik kod (7 kun): <b className="font-mono text-base tracking-widest">{r.activationCode}</b></p>
              <p className="mt-1 text-xs text-zinc-500">Xat ketmadi. Kodni o&apos;quvchiga Telegramda shaxsiy xabarda yuboring; u saytda «Kodni kiritish» orqali email va kodni yozib, o&apos;zi parol qo&apos;yadi. Kod faqat hozir ko&apos;rinadi.</p>
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
