import { requireUser } from "@/lib/auth";

// Kabinet sahifasi hozircha bo'sh (kirish tekshiriladi, ichida hech narsa ko'rsatilmaydi).
export default async function CabinetPage() {
  await requireUser();
  return null;
}
