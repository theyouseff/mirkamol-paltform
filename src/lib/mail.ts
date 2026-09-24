import nodemailer from "nodemailer";

export const SITE_URL = process.env.SITE_URL ?? "https://teachumma.vercel.app";

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
      from: process.env.MAIL_FROM ?? `Ilmaviya <${process.env.SMTP_USER}>`,
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

// Yangi akkaunt: login va parol
export function sendCredentials(to: string, name: string, courseTitle: string, password: string) {
  const subject = `Kursingiz ochildi: ${courseTitle}`;
  const text = `Salom, ${name}!\n\n«${courseTitle}» kursiga kirish ochildi.\n\nKirish: ${SITE_URL}\nLogin: ${to}\nParol: ${password}\n\nKirgach, parolni "Parol" bo'limidan o'zgartirishingiz mumkin.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;line-height:1.6">
<p>Salom, <b>${esc(name)}</b>!</p>
<p>«<b>${esc(courseTitle)}</b>» kursiga kirish ochildi.</p>
<div style="background:#f4f4f8;border-radius:10px;padding:14px 16px">
<div>Login: <b>${esc(to)}</b></div>
<div>Parol: <b style="font-family:monospace;font-size:16px">${esc(password)}</b></div></div>
<p><a href="${SITE_URL}" style="background:#334155;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Kabinetga kirish</a></p>
<p style="color:#666;font-size:13px">Kirgach, parolni «Parol» bo'limidan o'zgartirishingiz mumkin.</p></div>`;
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
