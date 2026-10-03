import type { CSSProperties } from "react";
import Link from "next/link";
import { telegramUrl } from "@/lib/config";

// Kirish sahifalarining yuqori qatori: chapda sayt nomi, o'ngda adminga yozish uchun yumaloq tilla Telegram tugmasi
// (saytning yuqori menyusidagi bilan bir xil). Ikkalasi bir chiziqda turadi.
export function AuthBrand() {
  return (
    <div className="absolute inset-x-0 top-5 flex items-center justify-between px-5 sm:top-8 sm:px-10">
      <Link href="/" className="enter text-2xl font-bold tracking-wide text-gold-text sm:text-3xl">
        ilmaviya
      </Link>
      {telegramUrl && (
        // .enter animatsiyasi transform'ni egallab turadi, shuning uchun u o'rama elementda — tugmaning bosilish effekti (active) ishlaydi
        <span className="enter" style={{ "--i": 1 } as CSSProperties}>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram orqali adminga yozish"
            title="Adminga yozish"
            className="gold-gloss relative isolate flex h-10 w-10 items-center justify-center overflow-hidden rounded-full before:rounded-none! hover:brightness-110 sm:h-11 sm:w-11"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-[22px] sm:w-[22px]" fill="currentColor" aria-hidden>
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
          </a>
        </span>
      )}
    </div>
  );
}
