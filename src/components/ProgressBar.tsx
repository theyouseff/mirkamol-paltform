export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.round(value)}%` }} />
    </div>
  );
}
