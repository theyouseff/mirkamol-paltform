"use client";

import { useActionState, useState } from "react";
import { addStudent, type AddStudentState } from "@/lib/actions/admin";
import { SubmitButton } from "../SubmitButton";

type TariffOption = { id: string; label: string; price: number };

const MAIL_TEXT = {
  sent: "✓ Login va parol emailga yuborildi",
  failed: "⚠ Email yuborilmadi",
  skipped: "Email yuborilmadi (tanlanmagan)",
} as const;

export function AddStudentForm({ tariffs }: { tariffs: TariffOption[] }) {
  const [state, action] = useActionState<AddStudentState, FormData>(addStudent, {});
  const [amount, setAmount] = useState(tariffs[0]?.price ?? 0);
  const r = state.result;

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold">O&apos;quvchi qo&apos;shish / kurs ochish</h2>
        <p className="text-sm text-zinc-500">
          To&apos;lov kelgach shu yerda kiriting: yangi o&apos;quvchiga akkaunt ochiladi, parol yaratiladi va emailiga yuboriladi. Mavjud o&apos;quvchiga faqat yangi kurs ochiladi.
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
            <label className="label">Kurs va tarif</label>
            <select
              name="tariffId"
              className="input"
              required
              onChange={(e) => setAmount(tariffs.find((t) => t.id === e.target.value)?.price ?? 0)}
            >
              {tariffs.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
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
          <input type="checkbox" name="sendMail" defaultChecked /> Emailga login/parol yuborilsin
        </label>
        <SubmitButton>Kirish ochish</SubmitButton>
      </form>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      {r && (
        <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-800">
            {r.isNew ? "Yangi akkaunt ochildi" : "Mavjud akkauntga kurs qo'shildi"}: {r.name} → «{r.course}» ({r.tariff})
          </p>
          {r.password && (
            <div className="rounded-lg bg-white p-3">
              <p>Login: <b>{r.email}</b></p>
              <p>Parol: <b className="font-mono text-base">{r.password}</b></p>
              <p className="mt-1 text-xs text-zinc-500">Parol faqat hozir ko&apos;rinadi. Email yuborilmasa, Telegramda o&apos;zingiz yuboring.</p>
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
