import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Muqova rasmi yuklash (brauzer uni oldindan kichraytiradi, odatda 1 MB dan kam)
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Saytni boshqa sayt ichiga (iframe) joylab bo'lmaydi
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
