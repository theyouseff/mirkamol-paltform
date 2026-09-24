"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "@/lib/actions/student";
import { SubmitButton } from "./SubmitButton";

export function ChangePasswordForm() {
  const [state, action] = useActionState<PasswordState, FormData>(changePassword, {});
  return (
    <form action={action} className="card mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-bold">Parolni o&apos;zgartirish</h1>
      <div>
        <label className="label">Joriy parol</label>
        <input name="current" type="password" autoComplete="current-password" className="input" required />
      </div>
      <div>
        <label className="label">Yangi parol</label>
        <input name="next" type="password" autoComplete="new-password" className="input" minLength={6} placeholder="Kamida 6 ta belgi" required />
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Parol o&apos;zgartirildi</p>}
      <SubmitButton className="btn-primary w-full">Saqlash</SubmitButton>
    </form>
  );
}
