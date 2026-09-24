"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MotionConfig, motion, type Variants } from "framer-motion";
import { login, register, type AuthState } from "@/lib/actions/auth";
import { ADMIN_TELEGRAM, adminContactUrl } from "@/lib/config";
import { SubmitButton } from "./SubmitButton";

const ease = [0.22, 1, 0.36, 1] as const;

// Blok pastdan surilib, tiniqlashib chiqadi; ichidagi elementlar birin-ketin paydo bo'ladi.
const container: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease, delay: 0.2, when: "beforeChildren", staggerChildren: 0.12 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(mode === "login" ? login : register, {});
  const isLogin = mode === "login";
  const q = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    // reducedMotion="user": "harakatni kamaytirish" yoqilgan qurilmalarda animatsiya o'chadi
    <MotionConfig reducedMotion="user">
      <motion.form
        action={action}
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-md space-y-5 rounded-2xl bg-white/40 p-7 text-center shadow-xl backdrop-blur-md"
      >
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold">{isLogin ? "Kirish" : "Ro'yxatdan o'tish"}</h1>
          <p className="mt-2 text-sm text-zinc-700">
            {isLogin ? "Kabinetingizga kirish uchun adminga yozing" : "Ma'lumotlaringizni kiriting, akkaunt shu zahoti ochiladi."}
          </p>
        </motion.div>
        <input type="hidden" name="next" value={next ?? ""} />
        {!isLogin && (
          <motion.div variants={item}>
            <label className="label">Ism va familiya</label>
            <input name="name" className="input bg-white/60! text-center" placeholder="Masalan, Aziz Karimov" required />
          </motion.div>
        )}
        <motion.div variants={item}>
          <label className="label">Email (Gmail)</label>
          <input name="email" type="email" autoComplete="email" className="input bg-white/60! text-center" placeholder="ism@gmail.com" required />
        </motion.div>
        <motion.div variants={item}>
          <label className="label">Parol</label>
          <input
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="input bg-white/60! text-center"
            placeholder={isLogin ? "Parolingiz" : "Kamida 6 ta belgi"}
            required
            minLength={isLogin ? 1 : 6}
          />
        </motion.div>
        {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        <motion.div variants={item}>
          <SubmitButton className="btn w-full bg-slate-700 py-3.5 text-base text-white hover:bg-slate-800">
            {isLogin ? "Kirish" : "Ro'yxatdan o'tish"}
          </SubmitButton>
        </motion.div>
        <motion.p variants={item} className="text-center text-sm text-zinc-700">
          {isLogin ? (
            ADMIN_TELEGRAM ? (
              <>Akkauntingiz yo&apos;qmi? <a href={adminContactUrl} target="_blank" rel="noopener noreferrer" className="text-brand">Adminga yozish</a></>
            ) : (
              <>Akkauntingiz yo&apos;qmi? <Link href={`/register${q}`} className="text-brand">Ro&apos;yxatdan o&apos;ting</Link></>
            )
          ) : (
            <>Akkauntingiz bormi? <Link href={`/login${q}`} className="text-brand">Kiring</Link></>
          )}
        </motion.p>
      </motion.form>
    </MotionConfig>
  );
}
