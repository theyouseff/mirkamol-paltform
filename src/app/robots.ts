import type { MetadataRoute } from "next";

// Qidiruv robotlari faqat ochiq kurslar katalogini ko'radi; kabinet, admin, kurator va API yopiq.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/courses"], disallow: ["/admin", "/cabinet", "/curator", "/api/", "/activate", "/forgot"] }],
  };
}
