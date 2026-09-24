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
