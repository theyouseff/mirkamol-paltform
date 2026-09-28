const styles: Record<string, [string, string]> = {
  PAID: ["To'langan", "bg-green-100 text-green-700"],
  PENDING: ["Kutilmoqda", "bg-amber-100 text-amber-700"],
  CANCELED: ["Bekor qilingan", "bg-zinc-100 text-zinc-500"],
};

export function StatusBadge({ status }: { status: string }) {
  const [label, cls] = styles[status] ?? [status, "bg-zinc-100"];
  return <span className={`badge ${cls}`}>{label}</span>;
}
