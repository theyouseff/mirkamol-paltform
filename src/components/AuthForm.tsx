"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type AuthState } from "@/lib/actions/auth";
import { SubmitButton } from "./SubmitButton";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(mode === "login" ? login : register, {});
  const isLogin = mode === "login";
  const q = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form action={action} className="card w-full max-w-md space-y-5 border-transparent p-7 shadow-xl">
      <div>
        <h1 className="text-2xl font-bold">{isLogin ? "Kirish" : "Ro'yxatdan o'tish"}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {isLogin ? "Kabinetingizga kiring" : "Ma'lumotlaringizni kiriting, akkaunt shu zahoti ochiladi."}
        </p>
      </div>
      <input type="hidden" name="next" value={next ?? ""} />
      {!isLogin && (
        <div>
          <label className="label">Ism va familiya</label>
          <input name="name" className="input" placeholder="Masalan, Aziz Karimov" required />
        </div>
      )}
      <div>
        <label className="label">Email (Gmail)</label>
        <input name="email" type="email" autoComplete="email" className="input" placeholder="ism@gmail.com" required />
      </div>
      <div>
        <label className="label">Parol</label>
        <input
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          className="input"
          placeholder={isLogin ? "Parolingiz" : "Kamida 6 ta belgi"}
          required
          minLength={isLogin ? 1 : 6}
        />
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
      <SubmitButton className="btn w-full bg-slate-700 py-3.5 text-base text-white hover:bg-slate-800">
        {isLogin ? "Kirish" : "Ro'yxatdan o'tish"}
      </SubmitButton>
      <p className="text-center text-sm text-zinc-500">
        {isLogin ? (
          <>Akkauntingiz yo&apos;qmi? <Link href={`/register${q}`} className="text-brand">Ro&apos;yxatdan o&apos;ting</Link></>
        ) : (
          <>Akkauntingiz bormi? <Link href={`/login${q}`} className="text-brand">Kiring</Link></>
        )}
      </p>
    </form>
  );
}
