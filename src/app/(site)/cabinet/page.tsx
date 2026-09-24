import Link from "next/link";
import { requireUser } from "@/lib/auth";

// Shaxsiy sahifa. Kurslar bu yerda chiqmaydi — ular "Kurslar" sahifasidan ochiladi.
export default async function CabinetPage() {
  const user = await requireUser();
  return (
    <div className="glass mx-auto max-w-md space-y-5 p-7">
      <div>
        <h1 className="text-2xl font-bold">Salom, {user.name}!</h1>
        <p className="mt-1 text-sm text-gold-text/70">{user.email}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/courses" className="btn-primary">Kurslarga o&apos;tish</Link>
        <Link href="/cabinet/settings" className="btn-outline">Parolni o&apos;zgartirish</Link>
      </div>
    </div>
  );
}
