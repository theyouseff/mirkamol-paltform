import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const dynamic = "force-dynamic";

// Kirgan foydalanuvchi to'g'ridan-to'g'ri kabinetga o'tadi; mehmonga kirish formasi chiqadi.
export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/cabinet");

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center px-4 py-10"
      style={{ backgroundImage: "url(/welcome-bg.webp)" }}
    >
      <AuthForm />
    </div>
  );
}
