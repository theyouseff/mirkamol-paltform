import Link from "next/link";
import { preload } from "react-dom";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  preload("/auth-bg-wide.webp", { as: "image", media: "(min-aspect-ratio: 1/1)" });
  preload("/auth-bg-tall.webp", { as: "image", media: "(max-aspect-ratio: 1/1)" });
  return (
    <div className="auth-bg flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <Link href="/" className="text-xl font-bold text-gold-text">Akademiya</Link>
      {children}
    </div>
  );
}
