import { AuthBrand } from "@/components/AuthBrand";
import { preload } from "react-dom";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  preload("/auth-bg-wide.webp", { as: "image", media: "(min-aspect-ratio: 1/1)" });
  preload("/auth-bg-tall.webp", { as: "image", media: "(max-aspect-ratio: 1/1)" });
  return (
    <div className="auth-bg relative flex min-h-screen items-center justify-center px-4">
      <AuthBrand />
      {children}
    </div>
  );
}
