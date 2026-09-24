import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "cyrillic"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kurs platformasi",
  description: "Onlayn kurslar platformasi",
  appleWebApp: { capable: true, title: "Akademiya", statusBarStyle: "black-translucent" },
  icons: { apple: "/pwa/192" },
};

export const viewport: Viewport = { themeColor: "#2f3e52" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
