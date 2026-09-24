import { after } from "next/server";
import { SiteHeader } from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { recordVisit } from "@/lib/activity";

// Sarlavha shu yerda turadi, shuning uchun sahifalar almashganda qayta chizilmaydi va faol belgi silliq siljiydi.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // O'quvchi kirgan kun kalendarda belgilanadi (adminniki emas); sahifani kechiktirmaydi
  if (session && session.role !== "ADMIN") after(() => recordVisit(session.userId));
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
