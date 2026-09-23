import { toEmbedUrl } from "@/lib/format";

export function VideoPlayer({ url }: { url: string }) {
  const src = toEmbedUrl(url);
  if (!src) return null;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <iframe src={src} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
    </div>
  );
}
