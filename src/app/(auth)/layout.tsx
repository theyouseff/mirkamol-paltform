import Link from "next/link";
import { preload } from "react-dom";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  preload("/welcome-bg.webp", { as: "image" });
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
