import { preload } from "react-dom";
import { AuthForm } from "@/components/AuthForm";

// Statik sahifa: serverda emas, tarmoq chetidan tayyor holda beriladi. Kirgan foydalanuvchini middleware yo'naltiradi.
export default function WelcomePage() {
  preload("/welcome-bg.webp", { as: "image" });
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center px-4 py-10"
      style={{ backgroundImage: "url(/welcome-bg.webp)" }}
    >
      <AuthForm />
    </div>
  );
}
