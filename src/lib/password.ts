import { randomInt } from "node:crypto";

export const MIN_PASSWORD = 8;

// O'xshash belgilarsiz (0/O, 1/l/I) — o'quvchi telefondan ko'chirganda adashmasligi uchun.
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(length = 10) {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}
