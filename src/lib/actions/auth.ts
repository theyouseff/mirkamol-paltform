"use server";

import bcrypt from "bcryptjs";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { normalizeEmail } from "@/lib/format";
import { clearAttempts, clientIp, isLimited, recordAttempt } from "@/lib/rate-limit";
import { mailConfigured, sendResetCode } from "@/lib/mail";
import { MIN_PASSWORD } from "@/lib/constants";
import { homeFor } from "@/lib/roles";
import { createResetCode, RESET_TTL_MS, verifyResetCode } from "@/lib/reset";

export type AuthState = { error?: string };

const LOGIN_WINDOW = 15 * 60_000;
const RESET_WINDOW = 60 * 60_000;
const TOO_MANY = "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.";

// Foydalanuvchi topilmaganda ham bcrypt vaqti sarflansin (email bor-yo'qligini vaqtdan bilib bo'lmasin).
let dummyHash: string | undefined;

// Faqat ichki yo'llarga qaytaramiz (open redirect'dan himoya). Kurator faqat o'z panelidagi manzilga qaytadi.
function safeNext(next: FormDataEntryValue | null, role: string) {
  const value = typeof next === "string" ? next : "";
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (role === "CURATOR" && !value.startsWith("/curator")) return null;
  return value;
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const ip = await clientIp();

  // Bir IP+email 5 marta, bitta IP 30 marta, bitta email 30 marta xato qilsa — 15 daqiqa kutiladi.
  // (Faqat email bo'yicha past limit qo'yilmaydi: begona odam adminni bloklab qo'ymasligi uchun.)
  const keys = email ? [`login:${ip}:${email}`, `login:ip:${ip}`, `login:email:${email}`] : [`login:ip:${ip}`];
  const rules = email ? [{ key: keys[0], max: 5 }, { key: keys[1], max: 30 }, { key: keys[2], max: 30 }] : [{ key: keys[0], max: 30 }];
  if (await isLimited(rules, LOGIN_WINDOW)) return { error: TOO_MANY };

  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  dummyHash ??= await bcrypt.hash("dummy-password", 10);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);
  if (!user || !ok) {
    await recordAttempt(keys);
    return { error: "Email yoki parol noto'g'ri" };
  }

  await clearAttempts([keys[0]]);
  await createSession(user);
  redirect(safeNext(formData.get("next"), user.role) ?? homeFor(user.role));
}

// ---------- Parolni o'zi tiklash ----------

export type ResetRequestState = { error?: string; done?: boolean; noMail?: boolean };

export async function requestPasswordReset(_: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) return { error: "Email noto'g'ri" };
  // Xat yuborish sozlanmagan bo'lsa, foydalanuvchi adminga yozishi kerak
  if (!mailConfigured()) return { noMail: true };

  const ip = await clientIp();
  const keys = [`reset:email:${email}`, `reset:ip:${ip}`];
  if (await isLimited([{ key: keys[0], max: 3 }, { key: keys[1], max: 10 }], RESET_WINDOW)) return { error: TOO_MANY };
  await recordAttempt(keys);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const code = await createResetCode(user.id, RESET_TTL_MS);
    // Javobni kutdirmaymiz: xat tezligidan akkaunt bor-yo'qligi bilinib qolmasin
    after(() => sendResetCode(user.email, user.name, code));
  }
  // Akkaunt bor-yo'qligidan qat'i nazar bir xil javob
  return { done: true };
}

// Emailga kelgan bir martalik kod bilan parol o'rnatish (yangi o'quvchi ham, parolini unutgan ham shu yerga keladi).
export async function activateWithCode(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const code = String(formData.get("code") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email) return { error: "Email noto'g'ri" };
  if (password.length < MIN_PASSWORD) return { error: `Parol kamida ${MIN_PASSWORD} ta belgidan iborat bo'lsin` };

  // Kodni terib topib bo'lmasligi uchun urinishlar cheklanadi
  const ip = await clientIp();
  const keys = [`code:${ip}:${email}`, `code:ip:${ip}`, `code:email:${email}`];
  if (await isLimited([{ key: keys[0], max: 5 }, { key: keys[1], max: 30 }, { key: keys[2], max: 15 }], LOGIN_WINDOW)) return { error: TOO_MANY };

  const user = await verifyResetCode(email, code);
  if (!user) {
    await recordAttempt(keys);
    return { error: "Email yoki kod noto'g'ri, yoki kod eskirgan" };
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
  await clearAttempts([...keys, `login:email:${email}`]);
  // Kod emailga kelgan — egasi ekani tasdiqlangan, shu zahoti kiritamiz
  await createSession(updated);
  redirect(homeFor(updated.role));
}
