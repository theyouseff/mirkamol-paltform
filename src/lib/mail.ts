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

const codeBox = (code: string) =>
  `<div style="background:#f4f4f8;border-radius:10px;padding:16px;text-align:center;margin:16px 0"><span style="font-family:monospace;font-size:28px;letter-spacing:4px;font-weight:bold">${esc(code)}</span></div>`;

// Login va parol bilan quti (yangi o'quvchi / kurator xati)
const credBox = (email: string, password: string) =>
  `<div style="background:#f4f4f8;border-radius:10px;padding:14px 16px;margin:16px 0">
<div>Login: <b>${esc(email)}</b></div>
<div>Parol: <b style="font-family:monospace;font-size:18px;letter-spacing:1px">${esc(password)}</b></div></div>`;

// Yangi o'quvchi: login va tayyor parol — shu bilan to'g'ridan-to'g'ri kiradi. Parolni keyin kabinetdagi «Parol» bo'limida o'zgartirsa bo'ladi.
export function sendStudentAccess(to: string, name: string, courseTitle: string, password: string) {
  const subject = `Kursingiz ochildi: ${courseTitle}`;
  const text = `Salom, ${name}!\n\n«${courseTitle}» kursiga kirish ochildi.\n\nKirish: ${SITE_URL}\nLogin: ${to}\nParol: ${password}\n\nParolni kabinetdagi «Parol» bo'limida o'zgartirishingiz mumkin.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;line-height:1.6">
<p>Salom, <b>${esc(name)}</b>!</p>
<p>«<b>${esc(courseTitle)}</b>» kursiga kirish ochildi.</p>
${credBox(to, password)}
<p><a href="${SITE_URL}" style="background:#334155;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Kabinetga kirish</a></p>
<p style="color:#666;font-size:13px">Parolni kabinetdagi «Parol» bo'limida o'zgartirishingiz mumkin.</p></div>`;
  return sendMail(to, subject, text, html);
}

// Yangi kurator: login va tayyor parol; kirgach kurator paneli ochiladi.
export function sendCuratorAccess(to: string, name: string, password: string) {
  const subject = "Siz ilmaviya'ga kurator sifatida qo'shildingiz";
  const text = `Salom, ${name}!\n\nSiz ilmaviya platformasiga kurator sifatida qo'shildingiz.\n\nKirish: ${SITE_URL}\nLogin: ${to}\nParol: ${password}\n\nKirgach, kurator paneli ochiladi. Parolni «Parol» bo'limida o'zgartirishingiz mumkin.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;line-height:1.6">
<p>Salom, <b>${esc(name)}</b>!</p>
<p>Siz ilmaviya platformasiga <b>kurator</b> sifatida qo'shildingiz.</p>
${credBox(to, password)}
<p><a href="${SITE_URL}" style="background:#334155;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Kirish</a></p>
<p style="color:#666;font-size:13px">Kirgach, kurator paneli ochiladi. Parolni «Parol» bo'limida o'zgartirishingiz mumkin.</p></div>`;
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

// Parolni o'zi tiklash kodi (1 soat amal qiladi)
export function sendResetCode(to: string, name: string, code: string) {
  const site = SITE_URL.replace(/^https?:\/\//, "");
  const subject = "Parolni tiklash kodi";
  const text = `Salom, ${name}!\n\nParolni tiklash kodingiz: ${code}\n\n${site}/activate sahifasida emailingiz va shu kodni kiriting, keyin yangi parol o'ylab toping. Kod bir marta ishlaydi va 1 soat amal qiladi.\n\nAgar bu so'rovni siz yubormagan bo'lsangiz, xatni e'tiborsiz qoldiring.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;line-height:1.6">
<p>Salom, <b>${esc(name)}</b>!</p>
<p>Parolni tiklash kodingiz:</p>
${codeBox(code)}
<p><b>${esc(site)}/activate</b> sahifasida emailingiz va shu kodni kiriting, keyin yangi parol o'ylab toping.</p>
<p style="color:#666;font-size:13px">Kod bir marta ishlaydi va 1 soat amal qiladi. Agar bu so'rovni siz yubormagan bo'lsangiz, xatni e'tiborsiz qoldiring.</p></div>`;
  return sendMail(to, subject, text, html);
}
