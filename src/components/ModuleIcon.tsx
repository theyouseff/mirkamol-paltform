// Modul ikonkasi: qorong'u kvadratcha, xira oltin hoshiya; rasm to'liq sig'adi (object-contain), shaffof fon saqlanadi.
// Ikonka qo'yilmagan bo'lsa hech narsa chiqmaydi.
const SIZES = { sm: "h-10 w-10 rounded-xl p-1.5", lg: "h-14 w-14 rounded-2xl p-2 sm:h-16 sm:w-16" };

export function ModuleIcon({ src, size = "sm" }: { src?: string | null; size?: keyof typeof SIZES }) {
  if (!src) return null;
  return (
    <span className={`flex shrink-0 items-center justify-center border border-gold/40 bg-ink-950/70 shadow-[0_6px_16px_-8px_rgba(212,175,55,0.5)] ${SIZES[size]}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
    </span>
  );
}
