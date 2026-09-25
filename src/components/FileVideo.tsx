"use client";

import { useEffect, useRef, useState } from "react";
import { preconnect } from "react-dom";
import { markLessonWatched, saveWatchProgress } from "@/lib/actions/student";

// LessonVideo (Kinescope) bilan bir xil qoidalar: ≥80% haqiqiy ijro oxirigacha ko'rildi hisoblanadi, surib o'tish sanalmaydi.
const REQUIRED = 0.8;
const HEARTBEAT = 15_000;
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

// O'z videosi: shu serverdagi yopiq fayl (/api/video/[dars]) yoki R2 dan vaqtinchalik imzolangan havola. src bo'sh — video topilmadi. trackProgress=false — admin ko'rishi (analitikaga yozilmaydi).
export function FileVideo({ lessonId, src, startAt = 0, autoPlay = false, trackProgress = true }: { lessonId: string; src: string | null; startAt?: number; autoPlay?: boolean; trackProgress?: boolean }) {
  // Video boshqa manzildan (R2) kelsa, ulanish sahifa ochilgan zahoti tayyorlanadi
  if (src && /^https?:/.test(src)) preconnect(new URL(src).origin);
  const video = useRef<HTMLVideoElement>(null);
  const [counted, setCounted] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el || !src) return;
    const seconds = readSeconds(lessonId);
    const track = { pos: 0, duration: 0, sentAt: 0, dirty: false };
    let last: number | null = null;
    let sent = false;

    const flush = () => {
      if (!trackProgress || !track.dirty || !track.duration) return;
      track.dirty = false;
      track.sentAt = Date.now();
      saveWatchProgress(lessonId, track.pos, track.duration, seconds.size).catch(() => {});
    };
    const onMeta = () => {
      track.duration = el.duration || 0;
      if (startAt > 0 && startAt < el.duration) el.currentTime = startAt;
      if (autoPlay) el.play().catch(() => {});
    };
    const onTime = () => {
      const t = el.currentTime;
      if (last !== null && t > last && t - last < 5) for (let s = Math.floor(last); s <= Math.floor(t); s += 1) seconds.add(s);
      last = t;
      track.pos = t;
      track.dirty = true;
      if (Date.now() - track.sentAt > HEARTBEAT) flush();
    };
    const onPause = () => {
      saveSeconds(lessonId, seconds);
      flush();
    };
    const onEnded = async () => {
      saveSeconds(lessonId, seconds);
      flush();
      const total = el.duration;
      if (!trackProgress || sent || !total || seconds.size < total * REQUIRED) return;
      sent = true;
      try {
        await markLessonWatched(lessonId);
        setCounted(true);
      } catch {
        sent = false;
      }
    };
    const onSeeked = () => {
      last = null;
    };
    const onHide = () => document.visibilityState === "hidden" && flush();

    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("seeked", onSeeked);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    document.addEventListener("visibilitychange", onHide);
    if (el.readyState >= 1) onMeta();
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("seeked", onSeeked);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      document.removeEventListener("visibilitychange", onHide);
      saveSeconds(lessonId, seconds);
      flush();
    };
  }, [lessonId, src, startAt, autoPlay, trackProgress]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <video
        ref={video}
        // #t=0.001: brauzer birinchi kadrni darhol chizadi (qora ekran o'rniga); preload=auto: dars ochilishi bilan videoning boshi yuklana boshlaydi,
        // shuning uchun play bosilganda kutmasdan ketadi
        src={src ? (startAt > 0 ? src : `${src}#t=0.001`) : undefined}
        className="h-full w-full"
        controls
        playsInline
        preload="auto"
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        onError={() => setError(true)}
      />
      {(error || !src) && <p className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-sm text-white/80">Videoni yuklab bo&apos;lmadi. Sahifani yangilang yoki adminga yozing.</p>}
      {counted && <span className="absolute right-3 top-3 rounded-lg bg-gold px-3 py-1 text-sm font-semibold text-ink-950 shadow-lg">✓ Dars ko&apos;rildi</span>}
    </div>
  );
}
