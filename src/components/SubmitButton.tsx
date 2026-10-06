"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "btn-primary", pendingText, disabled = false }: { children: React.ReactNode; className?: string; pendingText?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} className={className}>
      {pending ? pendingText ?? "Kuting..." : children}
    </button>
  );
}
