// Videoni Cloudflare R2 ga yuklaydi (katta fayllar uchun bo'laklab, progress bilan).
// Ishlatish:  npx tsx --env-file=.env scripts/upload-video.ts videos/test_1.mp4 lor/1-2-dars.mp4
// Kalitlar .env dan olinadi (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET) va hech qayerga chiqarilmaydi.
import { createReadStream, statSync } from "node:fs";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const [file, key] = process.argv.slice(2);
const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
if (!file || !key) throw new Error("Ishlatish: upload-video.ts <fayl> <R2 dagi yo'l, masalan kurs/dars.mp4>");
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) throw new Error(".env da R2_* o'zgaruvchilari yo'q");
if (!/^[\w\-./]+$/.test(key) || key.includes("..")) throw new Error("Yo'lda faqat harf, raqam, - _ . / bo'lsin");

const total = statSync(file).size;
const upload = new Upload({
  client: new S3Client({ region: "auto", endpoint: R2_ENDPOINT, credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY } }),
  params: { Bucket: R2_BUCKET, Key: key, Body: createReadStream(file), ContentType: "video/mp4", CacheControl: "private, max-age=3600" },
  partSize: 16 * 1024 * 1024,
  queueSize: 4,
});
upload.on("httpUploadProgress", (p) => process.stdout.write(`\r${Math.round(((p.loaded ?? 0) / total) * 100)}%  `));
await upload.done();
console.log(`\nTayyor: r2:${key}  (darsning video maydoniga shuni yozing)`);
