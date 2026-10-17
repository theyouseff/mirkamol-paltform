"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canOpenCourseFile, fileLinkQuery } from "@/lib/file-token";
import { headers } from "next/headers";

// Ilova uchun: PDF'ning 5 daqiqalik imzolangan to'liq havolasi (tizim brauzerida ochiladi). Ruxsat bo'lmasa null.
export async function courseFileLink(id: string): Promise<string | null> {
  const user = await requireUser();
  const file = await prisma.courseFile.findUnique({ where: { id }, select: { courseId: true } });
  if (!file || !(await canOpenCourseFile(user, file.courseId))) return null;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}/api/file/${id}?${fileLinkQuery(id)}`;
}
