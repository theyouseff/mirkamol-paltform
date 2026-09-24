import type { MetadataRoute } from "next";

// Telefonda "Ilova sifatida o'rnatish" uchun.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TeachUmma",
    short_name: "TeachUmma",
    description: "Onlayn kurslar platformasi",
    start_url: "/",
    display: "standalone",
    background_color: "#0f3d2e",
    theme_color: "#0f3d2e",
    icons: [
      { src: "/pwa/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
