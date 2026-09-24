import { SiteHeader } from "@/components/SiteHeader";

// Sarlavha shu yerda turadi, shuning uchun sahifalar almashganda qayta chizilmaydi va faol belgi silliq siljiydi.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
