import type { Metadata } from "next";
import Link from "next/link";
import { adminContactUrl, ADMIN_TELEGRAM } from "@/lib/config";

export const metadata: Metadata = { title: "Maxfiylik siyosati — ilmaviya", description: "ilmaviya platformasi va mobil ilovasi qanday ma'lumot to'playdi va undan qanday foydalanadi" };

const UPDATED = "17-oktabr 2026";

// Maxfiylik siyosati (sayt va mobil ilova uchun). Google Play va App Store shu sahifa havolasini talab qiladi;
// "Ma'lumotlarni o'chirish" bo'limi Google Play'ning akkaunt o'chirish so'rovi talabi uchun ham ishlatiladi (/privacy#ochirish).
export default function PrivacyPage() {
  const tg = <a href={adminContactUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-gold-text underline underline-offset-2">@{ADMIN_TELEGRAM}</a>;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-gold-text/85">
      <Link href="/" className="text-sm font-medium text-gold-text/80 hover:text-gold-text">← ilmaviya</Link>
      <h1 className="mt-5 text-3xl font-bold text-gold-text">Maxfiylik siyosati</h1>
      <p className="mt-2 text-sm text-gold-text/60">Oxirgi yangilanish: {UPDATED}</p>

      <div className="mt-8 space-y-8 leading-relaxed [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gold-text [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        <section>
          <p>
            ilmaviya — onlayn kurslar platformasi (sayt <b>ilmaviya.vercel.app</b> va «ilmaviya» mobil ilovasi). Bu sahifada qanday ma&apos;lumot to&apos;planishi, nima uchun
            ishlatilishi va uni qanday o&apos;chirish mumkinligi yozilgan. Ilova va saytdan foydalanish shu qoidalarga rozilik bildiradi.
          </p>
        </section>

        <section>
          <h2>Qanday ma&apos;lumot to&apos;planadi</h2>
          <ul>
            <li><b>Akkaunt:</b> ism, email, telefon raqam (agar berilgan bo&apos;lsa) va parol. Parol shifrlangan holda saqlanadi.</li>
            <li><b>O&apos;qish natijalari:</b> qaysi darslarni ko&apos;rgansiz, videoni qayerda to&apos;xtatgansiz, qaysi kunlari kirgansiz, reytingdagi ballar.</li>
            <li><b>Qurilma:</b> qurilma va brauzer turi (masalan «iPhone · Safari»), IP manzil va taxminiy shahar, kirish vaqti. Bu akkauntni boshqa odamlarga berishdan himoya qilish uchun kerak.</li>
            <li><b>Yozishmalar:</b> kurator bilan chatdagi xabarlar.</li>
            <li><b>To&apos;lov yozuvlari:</b> qaysi kurs uchun qancha to&apos;langani. Karta ma&apos;lumotlari platformada saqlanmaydi va to&apos;planmaydi.</li>
          </ul>
          <p className="mt-3">Reklama, kuzatuv (tracking) yoki tahlil xizmatlari ishlatilmaydi. Joylashuv (GPS), kontaktlar, kamera, mikrofon va rasmlarga ruxsat so&apos;ralmaydi.</p>
        </section>

        <section>
          <h2>Ma&apos;lumot nima uchun ishlatiladi</h2>
          <ul>
            <li>Kursga kirish berish, darslar va progressni ko&apos;rsatish.</li>
            <li>Kurator va admin o&apos;quvchining o&apos;qishini kuzatib, yordam berishi uchun.</li>
            <li>Parol, kirish kodi va to&apos;lov eslatmasi kabi xatlarni emailga yuborish uchun.</li>
            <li>Akkaunt va darslarni himoya qilish uchun: bir vaqtda ko&apos;pi bilan 2 ta qurilma, ekranni yozib olishdan himoya.</li>
          </ul>
          <p className="mt-3">Ma&apos;lumotlar sotilmaydi va reklama uchun boshqalarga berilmaydi. Reytingda boshqa o&apos;quvchilarga faqat ismingiz va familiyangizning bosh harfi ko&apos;rinadi.</p>
        </section>

        <section>
          <h2>Ma&apos;lumot qayerda saqlanadi</h2>
          <p>
            Ma&apos;lumotlar platforma ishlashi uchun ishlatiladigan xizmatlarda himoyalangan holda saqlanadi: Vercel (sayt), Neon (ma&apos;lumotlar bazasi),
            Cloudflare R2 va Kinescope (video darslar), Gmail (xatlar). Barcha ulanishlar shifrlangan (HTTPS).
          </p>
        </section>

        <section>
          <h2>Qancha vaqt saqlanadi</h2>
          <p>
            Akkaunt faol bo&apos;lgan davrda saqlanadi. Akkaunt o&apos;chirilganda ism, email, telefon, parol, progress, kirgan kunlar, qurilmalar va chat yozuvlari o&apos;chiriladi.
            To&apos;lov yozuvlari hisob-kitob uchun saqlanib qoladi.
          </p>
        </section>

        <section id="ochirish" className="scroll-mt-24">
          <h2>Akkaunt va ma&apos;lumotlarni o&apos;chirish</h2>
          <p>
            Akkauntingizni va u bilan bog&apos;liq ma&apos;lumotlarni o&apos;chirish uchun Telegramda {tg} ga akkauntingiz emailini yozib so&apos;rov yuboring.
            So&apos;rov 7 kun ichida bajariladi va sizga xabar beriladi. Yuqorida aytilganidek, faqat to&apos;lov yozuvlari hisob-kitob uchun saqlanib qoladi.
          </p>
        </section>

        <section>
          <h2>Bolalar</h2>
          <p>Platforma kattalar uchun mo&apos;ljallangan va 13 yoshgacha bo&apos;lgan bolalardan ataylab ma&apos;lumot to&apos;plamaydi.</p>
        </section>

        <section>
          <h2>O&apos;zgarishlar va aloqa</h2>
          <p>
            Bu siyosat o&apos;zgarsa, yangi matn shu sahifada e&apos;lon qilinadi. Savollar bo&apos;yicha Telegramda {tg} ga yozing.
          </p>
        </section>
      </div>
    </main>
  );
}
