"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);

// Faylning haqiqiy turi birinchi baytlaridan aniqlanadi (nomi/"Content-Type" ga ishonilmaydi): rasm niqobidagi boshqa fayl o'tmasin
function sniff(b: Buffer): string | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 12 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length > 12 && b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  return null;
}
const MAX_BYTES = 2 * 1024 * 1024;

export type UploadResult = { url?: string; error?: string };

// Rasmni bazaga saqlaydi va uning manzilini qaytaradi (/api/img/<id>). Faqat admin; faqat webp/jpeg/png, 2 MB gacha.
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Fayl tanlanmadi" };
  if (!TYPES.has(file.type)) return { error: "Faqat JPG, PNG yoki WebP rasm yuklash mumkin" };
  if (file.size > MAX_BYTES) return { error: "Rasm juda katta (2 MB dan oshmasin)" };
  const data = Buffer.from(await file.arrayBuffer());
  const real = sniff(data);
  if (!real || !TYPES.has(real)) return { error: "Fayl rasm emas yoki buzilgan" };
  const img = await prisma.uploadedImage.create({ data: { mime: real, data }, select: { id: true } });
  return { url: `/api/img/${img.id}` };
}
