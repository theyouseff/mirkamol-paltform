import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getEnrollment, lessonState } from "@/lib/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Yopiq video: fayl loyiha ichidagi /videos papkasida turadi (public emas, URL orqali to'g'ridan-to'g'ri ochilmaydi).
// Dars videoUrl'i "file:nom.mp4" ko'rinishida bo'lsa, shu yo'l orqali faqat kursga yozilgan (yoki admin) foydalanuvchiga
// va faqat dars ochiq bo'lsa beriladi. Range qo'llab-quvvatlanadi: brauzer bo'lak-bo'lak oladi, surib o'tkazish ishlaydi.
const VIDEOS_DIR = path.join(process.cwd(), "videos");
const TYPES: Record<string, string> = { ".mp4": "video/mp4", ".m4v": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm" };

const deny = (status: number, text: string) => new Response(text, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(req: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const user = await getCurrentUser();
  if (!user) return deny(401, "Kirish kerak");

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { videoUrl: true, openAt: true, module: { select: { courseId: true } } } });
  if (!lesson?.videoUrl.startsWith("file:")) return deny(404, "Topilmadi");
  const enrollment = await getEnrollment(user.id, lesson.module.courseId);
  if (lessonState(lesson, !!enrollment, user.role === "ADMIN") !== "open") return deny(403, "Ruxsat yo'q");

  // Faqat /videos ichidagi oddiy fayl nomi (papka yoki ".." bilan chiqib ketib bo'lmaydi)
  const name = lesson.videoUrl.slice(5).trim();
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!type || path.basename(name) !== name) return deny(404, "Topilmadi");
  const file = path.join(VIDEOS_DIR, name);
  const size = await stat(file).then((s) => (s.isFile() ? s.size : 0)).catch(() => 0);
  if (!size) return deny(404, "Fayl topilmadi");

  let start = 0;
  let end = size - 1;
  const range = req.headers.get("range");
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!m || (!m[1] && !m[2])) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    if (m[1]) {
      start = Number(m[1]);
      if (m[2]) end = Math.min(Number(m[2]), size - 1);
    } else {
      start = Math.max(size - Number(m[2]), 0); // "bytes=-500": oxirgi 500 bayt
    }
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }

  const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
  return new Response(stream, {
    status: range ? 206 : 200,
    headers: {
      "Content-Type": type,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
      "Cache-Control": "private, max-age=3600", // faqat shu foydalanuvchining brauzerida; surishda qayta yuklamaydi
      "X-Content-Type-Options": "nosniff",
    },
  });
}
