export function formatPrice(amount: number) {
  return amount.toLocaleString("ru-RU").replace(/,/g, " ") + " so'm";
}

export function formatDate(date: Date) {
  return date.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tashkent" });
}

// "+998 90 123-45-67" -> "998901234567". Noto'g'ri bo'lsa null.
export function normalizePhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 9) digits = "998" + digits;
  return /^998\d{9}$/.test(digits) ? digits : null;
}

export function formatPhone(phone: string) {
  const m = phone.match(/^998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+998 ${m[1]} ${m[2]}-${m[3]}-${m[4]}` : phone;
}

// YouTube / Kinescope / Bunny havolasini iframe uchun embed ko'rinishiga keltiradi.
export function toEmbedUrl(url: string) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const kinescope = url.match(/kinescope\.io\/(?:embed\/)?([\w-]+)/);
  if (kinescope) return `https://kinescope.io/embed/${kinescope[1]}`;
  return url;
}
