# Kurs platformasi (GetCourse analogi)

Next.js 15 + Prisma + Tailwind. Bitta ekspert uchun onlayn kurslar platformasi.

## Ishga tushirish

```bash
npm install
cp .env.example .env      # AUTH_SECRET ni to'ldiring
npm run db:push           # bazani yaratish
npm run db:seed           # admin + demo kurs
npm run dev               # http://localhost:3000
```

Admin: `+998 90 123 45 67` / `admin123` (serverga chiqarishdan oldin albatta o'zgartiring).

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

## Prod
`prisma/schema.prisma` da `provider = "postgresql"` qilib, `DATABASE_URL` ni PostgreSQL'ga almashtiring. `PAYMENT_TEST_MODE` ni o'chiring.
