export function formatPrice(amount: number) {
  return amount.toLocaleString("ru-RU").replace(/,/g, " ") + " so'm";
}

// Bitta narx yoki "min – max" oralig'i: "4 000 000 – 5 000 000 so'm"
export function formatPriceRange(prices: number[]) {
  if (!prices.length) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const spaced = (n: number) => n.toLocaleString("ru-RU").replace(/,/g, " ");
  return min === max ? formatPrice(min) : `${spaced(min)} – ${formatPrice(max)}`;
}

export function formatDate(date: Date) {
  return date.toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tashkent" });
}

// " Ali@Gmail.com " -> "ali@gmail.com". Noto'g'ri bo'lsa null.
export function normalizeEmail(input: string) {
  const email = input.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
}

// Kinescope havolasidan video id ("https://kinescope.io/embed/ID" yoki ".../ID"); boshqa havola bo'lsa null.
export function kinescopeId(url: string) {
  return url.match(/kinescope\.io\/(?:embed\/)?([\w-]+)/)?.[1] ?? null;
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

// 462 -> "7:42", 3725 -> "1:02:05"
export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

// "5 daqiqa oldin", "2 soat oldin", "3 kun oldin"; bir haftadan eski bo'lsa — sana
export function timeAgo(date: Date) {
  const min = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (min < 1) return "hozirgina";
  if (min < 60) return `${min} daqiqa oldin`;
  if (min < 24 * 60) return `${Math.floor(min / 60)} soat oldin`;
  if (min < 7 * 24 * 60) return `${Math.floor(min / (24 * 60))} kun oldin`;
  return formatDate(date);
}

// Toshkent vaqti bo'yicha kun: "2026-09-24"
export function tashkentDay(date: Date = new Date()) {
  return date.toLocaleDateString("sv-SE", { timeZone: "Asia/Tashkent" });
}

// "2026-09-24" + n kun (n manfiy bo'lishi mumkin)
export function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// from..to (ikkalasi ham kiradi) kunlar ro'yxati; to < from bo'lsa — bo'sh
export function dayRange(from: string, to: string) {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}
