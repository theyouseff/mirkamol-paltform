"use client";

import { useActionState } from "react";
import type { CSSProperties } from "react";
import { resetPassword, type AuthState } from "@/lib/actions/auth";
import { MIN_PASSWORD } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";
import { authCard, authError, authInput } from "./auth-ui";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState<AuthState, FormData>(resetPassword, {});
  return (
    <form action={action} className={authCard}>
      <input type="hidden" name="token" value={token} />
      <div className="enter" style={step(1)}>
        <h1 className="text-2xl font-bold">Parol o&apos;rnating</h1>
        <p className="mt-2 text-sm text-gold-text/80">O&apos;zingiz eslab qoladigan parol yozing (kamida {MIN_PASSWORD} ta belgi). Shundan keyin shu parol bilan kirasiz.</p>
      </div>
      <div className="enter" style={step(2)}>
        <label className="label text-gold-text">Yangi parol</label>
        <input name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} className={authInput} required />
      </div>
      {state.error && <p className={authError}>{state.error}</p>}
      <div className="enter" style={step(3)}>
        <SubmitButton className="btn-primary w-full py-3.5 text-base">Saqlash va kirish</SubmitButton>
      </div>
    </form>
  );
}
