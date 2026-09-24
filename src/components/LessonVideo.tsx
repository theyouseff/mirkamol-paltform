"use client";

import type {} from "@kinescope/player-iframe-api-loader/types";
import { useEffect, useRef, useState } from "react";
import { load } from "@kinescope/player-iframe-api-loader";
import { markLessonWatched } from "@/lib/actions/student";

// Video oxirigacha ko'rilgan hisoblanishi uchun kerak bo'lgan ulush (boshi/oxiridagi qisqa qismni o'tkazib yuborsa ham bo'ladi)
const REQUIRED = 0.8;

const storageKey = (lessonId: string) => `watched:${lessonId}`;
const readSeconds = (lessonId: string) => {
  try {
    return new Set<number>(JSON.parse(localStorage.getItem(storageKey(lessonId)) ?? "[]"));
  } catch {
    return new Set<number>();
  }
};
const saveSeconds = (lessonId: string, seconds: Set<number>) => {
  try {
    localStorage.setItem(storageKey(lessonId), JSON.stringify([...seconds]));
  } catch {}
};

// Kinescope pleyeri. O'quvchi videoni haqiqatan ijro etib oxiriga yetkazsa (≥80%), dars avtomatik "tugatilgan" bo'ladi.
// Videoni surib oxiriga o'tkazish hisoblanmaydi: faqat ijro etilgan soniyalar sanaladi (ular brauzerda saqlanadi,
// shuning uchun videoni bir necha marta bo'lib ko'rsa ham bo'ladi). Pleyer yuklanmasa, oddiy iframe ko'rsatiladi.
export function LessonVideo({ videoId, lessonId, watermark, embedUrl }: { videoId: string; lessonId: string; watermark?: string; embedUrl: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [failed, setFailed] = useState(false);
  const [counted, setCounted] = useState(false);

  useEffect(() => {
    let player: Kinescope.IframePlayer.Player | undefined;
    let cancelled = false;
    const seconds = readSeconds(lessonId);

    (async () => {
      const factory = await load();
      if (cancelled || !frame.current) return;
      // keepElement: pleyer bizning <iframe> elementimizda ishlaydi (aks holda uni o'zi almashtirib yuboradi)
      const p = await factory.create(frame.current, { url: `https://kinescope.io/${videoId}`, keepElement: true });
      if (cancelled) {
        p.destroy().catch(() => {});
        return;
      }
      player = p;

      let duration = 0;
      let last: number | null = null;
      let sent = false;
      p.on(p.Events.DurationChange, (e) => { duration = e.data.duration; });
      p.on(p.Events.Seeked, () => { last = null; });
      p.on(p.Events.Pause, () => saveSeconds(lessonId, seconds));
      p.on(p.Events.TimeUpdate, (e) => {
        const t = e.data.currentTime;
        // Faqat oddiy ijro (bir necha soniyalik qadam) sanaladi; sakrash — yo'q
        if (last !== null && t > last && t - last < 5) for (let s = Math.floor(last); s <= Math.floor(t); s += 1) seconds.add(s);
        last = t;
      });
      p.on(p.Events.Ended, async () => {
        saveSeconds(lessonId, seconds);
        const total = duration || (await p.getDuration());
        if (sent || !total || seconds.size < total * REQUIRED) return;
        sent = true;
        try {
          await markLessonWatched(lessonId);
          setCounted(true);
        } catch {
          sent = false;
        }
      });
    })().catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      saveSeconds(lessonId, seconds);
      player?.destroy().catch(() => {});
    };
  }, [videoId, lessonId]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <iframe
        key={failed ? "fallback" : "player"}
        ref={frame}
        src={failed ? embedUrl : undefined}
        className="h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock"
        allowFullScreen
      />
      {watermark && <span aria-hidden className="video-wm">{watermark}</span>}
      {counted && <span className="absolute right-3 top-3 rounded-lg bg-gold px-3 py-1 text-sm font-semibold text-ink-950 shadow-lg">✓ Dars ko&apos;rildi</span>}
    </div>
  );
}
