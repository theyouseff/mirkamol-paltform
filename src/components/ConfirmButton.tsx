"use client";

type Props = {
  children: React.ReactNode;
  message: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
};

// Server action formasi ichida — bosilganda tasdiq so'raydi.
export function ConfirmButton({ children, message, className = "btn-danger", formAction }: Props) {
  return (
    <button type="submit" formAction={formAction} className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
