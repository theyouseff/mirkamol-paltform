export function ProgressBar({ value, dark = false }: { value: number; dark?: boolean }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-zinc-100"}`}>
      <div className={`h-full rounded-full transition-all ${dark ? "bg-gradient-to-r from-[#f1c657] to-[#c9962a]" : "bg-brand"}`} style={{ width: `${Math.round(value)}%` }} />
    </div>
  );
}
