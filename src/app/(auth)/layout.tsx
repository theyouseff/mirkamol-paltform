import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cover bg-center px-4"
      style={{ backgroundImage: "url(/welcome-bg.webp)" }}
    >
      <Link href="/" className="text-xl font-bold text-brand">Akademiya</Link>
      {children}
    </div>
  );
}
