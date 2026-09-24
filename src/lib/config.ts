// Admin bilan aloqa: Telegram username (@ belgisisiz). Masalan: "mirkamol".
// Vercel'da NEXT_PUBLIC_ADMIN_TELEGRAM env orqali ham berish mumkin (kodni o'zgartirmasdan).
export const ADMIN_TELEGRAM = process.env.NEXT_PUBLIC_ADMIN_TELEGRAM ?? "";

export const adminContactUrl = ADMIN_TELEGRAM ? `https://t.me/${ADMIN_TELEGRAM}` : "";

// Call-markaz telefon raqami (xalqaro formatda, masalan "+998901234567"). Bo'sh bo'lsa, menyudagi "Call - Centre" tugmasi ko'rinmaydi.
// Vercel'da NEXT_PUBLIC_CALL_CENTER_PHONE env orqali ham berish mumkin.
export const CALL_CENTER_PHONE = process.env.NEXT_PUBLIC_CALL_CENTER_PHONE ?? "";

export const callCenterUrl = CALL_CENTER_PHONE ? `tel:${CALL_CENTER_PHONE.replace(/[^\d+]/g, "")}` : "";
