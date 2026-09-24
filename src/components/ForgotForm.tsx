"use client";

import { useActionState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { requestPasswordReset, type ResetRequestState } from "@/lib/actions/auth";
import { ADMIN_TELEGRAM, adminContactUrl } from "@/lib/config";
import { SubmitButton } from "./SubmitButton";
import { authCard, authError, authInput, authLink } from "./auth-ui";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

export function ForgotForm() {
  const [state, action] = useActionState<ResetRequestState, FormData>(requestPasswordReset, {});

  if (state.done) {
    return (
      <div className={authCard}>
        <h1 className="text-2xl font-bold">Xat yuborildi</h1>
        <p className="text-sm text-gold-text/80">Agar bu email ro&apos;yxatdan o&apos;tgan bo&apos;lsa, parolni tiklash havolasi yuborildi. Havola 1 soat amal qiladi. «Spam» papkasini ham tekshiring.</p>
        <Link href="/login" className={`${authLink} block text-sm`}>← Kirish sahifasiga</Link>
      </div>
    );
  }

  if (state.noMail) {
    return (
      <div className={authCard}>
        <h1 className="text-2xl font-bold">Parolni tiklash</h1>
        <p className="text-sm text-gold-text/80">
          Parolni tiklash uchun adminga yozing — yangi parol beriladi.{" "}
          {ADMIN_TELEGRAM && <a href={adminContactUrl} target="_blank" rel="noopener noreferrer" className={authLink}>Telegram</a>}
        </p>
        <Link href="/login" className={`${authLink} block text-sm`}>← Kirish sahifasiga</Link>
      </div>
    );
  }

  return (
    <form action={action} className={authCard}>
      <div className="enter" style={step(1)}>
        <h1 className="text-2xl font-bold">Parolni tiklash</h1>
        <p className="mt-2 text-sm text-gold-text/80">Emailingizni yozing — parolni tiklash havolasini yuboramiz</p>
      </div>
      <div className="enter" style={step(2)}>
        <label className="label text-gold-text">Email</label>
        <input name="email" type="email" autoComplete="email" className={authInput} placeholder="ism@gmail.com" required />
      </div>
      {state.error && <p className={authError}>{state.error}</p>}
      <div className="enter" style={step(3)}>
        <SubmitButton className="btn-primary w-full py-3.5 text-base">Havola yuborish</SubmitButton>
      </div>
      <Link href="/login" className={`${authLink} enter block text-sm`} style={step(4)}>← Kirish sahifasiga</Link>
    </form>
  );
}
