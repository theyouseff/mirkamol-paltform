"use client";

import { useActionState, useEffect, useRef } from "react";
import { uploadCourseFile, type CourseFileState } from "@/lib/actions/admin";
import { SubmitButton } from "@/components/SubmitButton";

// Check-list PDF yuklash: fayl + ixtiyoriy nom (yozilmasa fayl nomi olinadi). Muvaffaqiyatli bo'lsa forma tozalanadi.
export function CourseFileUpload({ courseId }: { courseId: string }) {
  const [state, action] = useActionState<CourseFileState, FormData>(uploadCourseFile, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state.ok]);
  return (
    <form ref={form} action={action} className="space-y-2">
      <input type="hidden" name="courseId" value={courseId} />
      <div className="flex flex-wrap gap-2">
        <input name="file" type="file" accept="application/pdf,.pdf" required className="input min-w-0 flex-1 max-sm:basis-full" />
        <input name="title" className="input min-w-0 flex-1 max-sm:basis-full" placeholder="Nomi (ixtiyoriy — bo'sh bo'lsa fayl nomi)" />
        <SubmitButton pendingText="Yuklanmoqda...">+ PDF yuklash</SubmitButton>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
    </form>
  );
}
