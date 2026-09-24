export type BarPoint = { label: string; tick: string; value: number; tip: string };

// 0, yarmi, maksimum — o'qda "chiroyli" sonlar bo'lishi uchun
function niceMax(max: number) {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= max) ?? 10;
  return step * pow;
}

export function BarChart({ title, total, data, axis }: { title: string; total: string; data: BarPoint[]; axis: (n: number) => string }) {
  const top = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const every = data.length > 20 ? 5 : data.length > 12 ? 2 : 1;
  return (
    <figure className="card min-w-0">
      <figcaption className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-zinc-500">Jami: <b className="text-zinc-900">{total}</b></span>
      </figcaption>
      <div className="grid grid-cols-[auto_1fr] gap-x-3">
        <div className="flex h-44 flex-col justify-between whitespace-nowrap text-right text-xs tabular-nums text-zinc-400" aria-hidden="true">
          <span className="-translate-y-1/2">{axis(top)}</span>
          <span>{axis(top / 2)}</span>
          <span className="translate-y-1/2">0</span>
        </div>
        <div className="relative h-44">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
            <div className="border-t border-dashed border-zinc-100" />
            <div className="border-t border-dashed border-zinc-100" />
            <div className="border-t border-zinc-200" />
          </div>
          <div className="relative flex h-full items-end gap-0.5">
            {data.map((d, i) => (
              <div key={i} className="group relative flex h-full min-w-0 flex-1 items-end" tabIndex={0} aria-label={`${d.label}: ${d.tip}`}>
                <div
                  className="w-full rounded-t bg-brand transition-colors group-hover:bg-brand-dark group-focus:bg-brand-dark"
                  style={{ height: d.value > 0 ? `max(2px, ${(d.value / top) * 100}%)` : 0 }}
                />
                <div className={`pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap ${i < data.length / 2 ? "left-0" : "right-0"} rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block group-focus:block`}>
                  <span className="text-zinc-400">{d.label}</span> · {d.tip}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div />
        <div className="mt-2 flex gap-0.5 overflow-hidden text-[11px] text-zinc-400" aria-hidden="true">
          {data.map((d, i) => (
            <span key={i} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">{i % every === 0 ? d.tick : ""}</span>
          ))}
        </div>
      </div>
    </figure>
  );
}
