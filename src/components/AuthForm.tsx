"use client";

import { useActionState } from "react";
import type { CSSProperties } from "react";
import { login, type AuthState } from "@/lib/actions/auth";
import { ADMIN_TELEGRAM, adminContactUrl } from "@/lib/config";
import { SubmitButton } from "./SubmitButton";
import { authCard, authError, authInput, authLink } from "./auth-ui";

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
    <form action={submit} className={authCard}>
      <div className="enter" style={step(1)}>
        <h1 className="text-2xl font-bold text-gold-text">Kirish</h1>
        <p className="mt-2 text-sm text-gold-text/80">Kabinetga kirish uchun ma&apos;lumotlaringizni kiriting</p>
      </div>
      <div className="enter" style={step(2)}>
        <label className="label text-gold-text">Email (Gmail)</label>
        <input name="email" type="email" autoComplete="email" className={authInput} placeholder="ism@gmail.com" required />
      </div>
      <div className="enter" style={step(3)}>
        <label className="label text-gold-text">Parol</label>
        <input name="password" type="password" autoComplete="current-password" className={authInput} placeholder="Parolingiz" required />
      </div>
      {state.error && <p className={authError}>{state.error}</p>}
      <div className="enter" style={step(4)}>
        <SubmitButton className="btn-primary w-full py-3.5 text-base">Kirish</SubmitButton>
      </div>
      <div className="enter space-y-2 text-center text-sm text-gold-text/80" style={step(5)}>
        <p>
          Akkauntingiz yo&apos;qmi?{" "}
          {ADMIN_TELEGRAM ? (
            <a href={adminContactUrl} target="_blank" rel="noopener noreferrer" className={`${authLink} underline decoration-gold-text/60 underline-offset-4 transition hover:decoration-gold-text`}>Adminga yozish</a>
          ) : (
            "Adminga yozing"
          )}
        </p>
      </div>
    </form>
  );
}
