import { headers } from "next/headers";
import { prisma } from "./db";

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

export type Rule = { key: string; max: number };

// Oynada (windowMs) qoidalardan birortasi limitga yetgan bo'lsa — true.
export async function isLimited(rules: Rule[], windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  const counts = await Promise.all(rules.map((r) => prisma.loginAttempt.count({ where: { key: r.key, createdAt: { gte: since } } })));
  return rules.some((r, i) => counts[i] >= r.max);
}

export async function recordAttempt(keys: string[]) {
  await prisma.loginAttempt.createMany({ data: keys.map((key) => ({ key })) });
  // Ba'zan eski yozuvlarni tozalab turamiz
  if (Math.random() < 0.02) await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3600_000) } } });
}

export const clearAttempts = (keys: string[]) => prisma.loginAttempt.deleteMany({ where: { key: { in: keys } } });
