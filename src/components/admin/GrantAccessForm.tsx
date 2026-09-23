"use client";

import { useActionState } from "react";
import { grantAccess, type GrantState } from "@/lib/actions/admin";
import { SubmitButton } from "../SubmitButton";

export function GrantAccessForm({ tariffs }: { tariffs: { id: string; label: string }[] }) {
  const [state, action] = useActionState<GrantState, FormData>(grantAccess, {});
  return (
    <form action={action} className="card space-y-3">
      <h2 className="font-semibold">Qo&apos;lda kirish berish</h2>
      <p className="text-sm text-zinc-500">Naqd yoki o&apos;tkazma orqali to&apos;laganlar, bonus va h.k. uchun.</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr_140px_auto]">
        <input name="phone" className="input" placeholder="+998 90 123 45 67" required />
        <select name="tariffId" className="input" required>
          {tariffs.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <input name="amount" type="number" min={0} className="input" placeholder="Summa" defaultValue={0} />
        <SubmitButton>Kirish berish</SubmitButton>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-green-700">✓ {state.ok}</p>}
    </form>
  );
}
