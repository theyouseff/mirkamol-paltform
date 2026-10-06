import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

// Platforma yaratgan parollarni adminga ko'rsatish uchun shifrlab saqlaydi (AES-256-GCM). Bazaning o'zi o'g'irlansa ham parollar
// ochilmaydi: kalit bazada emas, serverning AUTH_SECRET qiymatidan olinadi. Qiymat buzilsa yoki kalit boshqa bo'lsa — null qaytadi.
function key() {
  const base = process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16 ? process.env.AUTH_SECRET : `vault:${process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || ""}`;
  return Buffer.from(hkdfSync("sha256", base, "ilmaviya", "password-vault-v1", 32));
}

export function sealPassword(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

export function openPassword(sealed: string | null | undefined): string | null {
  if (!sealed) return null;
  try {
    const [v, iv, tag, data] = sealed.split(".");
    if (v !== "v1") return null;
    const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
