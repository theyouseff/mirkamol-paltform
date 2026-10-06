import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Content-Security-Policy: sahifaga begona skript/ramka/shakl qo'shib bo'lmasin (XSS, clickjacking, ma'lumot o'g'irlash).
// Faqat o'zimizning manzil va ishlatadigan xizmatlarimizga (Kinescope pleyeri, R2 video, YouTube) ruxsat beriladi.
// 'unsafe-inline' (skript) Next.js'ning o'z ichki skriptlari uchun kerak; 'unsafe-eval' faqat ishlab chiqish rejimida.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://player.kinescope.io https://*.kinescope.io`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: https:", // video/audio skript bajara olmaydi; R2 (ochiq va imzolangan), Kinescope manzillari o'zgarsa ham video to'xtab qolmasin
  `connect-src 'self' https://*.kinescope.io https://player.kinescope.io${isProd ? "" : " ws: wss:"}`,
  "frame-src https://kinescope.io https://*.kinescope.io https://www.youtube.com https://www.youtube-nocookie.com",
  "frame-ancestors 'none'", // saytni boshqa sayt ichiga joylab bo'lmaydi
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const security = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), interest-cohort=()" },
];

// Shaxsiy ma'lumot (ism, email, to'lov) bor bo'limlar: hech qayerda (brauzer, CDN, umumiy kompyuter) saqlanmasin va qidiruvda chiqmasin
const privateArea = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  // Muqova rasmi yuklash (brauzer uni oldindan kichraytiradi, odatda 1 MB dan kam)
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  poweredByHeader: false, // "X-Powered-By: Next.js" — hujumchiga keraksiz ma'lumot
  async headers() {
    return [
      { source: "/:path*", headers: security },
      { source: "/admin/:path*", headers: privateArea },
      { source: "/cabinet/:path*", headers: privateArea },
      { source: "/curator/:path*", headers: privateArea },
    ];
  },
};

export default nextConfig;
