import { AwsClient } from "aws4fetch";

// Havola to'g'ridan-to'g'ri video faylga (.mp4 ...) olib boradimi (masalan R2 ning ochiq manzili)
const isDirectFile = (url: string) => /^https:\/\/[^\s]+\.(mp4|m4v|webm|mov)(\?[^\s]*)?$/i.test(url);

// Darsning o'z videosi (Kinescope/YouTube emas): "file:nom.mp4" — shu serverdagi /videos papka; "r2:kurs/nom.mp4" — R2 dagi yopiq fayl
// (imzolangan havola bilan); "https://.../nom.mp4" — to'g'ridan-to'g'ri fayl havolasi (masalan R2 ochiq manzili).
export const isOwnVideo = (url: string) => url.startsWith("file:") || url.startsWith("r2:") || isDirectFile(url);

const SIGNED_FOR = 6 * 3600; // yopiq havola 6 soat yaroqli: bitta dars uchun yetarli, keyin eskiradi

const r2Env = () => {
  const { R2_ENDPOINT: endpoint, R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey, R2_BUCKET: bucket } = process.env;
  return endpoint && accessKeyId && secretAccessKey && bucket ? { endpoint: endpoint.replace(/\/+$/, ""), accessKeyId, secretAccessKey, bucket } : null;
};

// Faqat oddiy fayl yo'li: harf, raqam, '-', '_', '.', '/' ("..", bo'sh joy va boshqa belgilar mumkin emas)
const validKey = (key: string) => /^[\w\-./]+$/.test(key) && !key.includes("..") && !key.startsWith("/");

// Video manzili <video src> uchun: file: — o'zimizning himoyalangan yo'l, r2: — vaqtinchalik imzolangan havola.
// Chaqirishdan oldin foydalanuvchining kursga kirishi allaqachon tekshirilgan bo'lishi kerak.
export async function ownVideoSrc(lesson: { id: string; videoUrl: string }): Promise<string | null> {
  if (lesson.videoUrl.startsWith("file:")) return `/api/video/${lesson.id}`;
  if (isDirectFile(lesson.videoUrl)) return lesson.videoUrl;
  if (!lesson.videoUrl.startsWith("r2:")) return null;
  const env = r2Env();
  const key = lesson.videoUrl.slice(3).trim();
  if (!env || !validKey(key)) return null;
  const aws = new AwsClient({ accessKeyId: env.accessKeyId, secretAccessKey: env.secretAccessKey, service: "s3", region: "auto" });
  const url = new URL(`${env.endpoint}/${env.bucket}/${key}`);
  url.searchParams.set("X-Amz-Expires", String(SIGNED_FOR));
  const signed = await aws.sign(url.toString(), { method: "GET", aws: { signQuery: true } });
  return signed.url;
}
