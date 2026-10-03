import Link from "next/link";
import { getSession } from "@/lib/auth";
import { telegramUrl } from "@/lib/config";
import { studentUnread } from "@/lib/curator-scope";
import { HeaderNav } from "./HeaderNav";
import { LogoutButton } from "./LogoutButton";

// Aloqa: yumaloq yaltiroq tilla Telegram belgisi.
// Keng ekranda (noutbuk, 1440px+) oynaning eng o'ng chetiga taqab turadi; torroq ekranda menyuning oxirida.
const iconBtn = "gold-gloss relative isolate flex h-9 w-9 items-center justify-center overflow-hidden rounded-full before:rounded-none! hover:brightness-110";

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
    <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
  </svg>
);

const Contact = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {telegramUrl && (
      <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label="Telegram" title="Telegram">
        <TelegramIcon />
      </a>
    )}
  </div>
);

export async function SiteHeader() {
  const user = await getSession(); // rol sessiyaning o'zida; faqat o'quvchi uchun chatdagi yangi xabarlar soni olinadi
  const chatUnread = user?.role === "STUDENT" ? await studentUnread(user.userId).catch(() => 0) : 0;
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/60 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="shrink-0 text-lg font-bold text-gold-text">ilmaviya</Link>
        <nav className="flex min-w-0 items-center gap-1 text-sm">
          {/* Menyu telefonda torlik qilsa o'ng-chapga suriladi (sahifaning o'zi kengaymaydi); logotip va aloqa belgilari joyida turadi */}
          <div className="relative flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0">
            {user ? (
              <>
                <HeaderNav isAdmin={user.role === "ADMIN"} isCurator={user.role === "CURATOR"} showChat={user.role === "STUDENT"} chatUnread={chatUnread} />
                <LogoutButton className="btn text-gold-text/70 hover:text-gold-text" />
              </>
            ) : (
              <>
                <Link href="/courses" className="btn text-gold-text/85 hover:text-gold-text">Kurslar</Link>
                <Link href="/login" className="btn-gold">Kirish</Link>
              </>
            )}
          </div>
          <Contact className="ml-1 shrink-0 sm:ml-3 min-[1440px]:hidden" />
        </nav>
      </div>
      <div className="absolute inset-y-0 right-4 hidden items-center min-[1440px]:flex">
        <Contact />
      </div>
    </header>
  );
}
