import nodemailer from "nodemailer";

export const SITE_URL = process.env.SITE_URL ?? "https://ilmaviya.vercel.app";

export type MailResult = { sent: boolean; reason?: string };

// SMTP orqali yuboradi (Gmail, Resend SMTP va h.k.). Sozlanmagan bo'lsa — yubormaydi, admin parolni panelda ko'radi.
export function mailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail(to: string, subject: string, text: string, html: string): Promise<MailResult> {
  if (!mailConfigured()) return { sent: false, reason: "Email yuborish sozlanmagan (SMTP)" };
  try {
    const port = Number(process.env.SMTP_PORT ?? 465);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.MAIL_FROM ?? `ilmaviya <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "Yuborib bo'lmadi" };
  }
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// Yangi o'quvchi: bir martalik havola. Parolni o'quvchining o'zi o'rnatadi — admin parol ko'rmaydi.
export function sendActivation(to: string, name: string, courseTitle: string, link: string) {
  const subject = `Kursingiz ochildi: ${courseTitle}`;
  const text = `Salom, ${name}!\n\n«${courseTitle}» kursiga kirish ochildi.\n\nKirish uchun o'z parolingizni o'rnating (havola bir marta ishlaydi va 7 kun amal qiladi):\n${link}\n\nKeyingi safar ${SITE_URL} da shu email (${to}) va o'zingiz qo'ygan parol bilan kirasiz.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;line-height:1.6">
<p>Salom, <b>${esc(name)}</b>!</p>
<p>«<b>${esc(courseTitle)}</b>» kursiga kirish ochildi.</p>
<p>Kirish uchun o'z parolingizni o'rnating:</p>
<p><a href="${esc(link)}" style="background:#334155;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Parol o'rnatish va kirish</a></p>
<p style="color:#666;font-size:13px">Havola bir marta ishlaydi va 7 kun amal qiladi. Keyingi safar ${esc(SITE_URL)} da shu email (<b>${esc(to)}</b>) va o'zingiz qo'ygan parol bilan kirasiz.</p></div>`;
  return sendMail(to, subject, text, html);
}

// Mavjud akkauntga yangi kurs qo'shilganda
export function sendCourseOpened(to: string, name: string, courseTitle: string) {
  const subject = `Yangi kurs ochildi: ${courseTitle}`;
  const text = `Salom, ${name}!\n\n«${courseTitle}» kursiga kirish ochildi. Kabinetingizga avvalgi login va parol bilan kiring: ${SITE_URL}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;line-height:1.6">
<p>Salom, <b>${esc(name)}</b>!</p>
<p>«<b>${esc(courseTitle)}</b>» kursiga kirish ochildi. Kabinetingizga avvalgi login va parolingiz bilan kiring.</p>
<p><a href="${SITE_URL}" style="background:#334155;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Kabinetga kirish</a></p></div>`;
  return sendMail(to, subject, text, html);
}

// Parol yangilanganda
export function sendNewPassword(to: string, name: string, password: string) {
  const subject = "Yangi parolingiz";
  const text = `Salom, ${name}!\n\nParolingiz yangilandi.\n\nKirish: ${SITE_URL}\nLogin: ${to}\nParol: ${password}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;line-height:1.6">
<p>Salom, <b>${esc(name)}</b>! Parolingiz yangilandi.</p>
<div style="background:#f4f4f8;border-radius:10px;padding:14px 16px">
<div>Login: <b>${esc(to)}</b></div>
<div>Parol: <b style="font-family:monospace;font-size:16px">${esc(password)}</b></div></div>
<p><a href="${SITE_URL}" style="background:#334155;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Kabinetga kirish</a></p></div>`;
  return sendMail(to, subject, text, html);
}

// Parolni o'zi tiklash havolasi (1 soat amal qiladi)
export function sendResetLink(to: string, name: string, link: string) {
  const subject = "Parolni tiklash";
  const text = `Salom, ${name}!\n\nParolni tiklash uchun havola (1 soat amal qiladi):\n${link}\n\nAgar bu so'rovni siz yubormagan bo'lsangiz, xatni e'tiborsiz qoldiring.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;line-height:1.6">
<p>Salom, <b>${esc(name)}</b>!</p>
<p>Parolni tiklash uchun tugmani bosing. Havola 1 soat amal qiladi.</p>
<p><a href="${esc(link)}" style="background:#334155;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Yangi parol o'rnatish</a></p>
<p style="color:#666;font-size:13px">Agar bu so'rovni siz yubormagan bo'lsangiz, xatni e'tiborsiz qoldiring.</p></div>`;
  return sendMail(to, subject, text, html);
}
