"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readFrame } from "@/lib/last-frame";

// Kabinetdagi "Oxirgi ko'rgan video": to'xtagan joydagi kadr darhol ko'rinadi. Dars sahifasida video to'xtatilganda saqlangan kadr bo'lsa —
// u zudlik bilan chiqadi (tarmoq kutilmaydi); yo'q bo'lsa video yuklanadi; u tayyor bo'lguncha shaffof, orqada esa tilla-kulrang fon turadi (qora ekran bo'lmaydi).
// Video ijro etilmaydi: bosilsa dars sahifasi (to'xtagan joydan) ochiladi.
export function LastVideoPreview({ lessonId, src, position, finished, href }: { lessonId: string; src: string | null; position: number; finished: boolean; href: string }) {
  const [frame, setFrame] = useState<string | null>(null);

  useEffect(() => {
    const f = readFrame();
    // Saqlangan kadr shu dars va serverdagi to'xtagan joyga yaqin (boshqa qurilmada ko'rilgan bo'lsa mos kelmaydi) bo'lsa ishlatiladi
    if (f && f.lessonId === lessonId && !finished && Math.abs(f.pos - position) <= 20) setFrame(f.img);
  }, [lessonId, position, finished]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-ink-800 via-ink-700 to-steel-600">
      {frame ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={frame} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        src && (
          <video
            src={`${src}#t=${finished ? 0.001 : Math.max(position, 0.001)}`}
            muted
            playsInline
            preload="auto"
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none h-full w-full object-cover"
          />
        )
      )}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25" aria-hidden>
        <span className="text-6xl text-gold-text/90 drop-shadow-lg">▶</span>
      </span>
      <Link href={href} className="absolute inset-0" aria-label="Darsni davom ettirish" />
    </div>
  );
}
