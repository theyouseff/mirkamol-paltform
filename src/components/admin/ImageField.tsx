"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/actions/upload";

const MAX_BYTES = 900 * 1024;

// Rasmni yuklashdan oldin kichraytiradi (WebP) — katta telefon/kamera rasmlari ham tez yuklansin.
// Muqova: eni 1600 px gacha; ikonka: uzun tomoni 256 px gacha. WebP shaffof fonni saqlaydi (PNG ikonka orqasi qora bo'lib qolmaydi).
async function shrink(file: File, icon: boolean): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = icon ? Math.min(1, 256 / Math.max(bitmap.width, bitmap.height)) : Math.min(1, 1600 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const type of ["image/webp", "image/jpeg"]) {
    for (const q of [0.88, 0.75, 0.6]) {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
      if (blob && blob.type === type && blob.size <= MAX_BYTES) return blob;
    }
  }
  throw new Error("Rasmni kichraytirib bo'lmadi");
}

// Rasm maydoni: havola yozish YOKI kompyuterdan yuklash. Yuklangach manzil maydonga yoziladi; formadagi «Saqlash» bosilgach saqlanadi.
// icon — kichik kvadrat ikonka (256 px gacha kichraytiriladi, oldindan ko'rinishi ham kvadrat).
export function ImageField({ name, defaultValue = "", placeholder, inputClassName = "input", icon = false }: { name: string; defaultValue?: string; placeholder?: string; inputClassName?: string; icon?: boolean }) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setMsg(null);
    try {
      const blob = await shrink(f, icon);
      const fd = new FormData();
      fd.append("file", new File([blob], icon ? "icon" : "cover", { type: blob.type }));
      const res = await uploadImage(fd);
      if (res.url) {
        setValue(res.url);
        setMsg({ ok: true, text: `${icon ? "Ikonka" : "Rasm"} yuklandi. Saqlash tugmasini bosing.` });
      } else setMsg({ ok: false, text: res.error ?? "Yuklab bo'lmadi" });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Yuklab bo'lmadi" });
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input name={name} value={value} onChange={(e) => setValue(e.target.value)} className={`${inputClassName} min-w-0 flex-1`} placeholder={placeholder} />
        <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <button type="button" className="btn-outline whitespace-nowrap" disabled={busy} onClick={() => file.current?.click()}>
          {busy ? "Yuklanmoqda..." : "Kompyuterdan yuklash"}
        </button>
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className={icon ? "h-14 w-14 rounded-xl border border-zinc-200 bg-ink-900 object-contain p-1.5" : "h-24 rounded-lg border border-zinc-200 object-cover"} />
      )}
      {msg && <p className={`text-xs ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}
