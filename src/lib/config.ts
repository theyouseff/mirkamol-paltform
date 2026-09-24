// Admin bilan aloqa: Telegram username (@ belgisisiz). Masalan: "mirkamol".
// Vercel'da NEXT_PUBLIC_ADMIN_TELEGRAM env orqali ham berish mumkin (kodni o'zgartirmasdan).
export const ADMIN_TELEGRAM = process.env.NEXT_PUBLIC_ADMIN_TELEGRAM ?? "";

export const adminContactUrl = ADMIN_TELEGRAM ? `https://t.me/${ADMIN_TELEGRAM}` : "";
