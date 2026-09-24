"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/courses", label: "Kurslar" },
  { href: "/cabinet", label: "Kabinet" },
  { href: "/cabinet/settings", label: "Parol" },
];

const SLIDE = "0.75s cubic-bezier(0.45, 0.05, 0.2, 1)";

function isActive(href: string, path: string) {
  // Kabinet — faqat shaxsiy sahifa. O'quvchining kursi, moduli va darslari "Kurslar" bo'limidan ochiladi.
  if (href === "/cabinet") return path === "/cabinet";
  if (href === "/courses") return path === "/courses" || path.startsWith("/courses/") || /^\/cabinet\/(courses|modules|lessons)\//.test(path);
  return path === href || path.startsWith(`${href}/`);
}

// Faol tugma orqasidagi oltin belgi CSS o'tishi bilan bir tugmadan ikkinchisiga silliq siljiydi.
export function HeaderNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  // Bosilgan tugma darhol faol bo'ladi — server sahifani yuklab bo'lishini kutmaymiz
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => setTarget(null), [path]);
  const activeHref = target ?? links.find((l) => isActive(l.href, path))?.href ?? null;

  const box = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const [animate, setAnimate] = useState(false); // birinchi chizilishda siljimasin (60 ms dan keyin yoqiladi)

  const measure = useCallback(() => {
    const el = activeHref ? refs.current[activeHref] : null;
    setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
  }, [activeHref]);

  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 60);
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [measure]);

  return (
    <>
      {isAdmin && <Link href="/admin" className="btn-outline">Admin panel</Link>}
      <div ref={box} className="relative flex items-center gap-1">
        <span
          aria-hidden
          className="gold-gloss absolute left-0 top-0 isolate h-full rounded-xl"
          style={{
            width: pill?.w ?? 0,
            transform: `translateX(${pill?.x ?? 0}px)`,
            opacity: pill ? 1 : 0,
            transition: animate ? `transform ${SLIDE}, width ${SLIDE}, opacity 0.3s` : "none",
          }}
        />
        {links.map((l) => (
          <Link
            key={l.href}
            ref={(el) => { refs.current[l.href] = el; }}
            href={l.href}
            onClick={() => setTarget(l.href)}
            className={`relative z-10 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-700 ${activeHref === l.href ? "text-ink-950" : "text-gold-text/80 hover:text-gold-text"}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </>
  );
}
