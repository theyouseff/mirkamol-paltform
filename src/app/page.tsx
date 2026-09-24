import { preload } from "react-dom";
import { AuthBrand } from "@/components/AuthBrand";
import { AuthForm } from "@/components/AuthForm";

// Statik sahifa: serverda emas, tarmoq chetidan tayyor holda beriladi. Kirgan foydalanuvchini middleware yo'naltiradi.
export default function WelcomePage() {
  preload("/auth-bg-wide.webp", { as: "image", media: "(min-aspect-ratio: 1/1)" });
  preload("/auth-bg-tall.webp", { as: "image", media: "(max-aspect-ratio: 1/1)" });
  return (
    <div className="auth-bg relative flex min-h-screen items-center justify-center px-4 py-10">
      <AuthBrand />
      <AuthForm />
    </div>
  );
}
