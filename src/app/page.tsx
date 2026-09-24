import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Kirgan foydalanuvchi to'g'ridan-to'g'ri kabinetga o'tadi; mehmonga "Xush kelibsiz" oynasi chiqadi.
export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/cabinet");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-sm sm:my-0">
      <div className="flex flex-1 items-center justify-center bg-slate-700 px-8 py-16 text-center" style={{ background: "#2f3e52" }}>
        <h1 className="text-3xl font-bold leading-tight text-white">
          Akademiya
          <br />
          ilovasiga
          <br />
          xush kelibsiz
        </h1>
      </div>
      <div className="flex-[1.4] space-y-3 px-4 pt-10">
        <Link href="/login" className="btn w-full bg-slate-500 py-4 text-base text-white hover:bg-slate-600">Kirish</Link>
        <Link href="/register" className="btn w-full bg-slate-500 py-4 text-base text-white hover:bg-slate-600">Ro&apos;yxatdan o&apos;tish</Link>
        <p className="py-1 text-center text-sm text-zinc-500">yoki</p>
        <Link href="/courses" className="btn w-full bg-slate-500 py-4 text-base text-white hover:bg-slate-600">Kurslarni ko&apos;rish</Link>
      </div>
    </div>
  );
}
