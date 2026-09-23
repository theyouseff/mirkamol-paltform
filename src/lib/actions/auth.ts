"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { normalizePhone } from "@/lib/format";

export type AuthState = { error?: string };

// Faqat ichki yo'llarga qaytaramiz (open redirect'dan himoya).
function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Ismingizni kiriting"),
  phone: z.string(),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lsin"),
});

export async function register(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { error: "Telefon raqam noto'g'ri. Masalan: +998 90 123 45 67" };
  if (await prisma.user.findUnique({ where: { phone } })) {
    return { error: "Bu raqam allaqachon ro'yxatdan o'tgan. Kirish sahifasiga o'ting." };
  }

  const user = await prisma.user.create({
    data: { name: parsed.data.name, phone, passwordHash: await bcrypt.hash(parsed.data.password, 10) },
  });
  await createSession({ userId: user.id, role: user.role });
  redirect(safeNext(formData.get("next")) ?? "/cabinet");
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const user = phone ? await prisma.user.findUnique({ where: { phone } }) : null;
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Telefon yoki parol noto'g'ri" };
  }
  await createSession({ userId: user.id, role: user.role });
  redirect(safeNext(formData.get("next")) ?? (user.role === "ADMIN" ? "/admin" : "/cabinet"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
