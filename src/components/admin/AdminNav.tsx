"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "📊 Dashboard" },
  { href: "/admin/courses", label: "📚 Kurslar" },
  { href: "/admin/authors", label: "🧑‍🏫 Mualliflar" },
  { href: "/admin/orders", label: "🧾 To'lovlar" },
  { href: "/admin/students", label: "👥 O'quvchilar" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {links.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${active ? "bg-amber-400/15 font-medium text-amber-300" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
