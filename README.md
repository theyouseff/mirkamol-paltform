# ilmaviya — kurs platformasi (GetCourse analogi)

Next.js 15 + Prisma + Tailwind. Bitta ekspert uchun onlayn kurslar platformasi.

## Ishga tushirish

```bash
npm install
cp .env.example .env      # DATABASE_URL, AUTH_SECRET ni to'ldiring
npm run db:push           # bazani yaratish
npm run db:seed           # admin + demo kurs
npm run dev               # http://localhost:3000
```

Admin: `.env` dagi `ADMIN_EMAIL` / `ADMIN_PASSWORD` (seed shu bilan yaratadi).

## Tuzilma

| Yo'l | Nima |
|---|---|
| `/` , `/login` | Kirish (email + parol). O'zi ro'yxatdan o'tish yo'q — akkauntni admin ochadi |
| `/activate`, `/forgot` | Emailga kelgan bir martalik kod bilan parol o'rnatish (yangi o'quvchi) va tiklash (SMTP kerak) |
| `/courses`, `/courses/[slug]` | Kurslar katalogi va sotuv sahifasi: faqat dastur (modul/dars nomlari), video va matn yo'q |
| `/cabinet` | O'quvchi kabineti: kurs → modul → dars (video). Faqat o'zi to'lagan kurslar, progress |
| `/cabinet/settings` | Parolni o'zgartirish |
| `/admin` | Dashboard, kurslar, mualliflar, to'lovlar, o'quvchilar |

## Ish tartibi
1. Mijoz Telegramda kelishadi va kartaga to'laydi (skrinshot yuboradi).
2. Admin: **O'quvchilar → O'quvchi qo'shish** — email, kurs/tarif, summa. Yangi o'quvchiga akkaunt ochiladi va emailga bir martalik kod yuboriladi; u saytda `/activate` sahifasida email + kodni kiritib, parolni o'zi qo'yadi. Xat ketmasa, kod panelda ko'rinadi (Telegramda yuborasiz).
3. O'quvchi kirib faqat o'zi to'lagan kursni ko'radi. Boshqa kurslar (boshqa mualliflarniki ham) yopiq.

## Mualliflar va brend
- **Mualliflar** — kurs egalari (siz, mijozlaringiz). Kursga muallif biriktiriladi; dashboard va to'lovlarda muallif bo'yicha hisobot va filtr bor.
- Har kursning **brendi**: nom/logotip va asosiy rang (kurs sozlamalarida). O'quvchi shu kursni ochganda o'sha rangni ko'radi.

## Xavfsizlik
- Video va dars matni faqat kabinetda, faqat kursga yozilgan (yoki admin) foydalanuvchiga serverdan chiqadi. Sotuv sahifasida faqat nomlar.
- Video ustida o'quvchi emaili xira ko'rinadi (tarqatilsa kimdan chiqqani bilinadi).
- **Kinescope'da domen cheklovi**: Kinescope → loyiha sozlamalari → Xavfsizlik (Domain restriction) → `ilmaviya.vercel.app` ni qo'shing. Busiz embed havolasini istalgan saytga qo'yib ko'rsatish mumkin.
- Kirishda urinishlar chegarasi (5 xato → 15 daqiqa kutish). Parol o'zgarsa yoki tiklansa, boshqa qurilmalardagi sessiyalar yopiladi.
- Vercel'da **AUTH_SECRET** albatta sozlang; admin dashboardda sozlanmagan narsalar ko'rsatiladi.
- Demo kursga namuna modul/darslarni yuklash: `npx tsx prisma/import-demo.ts` (o'quvchisi bo'lgan kursga tegmaydi).

## Kirish qoidalari
- Har bir tarifda **daraja** bor (Standart = 1, VIP = 2 ...). Darsda "minimal daraja" belgilanadi.
- Darsga **ochilish vaqti** qo'yish mumkin (zapusk uchun).

## Baza va deploy (Vercel + Neon)
Baza — PostgreSQL (Neon). SQLite Vercel'da ishlamaydi.

1. Vercel → loyiha → **Storage** → **Create Database** → **Neon** → loyihaga ulang (`DATABASE_URL`, `DATABASE_URL_UNPOOLED` avtomatik qo'shiladi).
2. Vercel → **Settings → Environment Variables**: `AUTH_SECRET` (`openssl rand -hex 32`); xat yuborish uchun `SMTP_*` (`.env.example` ga qarang).
3. Lokal `.env` ga ham shu `DATABASE_URL` va `DATABASE_URL_UNPOOLED` ni yozing, keyin: `npm run db:push && npm run db:seed`.
4. Vercel'da **Redeploy**.
