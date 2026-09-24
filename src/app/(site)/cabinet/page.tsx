import { requireUser } from "@/lib/auth";

// "Ali Valiyev" -> "AV"
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";

// Kabinet: chap yuqori burchakda akkaunt egasining avatari (bosh harflar) va ismi — yumaloq kapsula ichida.
export default async function CabinetPage() {
  const user = await requireUser();
  return (
    <div className="glass inline-flex max-w-full items-center gap-3.5 rounded-full py-2 pl-2 pr-7">
      <span className="gold-gloss relative isolate flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-base before:rounded-none!" aria-hidden>
        {initials(user.name)}
      </span>
      <span className="min-w-0 truncate text-xl font-bold text-gold-text">{user.name}</span>
    </div>
  );
}
