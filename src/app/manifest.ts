import type { MetadataRoute } from "next";

// Telefonda "Ilova sifatida o'rnatish" uchun.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ilmaviya",
    short_name: "ilmaviya",
    description: "Onlayn kurslar platformasi",
    start_url: "/",
    display: "standalone",
    background_color: "#151922",
    theme_color: "#151922",
    icons: [
      { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
