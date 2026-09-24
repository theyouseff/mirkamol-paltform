import { brandVars } from "@/lib/brand";

// Ichidagi hamma narsada `text-brand`, `bg-brand` va boshqalar kursning rangida chiqadi.
export function BrandScope({ color, children }: { color?: string | null; children: React.ReactNode }) {
  return (
    <div className="contents" style={brandVars(color)}>
      {children}
    </div>
  );
}
