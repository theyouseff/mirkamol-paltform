"use server";

import bcrypt from "bcryptjs";
import { hashPassword, passwordProblem } from "@/lib/password";
import { clearAttempts, isLimited, recordAttempt } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createSession, getCurrentDeviceId, requireUser } from "@/lib/auth";
import { getEnrollment, lessonState } from "@/lib/access";
import { markSeen, WATCHING_MS } from "@/lib/activity";

// Video oxirigacha ko'rilganda brauzer chaqiradi: darsni tugatilgan deb belgilaydi (takror chaqirilsa zarar yo'q).
export async function markLessonWatched(lessonId: string) {
  const user = await requireUser();
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson) return;
  const enrollment = await getEnrollment(user.id, lesson.module.courseId);
  if (lessonState(lesson, !!enrollment, user.role === "ADMIN") !== "open") return;
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: {},
    create: { userId: user.id, lessonId },
  });
  revalidatePath("/cabinet", "layout");
}

const clamp = (n: number, max: number) => (Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 0), max) : 0);

// Video ko'rilayotganda brauzer davriy chaqiradi: qaysi soniyada to'xtagani va qancha ko'rgani (admin "Analitika" uchun).
// Bir vaqtda faqat bitta qurilmada ko'rish: claim=true — shu qurilmada video endi boshlandi (ijroni o'ziga oladi).
// Boshqa qurilma ijroni olgan bo'lsa, eski qurilmaga { stop: true } qaytadi va u videoni to'xtatadi.
export async function saveWatchProgress(lessonId: string, position: number, duration: number, watched: number, playing = false, claim = false): Promise<{ stop?: boolean }> {
  const user = await requireUser();
  if (user.role === "ADMIN") return {}; // adminning ko'rishlari o'quvchi analitikasiga kirmasin
  await markSeen(user.id); // video ko'rilayotgan bo'lsa — online
  const device = (await getCurrentDeviceId()) ?? "";
  let stop = false;
  if (playing) {
    const busyElsewhere = !!user.watchingDevice && user.watchingDevice !== device && !!user.watchingAt && Date.now() - user.watchingAt.getTime() < WATCHING_MS;
    if (busyElsewhere && !claim) stop = true;
    // "Tomosha qilyapti": ijro etilayotganda vaqt va qurilma yoziladi
    else await prisma.user.update({ where: { id: user.id }, data: { watchingAt: new Date(), watchingDevice: device } });
  } else {
    // Pauza/tugash/chiqish: holat faqat shu qurilmaniki bo'lsa o'chadi (boshqa qurilmada ko'rilayotgani o'chib qolmasin)
    await prisma.user.updateMany({ where: { id: user.id, OR: [{ watchingDevice: device }, { watchingDevice: null }] }, data: { watchingAt: null } });
  }
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: true } });
  if (!lesson) return { stop };
  const enrollment = await getEnrollment(user.id, lesson.module.courseId);
  if (lessonState(lesson, !!enrollment, false) !== "open") return { stop };

  const dur = clamp(duration, 86_400);
  const pos = clamp(position, dur || 86_400);
  const w = clamp(watched, dur || 86_400);
  const key = { userId_lessonId: { userId: user.id, lessonId } };
  const existing = await prisma.lessonWatch.findUnique({ where: key });
  await prisma.lessonWatch.upsert({
    where: key,
    create: { userId: user.id, lessonId, position: pos, duration: dur, watched: w },
    // Boshqa qurilmada kamroq ko'rilgan bo'lsa ham, ilgari ko'rilgan miqdor kamaymaydi
    update: { position: pos, duration: dur || existing?.duration || 0, watched: Math.max(existing?.watched ?? 0, w) },
  });
  return { stop };
}

export type PasswordState = { error?: string; ok?: boolean };

export async function changePassword(_: PasswordState, formData: FormData): Promise<PasswordState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const problem = passwordProblem(next, user.email);
  if (problem) return { error: problem.replace("Parol", "Yangi parol") };
  // Joriy parolni terib topishga urinishlar cheklanadi (sessiyasi o'g'irlangan hujumchi parolni almashtirib oladigan bo'lmasin)
  const key = `pw:${user.id}`;
  if (await isLimited([{ key, max: 5 }], 15 * 60_000)) return { error: "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring." };
  if (!(await bcrypt.compare(current, user.passwordHash))) {
    await recordAttempt([key]);
    return { error: "Joriy parol noto'g'ri" };
  }
  await clearAttempts([key]);
  const updated = await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next), vaultPassword: null } });
  // Boshqa qurilmalardagi eski sessiyalar bekor bo'ladi; bu qurilma yangi sessiya bilan qoladi
  await createSession(updated, (await getCurrentDeviceId()) ?? undefined);
  return { ok: true };
}
