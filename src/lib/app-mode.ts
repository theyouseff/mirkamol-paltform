// Mobil ilova (mobile/ — Capacitor) saytni shu belgi qo'shilgan User-Agent bilan ochadi (capacitor.config.json → appendUserAgent).
// Ilovada sotuv tugmalari ko'rsatilmaydi (App Store qoidasi: ilova ichida tashqi to'lovga yo'naltirish taqiqlangan).
export const APP_UA_MARK = "IlmaviyaApp";
export const isAppUserAgent = (ua: string | null | undefined) => !!ua && ua.includes(APP_UA_MARK);
