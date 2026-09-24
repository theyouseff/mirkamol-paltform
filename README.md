# Kurs platformasi (GetCourse analogi)

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
| `/` , `/courses/[slug]` | Kurslar ro'yxati va sotuv sahifasi (UTM saqlanadi) |
| `/checkout/...` | Buyurtma va to'lov |
| `/cabinet` | O'quvchi kabineti: kurslar, darslar, progress |
| `/admin` | Dashboard, kurslar, tariflar, darslar, buyurtmalar, o'quvchilar |

- `prisma/schema.prisma` — ma'lumotlar modeli
- `src/lib/access.ts` — darsga kirish qoidalari va `fulfillOrder` (to'lovdan keyin kirish ochish)
- `src/lib/actions/*` — server action'lar

## Kirish qoidalari
- Har bir tarifda **daraja** bor (Standart = 1, VIP = 2 ...). Darsda "minimal daraja" belgilanadi.
- Darsga **ochilish vaqti** qo'yish mumkin (zapusk uchun) — shu vaqtgacha yopiq turadi.

## Baza va deploy (Vercel + Neon)
Baza — PostgreSQL (Neon). SQLite Vercel'da ishlamaydi.

1. Vercel → loyiha → **Storage** → **Create Database** → **Neon** → loyihaga ulang (`DATABASE_URL`, `DATABASE_URL_UNPOOLED` avtomatik qo'shiladi).
2. Vercel → **Settings → Environment Variables**: `AUTH_SECRET` (`openssl rand -hex 32`), `PAYMENT_TEST_MODE=true`.
3. Lokal `.env` ga ham shu `DATABASE_URL` va `DATABASE_URL_UNPOOLED` ni yozing, keyin: `npm run db:push && npm run db:seed`.
4. Vercel'da **Redeploy**.
