import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Adminning kompyuteridan yuklangan rasm (kurs/modul muqovasi). Ochiq: muqova mehmonlarga ham ko'rinadi.
// Rasm id'si har yuklashda yangi, shuning uchun brauzer va CDN uni bir yil keshda saqlashi mumkin.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const img = await prisma.uploadedImage.findUnique({ where: { id }, select: { mime: true, data: true } });
  if (!img) return new Response("Topilmadi", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      // Biror yo'l bilan HTML/SVG kirib qolsa ham, bu manzilda hech narsa bajarilmasin
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}
