"use client";

import { useActionState } from "react";
import { addCurator, type AddCuratorState } from "@/lib/actions/admin";
import { SubmitButton } from "../SubmitButton";

export function AddCuratorForm() {
  const [state, action] = useActionState<AddCuratorState, FormData>(addCurator, {});
  const r = state.result;
  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold">Kurator qo&apos;shish</h2>
        <p className="text-sm text-zinc-500">
          Yangi email bo&apos;lsa akkaunt ochiladi va emailiga bir martalik kod yuboriladi: kurator kodni kiritib, parolni o&apos;zi qo&apos;yadi va <b>kurator paneliga</b> kiradi (o&apos;quvchi kabinetiga ham, admin panelga ham emas). Mavjud foydalanuvchining emailini yozsangiz, roli kurator bo&apos;ladi (u qayta kirishi kerak).
        </p>
      </div>
      <form action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input" placeholder="kurator@gmail.com" required />
          </div>
          <div>
            <label className="label">Ism va familiya <span className="font-normal text-zinc-400">(yangi kurator uchun)</span></label>
            <input name="name" className="input" placeholder="Masalan, Dilnoza Aliyeva" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="sendMail" defaultChecked /> Emailga bir martalik kod yuborilsin
        </label>
        <SubmitButton>Kurator qo&apos;shish</SubmitButton>
      </form>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}

      {r && (
        <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-800">
            {r.promoted ? `${r.name} endi kurator. Qayta kirgach kurator paneli ochiladi.` : `Kurator akkaunti ochildi: ${r.name} (${r.email})`}
          </p>
          {!r.promoted && (
            <p className={r.mail === "failed" ? "text-amber-700" : "text-zinc-600"}>
              {r.mail === "sent" ? "✓ Bir martalik kod emailga yuborildi" : r.mail === "failed" ? `⚠ Email yuborilmadi${r.mailReason ? `: ${r.mailReason}` : ""}` : "Email yuborilmadi (tanlanmagan)"}
            </p>
          )}
          {r.activationCode && (
            <div className="rounded-lg bg-white p-3">
              <p>Login (email): <b>{r.email}</b></p>
              <p>Bir martalik kod (7 kun): <b className="font-mono text-base tracking-widest">{r.activationCode}</b></p>
              <p className="mt-1 text-xs text-zinc-500">Kodni kuratorga Telegramda shaxsiy xabarda yuboring; u saytda <b>/activate</b> sahifasida email va kodni kiritib, parol qo&apos;yadi. Kod faqat hozir ko&apos;rinadi.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
