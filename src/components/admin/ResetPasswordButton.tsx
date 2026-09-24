"use client";

import { useActionState } from "react";
import { resetStudentPassword, type ResetPasswordState } from "@/lib/actions/admin";

// Yangi parol yaratadi va emailga yuboradi; parolni admin ham shu yerda ko'radi.
export function ResetPasswordButton({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(resetStudentPassword, {});
  return (
    <form
      action={action}
      onSubmit={(e) => { if (!confirm("Yangi parol yaratilib, o'quvchining emailiga yuboriladi. Davom etasizmi?")) e.preventDefault(); }}
    >
      <input type="hidden" name="id" value={userId} />
      <button className="btn-outline px-2 py-1 text-xs" disabled={pending}>{pending ? "..." : "Yangi parol"}</button>
      {state.password && (
        <div className="mt-1 rounded-lg bg-green-50 p-2 text-xs">
          <div>Parol: <b className="font-mono">{state.password}</b></div>
          <div className="text-zinc-500">{state.mail === "sent" ? "Emailga yuborildi" : `Email yuborilmadi${state.mailReason ? `: ${state.mailReason}` : ""}`}</div>
        </div>
      )}
      {state.error && <div className="mt-1 text-xs text-red-600">{state.error}</div>}
    </form>
  );
}
