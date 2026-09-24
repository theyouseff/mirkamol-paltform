"use client";

import { useActionState } from "react";
import { MotionConfig, motion, type Variants } from "framer-motion";
import { login, type AuthState } from "@/lib/actions/auth";
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

export function AuthForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(login, {});

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
          <h1 className="text-2xl font-bold">Kirish</h1>
          <p className="mt-2 text-sm text-zinc-700">Kabinetingizga kirish uchun adminga yozing</p>
        </motion.div>
        <input type="hidden" name="next" value={next ?? ""} />
        <motion.div variants={item}>
          <label className="label">Email (Gmail)</label>
          <input name="email" type="email" autoComplete="email" className="input bg-white/60! text-center" placeholder="ism@gmail.com" required />
        </motion.div>
        <motion.div variants={item}>
          <label className="label">Parol</label>
          <input name="password" type="password" autoComplete="current-password" className="input bg-white/60! text-center" placeholder="Parolingiz" required />
        </motion.div>
        {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        <motion.div variants={item}>
          <SubmitButton className="btn w-full bg-slate-700 py-3.5 text-base text-white hover:bg-slate-800">Kirish</SubmitButton>
        </motion.div>
        <motion.p variants={item} className="text-center text-sm text-zinc-700">
          Akkauntingiz yo&apos;qmi?{" "}
          {ADMIN_TELEGRAM ? (
            <a href={adminContactUrl} target="_blank" rel="noopener noreferrer" className="text-brand">Adminga yozish</a>
          ) : (
            "Adminga yozing"
          )}
        </motion.p>
      </motion.form>
    </MotionConfig>
  );
}
