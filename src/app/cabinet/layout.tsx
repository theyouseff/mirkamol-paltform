import { SiteHeader } from "@/components/SiteHeader";

export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
    </>
  );
}
