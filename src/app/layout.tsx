import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { preload } from "react-dom";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "cyrillic"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ilmaviya",
  description: "Onlayn kurslar platformasi",
  appleWebApp: { capable: true, title: "Ilmaviya", statusBarStyle: "black-translucent" },
  icons: { apple: "/pwa/192" },
};

export const viewport: Viewport = { themeColor: "#151922" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  preload("/auth-bg-wide.webp", { as: "image", media: "(min-aspect-ratio: 1/1)" });
  preload("/auth-bg-tall.webp", { as: "image", media: "(max-aspect-ratio: 1/1)" });
  return (
    <html lang="uz">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}><div aria-hidden className="auth-bg fixed inset-0 -z-10" />
        {children}
      </body>
    </html>
  );
}
