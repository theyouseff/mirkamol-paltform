"use client";

import { createContext, useContext, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Ctx = createContext<{ pending: boolean; go: (href: string) => void }>({ pending: false, go: () => {} });

// Analitika sahifasi: o'quvchi almashganda sahifa qayta yuklanmaydi, tepa panel yumshoq almashadi.
export function SwitchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (href: string) => {
    window.scrollTo({ top: 0, behavior: "smooth" }); // tanlangan o'quvchining metrikalari ko'rinsin
    start(() => router.push(href, { scroll: false }));
  };
  return <Ctx.Provider value={{ pending, go }}>{children}</Ctx.Provider>;
}

// Tepa panel: yangi ma'lumot kelguncha eski panel xiralashadi, keyin yangisi silliq paydo bo'ladi (id o'zgarganda).
export function TopPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const { pending } = useContext(Ctx);
  return (
    <div key={id} className={`panel-in space-y-8 transition-opacity duration-300 ${pending ? "opacity-50" : "opacity-100"}`}>
      {children}
    </div>
  );
}

export function StudentLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const { go } = useContext(Ctx);
  return (
    <Link
      href={href}
      scroll={false}
      className={className}
      onClick={(e) => {
        // Yangi oynada ochish yoki modifikator tugmalari bilan bosish — odatdagidek
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        go(href);
      }}
    >
      {children}
    </Link>
  );
}
