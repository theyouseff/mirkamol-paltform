"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { normalizeEmail } from "@/lib/format";

export type AuthState = { error?: string };

// Faqat ichki yo'llarga qaytaramiz (open redirect'dan himoya).
function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email yoki parol noto'g'ri" };
  }
  await createSession({ userId: user.id, role: user.role });
  redirect(safeNext(formData.get("next")) ?? (user.role === "ADMIN" ? "/admin" : "/cabinet"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
