"use server";

import bcrypt from "bcryptjs";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { normalizeEmail } from "@/lib/format";
import { clearAttempts, clientIp, isLimited, recordAttempt } from "@/lib/rate-limit";
import { mailConfigured, sendDeviceCode, sendResetCode } from "@/lib/mail";
import { admitDevice, createDeviceCode, consumeDeviceCode } from "@/lib/devices";
import { hashPassword, passwordProblem, BCRYPT_COST } from "@/lib/password";
import { homeFor } from "@/lib/roles";
import { createResetCode, RESET_TTL_MS, verifyResetCode } from "@/lib/reset";

// needCode — o'quvchi limitdan ortiq (yangi) qurilmadan kirmoqda: emailiga kod ketdi, forma kod so'raydi
export type AuthState = { error?: string; needCode?: boolean; sentTo?: string };

const LOGIN_WINDOW = 15 * 60_000;
const RESET_WINDOW = 60 * 60_000;
const TOO_MANY = "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.";
const DEVICE_BLOCKED = "Bu akkauntda qurilmalar juda ko'p almashtirildi. Kirish uchun adminga yozing.";
const DEVICE_FULL = "Bu akkaunt allaqachon 2 ta qurilmada ochiq. Yangi qurilmadan kirish uchun adminga yozing.";

// "abdulla.karimov@gmail.com" -> "ab***@gmail.com" (kod qayerga ketganini ko'rsatish uchun)
const maskEmail = (email: string) => email.replace(/^(.{0,2})[^@]*/, "$1***");

// Foydalanuvchi topilmaganda ham bcrypt vaqti sarflansin (email bor-yo'qligini vaqtdan bilib bo'lmasin).
let dummyHash: string | undefined;

// Faqat ichki yo'llarga qaytaramiz (open redirect'dan himoya). Kurator faqat o'z panelidagi manzilga qaytadi.
// "/\\evil.com" va "/%5Cevil.com" brauzerda "//evil.com" bo'lib qoladi — shuning uchun manzilni haqiqatan ham ichki ekanini URL orqali tekshiramiz.
function safeNext(next: FormDataEntryValue | null, role: string) {
  const value = typeof next === "string" ? next : "";
  if (!value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return null;
  try {
    const u = new URL(value, "https://internal.invalid");
    if (u.origin !== "https://internal.invalid" || u.pathname.startsWith("//")) return null;
    if (role === "CURATOR" && !u.pathname.startsWith("/curator")) return null;
    return u.pathname + u.search;
  } catch {
    return null;
  }
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
  dummyHash ??= await bcrypt.hash("dummy-password", BCRYPT_COST);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);
  if (!user || !ok) {
    await recordAttempt(keys);
    return { error: "Email yoki parol noto'g'ri" };
  }

  await clearAttempts([keys[0]]);

  // O'quvchi: qurilmalar limiti (akkauntni boshqalarga berishni cheklash). Admin va kurator uchun limit yo'q.
  let deviceId: string | undefined;
  if (user.role === "STUDENT") {
    const code = String(formData.get("code") ?? "").trim();
    let admission = await admitDevice(user);
    if (!admission.ok && admission.reason === "code") {
      if (!code) {
        if (!mailConfigured()) return { error: DEVICE_FULL };
        // Kod yuborish: bitta email uchun soatiga 3 ta
        const sendKey = `devcode:email:${email}`;
        if (await isLimited([{ key: sendKey, max: 3 }], RESET_WINDOW)) return { error: TOO_MANY };
        await recordAttempt([sendKey]);
        const { code: fresh, label } = await createDeviceCode(user.id);
        const sent = await sendDeviceCode(user.email, user.name, fresh, label);
        if (!sent.sent) return { error: "Kod yuborib bo'lmadi. Birozdan keyin urinib ko'ring yoki adminga yozing." };
        return { needCode: true, sentTo: maskEmail(user.email) };
      }
      // Kodni terib topishga urinish cheklanadi
      const codeKey = `devcode:try:${email}`;
      if (await isLimited([{ key: codeKey, max: 5 }], LOGIN_WINDOW)) return { error: TOO_MANY, needCode: true, sentTo: maskEmail(user.email) };
      if (!(await consumeDeviceCode(user.id, code))) {
        await recordAttempt([codeKey]);
        return { error: "Kod noto'g'ri yoki eskirgan", needCode: true, sentTo: maskEmail(user.email) };
      }
      await clearAttempts([codeKey]);
      admission = await admitDevice(user, true);
    }
    if (!admission.ok) return { error: DEVICE_BLOCKED };
    deviceId = admission.deviceId;
  }

  await createSession(user, deviceId);
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
  const problem = passwordProblem(password, email);
  if (problem) return { error: problem };

  // Kodni terib topib bo'lmasligi uchun urinishlar cheklanadi
  const ip = await clientIp();
  const keys = [`code:${ip}:${email}`, `code:ip:${ip}`, `code:email:${email}`];
  if (await isLimited([{ key: keys[0], max: 5 }, { key: keys[1], max: 30 }, { key: keys[2], max: 15 }], LOGIN_WINDOW)) return { error: TOO_MANY };

  const user = await verifyResetCode(email, code);
  if (!user) {
    await recordAttempt(keys);
    return { error: "Email yoki kod noto'g'ri, yoki kod eskirgan" };
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password), vaultPassword: null } });
  await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
  await clearAttempts([...keys, `login:email:${email}`]);
  // Kod emailga kelgan — egasi ekani tasdiqlangan, shu zahoti kiritamiz (o'quvchi: bu qurilma tasdiqlangan hisoblanadi, limit to'lgan bo'lsa eng eskisi chiqadi)
  let deviceId: string | undefined;
  if (updated.role === "STUDENT") {
    const admission = await admitDevice(updated, true);
    if (!admission.ok) return { error: `Parol o'zgartirildi. ${DEVICE_BLOCKED}` };
    deviceId = admission.deviceId;
  }
  await createSession(updated, deviceId);
  redirect(homeFor(updated.role));
}
