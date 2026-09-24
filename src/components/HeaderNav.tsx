"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const links = [
  { href: "/courses", label: "Kurslar" },
  { href: "/cabinet", label: "Kabinet" },
  { href: "/cabinet/settings", label: "Parol" },
];

function isActive(href: string, path: string) {
  // "/cabinet" o'z ichidagi darslar va kurslarni o'z ichiga oladi, lekin "Parol" sahifasini emas
  if (href === "/cabinet") return path === "/cabinet" || (path.startsWith("/cabinet/") && !path.startsWith("/cabinet/settings"));
  return path === href || path.startsWith(`${href}/`);
}

// Faol tugma orqasidagi belgi (layoutId) bir tugmadan ikkinchisiga silliq siljib o'tadi.
export function HeaderNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  return (
    <>
      {isAdmin && <Link href="/admin" className="btn-outline">Admin panel</Link>}
      {links.map((l) => {
        const active = isActive(l.href, path);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`relative rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${active ? "text-white" : "text-zinc-600 hover:text-zinc-900"}`}
          >
            {active && (
              <motion.span
                layoutId="header-pill"
                className="absolute inset-0 rounded-xl bg-brand"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{l.label}</span>
          </Link>
        );
      })}
    </>
  );
}
