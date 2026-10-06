import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { MIN_PASSWORD } from "./constants";

// O'xshash belgilarsiz (0/O, 1/l/I) — o'quvchi telefondan ko'chirganda adashmasligi uchun.
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(length = 10) {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

// Parol xeshi: narx 12 (kompyuter parolni terib topishi ~4 marta qiyinlashadi). Eski (10) xeshlar ham tekshiriladi va ishlayveradi.
export const BCRYPT_COST = 12;
export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);

// bcrypt faqat birinchi 72 baytni oladi: undan uzun parol keraksiz yuk bo'ladi
export const MAX_PASSWORD = 72;

// Eng ko'p ishlatiladigan, tez topiladigan parollar
const COMMON = new Set([
  "12345678", "123456789", "1234567890", "11111111", "00000000", "87654321", "password", "password1", "password123", "qwertyui", "qwerty123",
  "qwertyuiop", "iloveyou", "admin123", "abcd1234", "abc12345", "12341234", "asdfghjk", "zxcvbnm1", "1q2w3e4r", "1qaz2wsx", "uzbekistan",
  "parol123", "parol1234", "salom123", "salom1234", "toshkent", "ilmaviya", "ilmaviya1", "ilmaviya123",
]);

// null — parol yaroqli; aks holda foydalanuvchiga ko'rsatiladigan xabar
export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < MIN_PASSWORD) return `Parol kamida ${MIN_PASSWORD} ta belgidan iborat bo'lsin`;
  if (password.length > MAX_PASSWORD) return `Parol ${MAX_PASSWORD} ta belgidan oshmasin`;
  const p = password.toLowerCase();
  if (COMMON.has(p) || /^(.)\1+$/.test(p)) return "Bu parol juda oddiy, boshqasini o'ylab toping";
  if (email && (p === email.toLowerCase() || p === email.split("@")[0].toLowerCase())) return "Parol emailingizga o'xshamasin";
  return null;
}
