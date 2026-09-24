import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Kirgan foydalanuvchi to'g'ridan-to'g'ri kabinetga o'tadi; mehmonga "Xush kelibsiz" oynasi chiqadi.
export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/cabinet");

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center px-4 py-10"
      style={{ backgroundImage: "url(/welcome-bg.webp)" }}
    >
      <div className="w-full max-w-md space-y-3">
        <Link href="/login" className="btn w-full bg-slate-500 py-4 text-base text-white hover:bg-slate-600">Kirish</Link>
        <Link href="/register" className="btn w-full bg-slate-500 py-4 text-base text-white hover:bg-slate-600">Ro&apos;yxatdan o&apos;tish</Link>
        <p className="py-1 text-center text-sm font-medium text-slate-700">yoki</p>
        <Link href="/courses" className="btn w-full bg-slate-500 py-4 text-base text-white hover:bg-slate-600">Kurslarni ko&apos;rish</Link>
      </div>
    </div>
  );
}
