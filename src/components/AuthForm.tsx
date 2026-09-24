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
    <form action={submit} className="enter w-full max-w-md space-y-5 rounded-2xl bg-emerald-950/45 p-7 text-center text-white shadow-2xl backdrop-blur-md">
      <div className="enter" style={step(1)}>
        <h1 className="text-2xl font-bold text-white">Kirish</h1>
        <p className="mt-2 text-sm text-emerald-100/80">Kabinetingizga kirish uchun adminga yozing</p>
      </div>
      <div className="enter" style={step(2)}>
        <label className="label text-emerald-50">Email (Gmail)</label>
        <input name="email" type="email" autoComplete="email" className="input border-white/20! bg-white/10! text-center text-white! placeholder:text-white/45 focus:border-amber-300! focus:ring-amber-300/30!" placeholder="ism@gmail.com" required />
      </div>
      <div className="enter" style={step(3)}>
        <label className="label text-emerald-50">Parol</label>
        <input name="password" type="password" autoComplete="current-password" className="input border-white/20! bg-white/10! text-center text-white! placeholder:text-white/45 focus:border-amber-300! focus:ring-amber-300/30!" placeholder="Parolingiz" required />
      </div>
      {state.error && <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100">{state.error}</p>}
      <div className="enter" style={step(4)}>
        <SubmitButton className="btn w-full bg-amber-400 py-3.5 text-base font-semibold text-emerald-950 hover:bg-amber-300">Kirish</SubmitButton>
      </div>
      <p className="enter text-center text-sm text-emerald-100/80" style={step(5)}>
        Akkauntingiz yo&apos;qmi?{" "}
        {ADMIN_TELEGRAM ? (
          <a href={adminContactUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-amber-300 underline-offset-2 hover:underline">Adminga yozish</a>
        ) : (
          "Adminga yozing"
        )}
      </p>
    </form>
  );
}
