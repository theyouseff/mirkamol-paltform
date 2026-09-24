"use client";

import { useActionState } from "react";
import type { CSSProperties } from "react";
import { login, type AuthState } from "@/lib/actions/auth";
import { ADMIN_TELEGRAM, adminContactUrl } from "@/lib/config";
import { SubmitButton } from "./SubmitButton";

// Ketma-ket paydo bo'lish: har bir blok o'z raqami (--i) bo'yicha biroz kechroq chiqadi
const step = (i: number) => ({ "--i": i }) as CSSProperties;

export function AuthForm() {
  const [state, action] = useActionState<AuthState, FormData>(login, {});

  // "next" ni statik sahifani buzmasdan, yuborish paytida manzildan olamiz
  const submit = (formData: FormData) => {
    formData.set("next", new URLSearchParams(window.location.search).get("next") ?? "");
    action(formData);
  };

  return (
    <form action={submit} className="enter w-full max-w-md space-y-5 rounded-2xl bg-white/40 p-7 text-center shadow-xl backdrop-blur-md">
      <div className="enter" style={step(1)}>
        <h1 className="text-2xl font-bold">Kirish</h1>
        <p className="mt-2 text-sm text-zinc-700">Kabinetingizga kirish uchun adminga yozing</p>
      </div>
      <div className="enter" style={step(2)}>
        <label className="label">Email (Gmail)</label>
        <input name="email" type="email" autoComplete="email" className="input bg-white/60! text-center" placeholder="ism@gmail.com" required />
      </div>
      <div className="enter" style={step(3)}>
        <label className="label">Parol</label>
        <input name="password" type="password" autoComplete="current-password" className="input bg-white/60! text-center" placeholder="Parolingiz" required />
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      <div className="enter" style={step(4)}>
        <SubmitButton className="btn w-full bg-slate-700 py-3.5 text-base text-white hover:bg-slate-800">Kirish</SubmitButton>
      </div>
      <p className="enter text-center text-sm text-zinc-700" style={step(5)}>
        Akkauntingiz yo&apos;qmi?{" "}
        {ADMIN_TELEGRAM ? (
          <a href={adminContactUrl} target="_blank" rel="noopener noreferrer" className="text-brand">Adminga yozish</a>
        ) : (
          "Adminga yozing"
        )}
      </p>
    </form>
  );
}
