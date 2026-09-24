import { toEmbedUrl } from "@/lib/format";

// watermark: o'quvchining emaili video ustida xira ko'rinadi (video tarqatilsa, kimdan chiqqani bilinadi).
// To'liq ekran rejimida iframe ichidagina ko'rinadi, shuning uchun bu faqat qo'shimcha to'siq;
// asosiy himoya — Kinescope'dagi domen cheklovi.
export function VideoPlayer({ url, watermark }: { url: string; watermark?: string }) {
  const src = toEmbedUrl(url);
  if (!src) return null;
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <iframe src={src} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock" allowFullScreen />
      {watermark && <span aria-hidden className="video-wm">{watermark}</span>}
    </div>
  );
}
