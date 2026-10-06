"use client";

import { useActionState, useState } from "react";
import { addCourseToStudent, type AddCourseState } from "@/lib/actions/admin";
import { SubmitButton } from "../SubmitButton";
import { MoneyInput } from "./MoneyInput";

type Option = { id: string; title: string; price: number };

// Kursi bor o'quvchiga qo'shimcha kurs ochish: eski kurslari qoladi (⇄ — almashtirish, bu esa qo'shish). Summa kurs narxi bilan to'ladi.
export function AddCourseInline({ userId, courses }: { userId: string; courses: Option[] }) {
  const [state, action] = useActionState<AddCourseState, FormData>(addCourseToStudent, {});
  const [courseId, setCourseId] = useState("");
  const [amount, setAmount] = useState(0);

  return (
    <details className="group">
      <summary className="badge cursor-pointer list-none bg-amber-100 text-amber-800 hover:bg-amber-200" title="Yana kurs qo'shish (eskilari qoladi)">+ kurs</summary>
      <form action={action} className="mt-1 w-64 space-y-1.5 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm">
        <input type="hidden" name="userId" value={userId} />
        <select
          name="courseId"
          required
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setAmount(courses.find((c) => c.id === e.target.value)?.price ?? 0);
          }}
          className="input py-1 text-xs"
        >
          <option value="" disabled>Qaysi kurs qo&apos;shilsin?</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-500">Summa</span>
          <MoneyInput name="amount" value={amount} onValueChange={setAmount} className="input py-1 text-xs" />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-zinc-600">
          <input type="checkbox" name="sendMail" defaultChecked /> Emailga xabar yuborilsin
        </label>
        <SubmitButton className="btn-outline w-full px-2 py-1 text-xs" disabled={!courseId}>Qo&apos;shish</SubmitButton>
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
        {state.ok && <p className="text-xs text-green-700">✓ {state.ok}</p>}
      </form>
    </details>
  );
}
