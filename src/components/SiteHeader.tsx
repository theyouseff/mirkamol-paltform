import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { callCenterUrl, telegramUrl } from "@/lib/config";
import { HeaderNav } from "./HeaderNav";

// Aloqa: ikkita yumaloq yaltiroq tilla belgi — telefon (tel:) va Telegram.
// Keng ekranda (noutbuk, 1440px+) oynaning eng o'ng chetiga taqab turadi; torroq ekranda menyuning oxirida.
const iconBtn = "gold-gloss relative isolate flex h-9 w-9 items-center justify-center overflow-hidden rounded-full before:rounded-none! hover:brightness-110";

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
    <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
  </svg>
);

const Contact = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {callCenterUrl && (
      <a href={callCenterUrl} className={iconBtn} aria-label="Qo'ng'iroq qilish" title="Qo'ng'iroq qilish">
        <PhoneIcon />
      </a>
    )}
    {telegramUrl && (
      <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label="Telegram" title="Telegram">
        <TelegramIcon />
      </a>
    )}
  </div>
);

export async function SiteHeader() {
  const user = await getSession(); // bazaga bormaydi — rol sessiyaning o'zida
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/60 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-gold-text">ilmaviya</Link>
        <nav className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              <HeaderNav isAdmin={user.role === "ADMIN"} />
              <form action={logout}><button className="btn text-gold-text/70 hover:text-gold-text">Chiqish</button></form>
              <Contact className="ml-2 sm:ml-3 min-[1440px]:hidden" />
            </>
          ) : (
            <>
              <Link href="/courses" className="btn text-gold-text/85 hover:text-gold-text">Kurslar</Link>
              <Link href="/login" className="btn-gold">Kirish</Link>
              <Contact className="ml-2 sm:ml-3 min-[1440px]:hidden" />
            </>
          )}
        </nav>
      </div>
      <div className="absolute inset-y-0 right-4 hidden items-center min-[1440px]:flex">
        <Contact />
      </div>
    </header>
  );
}
