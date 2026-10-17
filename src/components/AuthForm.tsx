"use client";

import { useActionState, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { login, type AuthState } from "@/lib/actions/auth";
import { adminContactUrl } from "@/lib/config";
import { isAppUserAgent } from "@/lib/app-mode";
import { SubmitButton } from "./SubmitButton";
import { authCard, authError, authInput, authLink } from "./auth-ui";

// Ketma-ket paydo bo'lish: har bir blok o'z raqami (--i) bo'yicha biroz kechroq chiqadi
const step = (i: number) => ({ "--i": i }) as CSSProperties;

export function AuthForm() {
  const [state, action] = useActionState<AuthState, FormData>(login, {});
  // Email va parol saqlanib turadi: yangi qurilma kodi so'ralganda (yoki xatoda) qayta terish shart emas
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  // Boshqa qurilma kirgani uchun shu qurilmadan chiqarilgan bo'lsa (/login?r=device)
  const [kicked, setKicked] = useState(false);
  // Mobil ilovada "Akkauntingiz yo'qmi? Adminga yozish" (sotuvga yo'naltirish) ko'rsatilmaydi — App Store qoidasi
  const [inApp, setInApp] = useState(false);
  useEffect(() => {
    setKicked(new URLSearchParams(window.location.search).get("r") === "device");
    setInApp(isAppUserAgent(navigator.userAgent));
  }, []);

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
      {kicked && !state.needCode && (
        <p className="rounded-lg bg-amber-400/15 px-3 py-2 text-sm text-gold-text">
          Akkauntingizga boshqa qurilmadan kirildi, shu qurilmadan chiqarildingiz. Agar bu siz bo&apos;lmasangiz, kirgach parolingizni o&apos;zgartiring.
        </p>
      )}
      <div className="enter" style={step(2)}>
        <label className="label text-gold-text">Email (Gmail)</label>
        <input name="email" type="email" autoComplete="email" className={authInput} placeholder="ism@gmail.com" required value={email} onChange={(e) => setEmail(e.target.value)} readOnly={state.needCode} />
      </div>
      <div className="enter" style={step(3)}>
        <label className="label text-gold-text">Parol</label>
        <input name="password" type="password" autoComplete="current-password" className={authInput} placeholder="Parolingiz" required value={password} onChange={(e) => setPassword(e.target.value)} readOnly={state.needCode} />
      </div>
      {state.needCode && (
        <div className="space-y-2">
          <p className="rounded-lg bg-amber-400/15 px-3 py-2 text-sm text-gold-text">
            Bu yangi qurilma. Akkaunt bir vaqtda faqat 2 ta qurilmada ochiq bo&apos;ladi. <b>{state.sentTo}</b> emailiga kod yuborildi — kiritsangiz, eng uzoq ishlatilmagan qurilmangizdan chiqasiz.
          </p>
          <label className="label text-gold-text">Emaildagi kod</label>
          <input name="code" autoComplete="one-time-code" autoCapitalize="characters" className={`${authInput} tracking-[0.3em]`} placeholder="XXXX-XXXX" required value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
        </div>
      )}
      {state.error && <p className={authError}>{state.error}</p>}
      <div className="enter" style={step(4)}>
        <SubmitButton className="btn-primary w-full py-3.5 text-base">{state.needCode ? "Tasdiqlash" : "Kirish"}</SubmitButton>
      </div>
      <div className="enter space-y-2 text-center text-sm text-gold-text/80" style={step(5)}>
        {!inApp && (
          <p>
            Akkauntingiz yo&apos;qmi?{" "}
            <a href={adminContactUrl} target="_blank" rel="noopener noreferrer" className={`${authLink} underline decoration-gold-text/60 underline-offset-4 transition hover:decoration-gold-text`}>Adminga yozish</a>
          </p>
        )}
        <p>
          <a href="/privacy" className="text-xs text-gold-text/60 underline-offset-2 hover:underline">Maxfiylik siyosati</a>
        </p>
      </div>
    </form>
  );
}
