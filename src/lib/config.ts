// Admin bilan aloqa: Telegram username (@ belgisisiz). Masalan: "mirkamol".
// Vercel'da NEXT_PUBLIC_ADMIN_TELEGRAM env orqali ham berish mumkin (kodni o'zgartirmasdan).
export const ADMIN_TELEGRAM = process.env.NEXT_PUBLIC_ADMIN_TELEGRAM ?? "Prodyc3r";

export const adminContactUrl = ADMIN_TELEGRAM ? `https://t.me/${ADMIN_TELEGRAM}` : "";

// Admin telefon raqami (xalqaro formatda, masalan "+998901234567"). Saytda telefon tugmasi yo'q; faqat Telegram username bo'sh bo'lganda
// Telegram belgisi shu raqam bo'yicha ochiladi. Vercel'da NEXT_PUBLIC_CALL_CENTER_PHONE env orqali ham berish mumkin.
export const CALL_CENTER_PHONE = process.env.NEXT_PUBLIC_CALL_CENTER_PHONE ?? "+998 77 119 9229";

// Menyudagi Telegram belgisi: username bo'lsa — unga, bo'lmasa call-markaz raqamiga (Telegram raqam bo'yicha ham ochadi).
export const telegramUrl = ADMIN_TELEGRAM ? `https://t.me/${ADMIN_TELEGRAM}` : CALL_CENTER_PHONE ? `https://t.me/${CALL_CENTER_PHONE.replace(/[^\d+]/g, "")}` : "";
