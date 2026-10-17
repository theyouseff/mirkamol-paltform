import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canOpenCourseFile, verifyFileToken } from "@/lib/file-token";

export const dynamic = "force-dynamic";

const deny = (status: number, text: string) => new Response(text, { status, headers: { "Cache-Control": "no-store" } });

// Kursning qo'shimcha materiali (check-list PDF). Faqat kursga yozilgan o'quvchi, shu kursning kuratori va admin oladi.
// Brauzerda ochiladi (inline); ?download=1 bo'lsa yuklab olinadi. ?e=&t= — ilova uchun qisqa muddatli imzolangan havola (sessiyasiz).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const query = new URL(req.url).searchParams;
  const signed = verifyFileToken(id, query.get("e"), query.get("t"));
  const user = signed ? null : await getCurrentUser();
  if (!signed && !user) return deny(401, "Kirish kerak");

  const file = await prisma.courseFile.findUnique({ where: { id }, select: { courseId: true, title: true, mime: true, data: true } });
  if (!file) return deny(404, "Topilmadi");
  if (user && !(await canOpenCourseFile(user, file.courseId))) return deny(403, "Ruxsat yo'q");

  const name = `${file.title.replace(/[\\/:*?"<>|\r\n]+/g, " ").trim() || "fayl"}.pdf`;
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  const disposition = query.has("download") ? "attachment" : "inline";
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": signed ? "private, no-store" : "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
