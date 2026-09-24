"use client";

import { useActionState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { activateWithCode, type AuthState } from "@/lib/actions/auth";
import { MIN_PASSWORD } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";
import { authCard, authError, authInput, authLink } from "./auth-ui";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

export function ActivateForm() {
  const [state, action] = useActionState<AuthState, FormData>(activateWithCode, {});
  return (
    <form action={action} className={authCard}>
      <div className="enter" style={step(1)}>
        <h1 className="text-2xl font-bold">Kod bilan kirish</h1>
        <p className="mt-2 text-sm text-gold-text/80">Emailingizga kelgan bir martalik kodni kiriting va o&apos;zingiz uchun parol o&apos;ylab toping</p>
      </div>
      <div className="enter" style={step(2)}>
        <label className="label text-gold-text">Email</label>
        <input name="email" type="email" autoComplete="email" className={authInput} placeholder="ism@gmail.com" required />
      </div>
      <div className="enter" style={step(3)}>
        <label className="label text-gold-text">Bir martalik kod</label>
        <input name="code" autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false} maxLength={12} className={`${authInput} font-mono text-lg uppercase tracking-widest`} placeholder="K7QM-4XPD" required />
      </div>
      <div className="enter" style={step(4)}>
        <label className="label text-gold-text">Yangi parol</label>
        <input name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} className={authInput} placeholder={`Kamida ${MIN_PASSWORD} ta belgi`} required />
      </div>
      {state.error && <p className={authError}>{state.error}</p>}
      <div className="enter" style={step(5)}>
        <SubmitButton className="btn-primary w-full py-3.5 text-base">Parol qo&apos;yish va kirish</SubmitButton>
      </div>
      <Link href="/login" className={`${authLink} enter block text-sm`} style={step(6)}>← Kirish sahifasiga</Link>
    </form>
  );
}
