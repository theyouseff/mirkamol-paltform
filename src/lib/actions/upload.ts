"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);
const MAX_BYTES = 2 * 1024 * 1024;

export type UploadResult = { url?: string; error?: string };

// Rasmni bazaga saqlaydi va uning manzilini qaytaradi (/api/img/<id>). Faqat admin; faqat webp/jpeg/png, 2 MB gacha.
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Fayl tanlanmadi" };
  if (!TYPES.has(file.type)) return { error: "Faqat JPG, PNG yoki WebP rasm yuklash mumkin" };
  if (file.size > MAX_BYTES) return { error: "Rasm juda katta (2 MB dan oshmasin)" };
  const img = await prisma.uploadedImage.create({ data: { mime: file.type, data: Buffer.from(await file.arrayBuffer()) }, select: { id: true } });
  return { url: `/api/img/${img.id}` };
}
