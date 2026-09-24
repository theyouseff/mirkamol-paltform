"use client";

import type {} from "@kinescope/player-iframe-api-loader/types";
import { useEffect, useRef, useState } from "react";
import { load } from "@kinescope/player-iframe-api-loader";

// Admin analitikasi: o'quvchi oxirgi ko'rgan video, o'quvchi to'xtagan joyga qo'yilgan holda (avtomatik ijro etilmaydi).
// Bu yerdagi ko'rish hech qayerda hisobga olinmaydi.
export function StudentVideo({ videoId, position, embedUrl }: { videoId: string; position: number; embedUrl: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let player: Kinescope.IframePlayer.Player | undefined;
    let cancelled = false;
    (async () => {
      const factory = await load();
      if (cancelled || !frame.current) return;
      const p = await factory.create(frame.current, { url: `https://kinescope.io/${videoId}`, keepElement: true });
      if (cancelled) {
        p.destroy().catch(() => {});
        return;
      }
      player = p;
      // Pleyer tayyor bo'lgach to'xtagan joyga suriladi
      const seek = () => p.seekTo(position).catch(() => {});
      p.once(p.Events.Loaded, seek);
      seek();
    })().catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      player?.destroy().catch(() => {});
    };
  }, [videoId, position]);

  return (
    <iframe
      key={failed ? "fallback" : "player"}
      ref={frame}
      src={failed ? embedUrl : undefined}
      className="aspect-video w-full rounded-xl bg-black"
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock"
      allowFullScreen
    />
  );
}
