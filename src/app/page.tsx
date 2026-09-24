import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Kirgan foydalanuvchi to'g'ridan-to'g'ri kabinetga o'tadi; mehmonga "Xush kelibsiz" oynasi chiqadi.
export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/cabinet");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-10">
        <h1 className="text-center text-3xl font-bold leading-tight text-slate-800">
          Akademiya
          <br />
          ilovasiga
          <br />
          xush kelibsiz
        </h1>
        <div className="space-y-3">
          <Link href="/login" className="btn w-full bg-slate-500 py-4 text-base text-white hover:bg-slate-600">Kirish</Link>
          <Link href="/register" className="btn w-full bg-slate-500 py-4 text-base text-white hover:bg-slate-600">Ro&apos;yxatdan o&apos;tish</Link>
          <p className="py-1 text-center text-sm text-zinc-500">yoki</p>
          <Link href="/courses" className="btn w-full bg-slate-500 py-4 text-base text-white hover:bg-slate-600">Kurslarni ko&apos;rish</Link>
        </div>
      </div>
    </div>
  );
}
