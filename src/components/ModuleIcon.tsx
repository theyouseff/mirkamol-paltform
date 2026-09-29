// Modul ikonkasi: qorong'u plitka, xira oltin hoshiya va ichki yorug'lik; rasm to'liq sig'adi (object-contain), shaffof fon saqlanadi.
// Ikonka qo'yilmagan bo'lsa, n berilgan bo'lsa plitkada modul raqami (oltin), berilmagan bo'lsa hech narsa chiqmaydi.
const SIZES = {
  sm: "h-10 w-10 rounded-xl p-1.5 text-base",
  md: "h-16 w-16 rounded-2xl p-2.5 text-2xl",
  lg: "h-16 w-16 rounded-2xl p-2.5 text-2xl sm:h-20 sm:w-20 sm:p-3",
};

export function ModuleIcon({ src, n, size = "sm" }: { src?: string | null; n?: number; size?: keyof typeof SIZES }) {
  if (!src && n === undefined) return null;
  return (
    <span
      className={`flex shrink-0 items-center justify-center border border-gold/40 bg-gradient-to-br from-ink-800 to-ink-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_20px_-10px_rgba(212,175,55,0.55)] transition-colors duration-200 group-hover:border-gold/70 group-data-[opening]:border-gold/80 ${SIZES[size]}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
      ) : (
        <span className="gold-text-gloss font-bold leading-none">{n}</span>
      )}
    </span>
  );
}
