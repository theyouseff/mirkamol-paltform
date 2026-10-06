// Telefon raqam: foydalanuvchi "90 123 45 67", "+998 (90) 123-45-67", "998901234567" kabi yozishi mumkin — bazaga "+998901234567" bo'lib tushadi.
// Bo'sh qiymat — null (raqam ixtiyoriy). Noto'g'ri bo'lsa — undefined.
export function normalizePhone(input: string): string | null | undefined {
  const raw = input.trim();
  if (!raw) return null;
  if (!/^[+\d\s().-]+$/.test(raw)) return undefined; // harf va boshqa belgilar mumkin emas
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return `+998${digits}`; // milliy raqam: 90 123 45 67
  if (digits.startsWith("998")) return digits.length === 12 ? `+${digits}` : undefined; // o'zbek raqami to'liq (12 raqam) bo'lishi shart
  if (digits.length >= 10 && digits.length <= 15 && raw.startsWith("+")) return `+${digits}`; // boshqa davlat raqami
  return undefined;
}

// "+998901234567" -> "+998 90 123 45 67" (o'zbek raqami); boshqasi o'z holicha
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const m = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}
