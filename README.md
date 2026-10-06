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
| `/activate`, `/forgot` | Emailga kelgan bir martalik kod bilan parol o'rnatish / tiklash (SMTP kerak). Yangi o'quvchi va kuratorga esa tayyor parol beriladi — `/activate` ular uchun kerak emas |
| `/courses`, `/courses/[slug]` | Kurslar katalogi va sotuv sahifasi: faqat dastur (modul/dars nomlari), video va matn yo'q |
| `/courses` → `/cabinet/courses/[slug]` | Kirgach o'quvchi «Kurslar» sahifasiga tushadi; o'zi to'lagan kurs blokini bossa kurs ochiladi: modul → video dars, progress |
| `/cabinet` | Akkaunt egasining avatari, ismi va progress (nechta dars ko'rilgani); kurslar bu yerda chiqmaydi |
| `/cabinet/settings` | Parolni o'zgartirish |
| `/curator` | **Kurator paneli** (alohida oyna): o'quvchilar analitikasi, faqat ko'rish. Kurator o'quvchi kabinetiga ham, admin panelga ham tushmaydi |
| `/admin` | Dashboard, kurslar, mualliflar, to'lovlar, o'quvchilar, **analitika** (umumiy metrikalar; o'quvchi tanlansa — uning oxirgi ko'rgan darsi, to'xtagan daqiqasi, kirgan kunlari kalendari va tugatgan videolari soni (adminda video ijro etilmaydi)) |

## Kuratorlar
Admin: **O'quvchilar → Kurator qo'shish** — email va ism. Yangi kuratorga akkaunt ochiladi, tayyor parol yaratilib emailiga ketadi (panelda ham ko'rinadi); u email va shu parol bilan kurator paneliga kiradi. Mavjud foydalanuvchining emailini yozsangiz roli kurator bo'ladi (qayta kirishi kerak). Kuratorga **kurs biriktiriladi** (qo'shish formasida yoki «Kuratorlar» ro'yxatida): kurator shu kurslardagi hamma o'quvchini ko'radi (kursga keyin yozilganlarni ham). Kurator o'quvchining **kelmagan (qizil) kunini** kalendarda bossa, kalendar ostida oyna ochiladi: holat (**Dars ko'rdi / Dars ko'rmadi / Sababli**) va sabab yoziladi; «sababli» va «ko'rdi» kunlar "eng ko'p qoldirganlar" hisobiga kirmaydi. Kurator **Parol** sahifasida chapda o'z o'quvchilarini ko'radi: tanlansa o'quvchining logini chiqadi va «Parolni o'zgartirish» bilan yangi parol qo'ya oladi (hozirgi parol so'ralmaydi; parollar xeshlanadi, eskisini ko'rib bo'lmaydi). Kirgach rolga qarab: admin → `/admin`, kurator → `/curator`, o'quvchi → `/courses`.

## Chat
Har bir **(o'quvchi, kurator)** juftligining alohida suhbati bor: kuratorlar bir-birining yozishmasini ko'rmaydi, o'quvchi esa har bir kurator bilan alohida yozishadi (bir nechta kurator bo'lsa, chatda ularning ismlari tugma bo'lib chiqadi). Kurator panelida **Chat** (chapda o'z o'quvchilari, tanlansa suhbat), o'quvchida menyudagi **Chat**. Yangi xabarlar har 4 soniyada o'zi yangilanadi; kurator menyusidagi **Chat** yonida shu kuratorga nechta o'quvchi yozgani (o'qilmagan) qizil belgida chiqadi. Platforma ichida tepada **bildirishnoma** chiqadi: o'quvchiga kuratordan yangi xabar kelsa «CHAT abduholiq: salom…» (kuratorga — o'quvchidan), bosilsa chat ochiladi; 9 soniyadan keyin yo'qoladi, chat ochiq turganda chiqmaydi. Har kim faqat o'z suhbatidagi xabarlarni ko'radi. Admin **Analitika** sahifasining pastida **Kurslar va chatlar**: kursni bossa kuratorlari, kuratorni bossa uning o'quvchilari, o'quvchini bossa shu kurator bilan suhbati chiqadi (faqat ko'rish; admin ochgani xabarni "o'qildi" qilib qo'ymaydi).

## Muqova rasmi yuklash
Admin → Kurslar → kursni tahrirlash: **Muqova rasmi** maydonida havola yozish yoki **Kompyuterdan yuklash** tugmasi (JPG/PNG/WebP). Brauzer rasmni yuklashdan oldin kichraytiradi (eni 1600 px gacha, WebP), rasm bazada saqlanadi va `/api/img/<id>` orqali beriladi (bir yil keshlanadi). Yuklangach «Saqlash» tugmasini bosing.

**Modul ikonkasi** (modul kartochkasida rasm yo'q — faqat ikonka, raqam, nom, vaqt va progress): Admin → kurs → modul formasidagi ikonka maydoni — havola yoki kompyuterdan yuklash (256 px gacha kichraytiriladi, PNG'ning shaffof foni saqlanadi). Ikonka qo'yilmasa, plitkada modul raqami chiqadi. LOR modullari ikonkalari: `public/icons/modules/*.webp` (shaffof fonli; maydonga masalan `/icons/modules/peshona.webp` yoziladi). Eski (almashtirilgan) rasm bazada qoladi, lekin hech qayerda ko'rinmaydi.

## Online holati va kirish xabari
- **Online:** o'quvchi oxirgi 2 daqiqada sahifa ochgan yoki video ko'rgan bo'lsa, Analitikada «Oxirgi faollik» o'rnida yashil chiroqcha bilan **Online** chiqadi (sahifa har 20 soniyada o'zi yangilanadi).
- **Tomosha qilyapti:** video ijro etilayotganda (har 15 soniyada brauzer uradi) Analitikada Online o'rniga **Tomosha qilyapti** chiqadi; pauza qilsa yoki sahifadan chiqsa darhol o'chadi (yopilgan brauzerda ham 45 soniyada o'chadi).
- **Kirish xabari:** o'quvchi 10 daqiqadan ortiq nofaollikdan keyin platformaga kirsa, adminga (va o'z o'quvchisi bo'lsa kuratorga) tepada o'ngda «*Ism* platformaga kirdi» xabari chiqadi.

## O'quvchiga email yozish
Analitika → «Oxirgi 7 kunda eng ko'p dars qoldirganlar» ro'yxatida har bir o'quvchi yonida **Email yozish** tugmasi: bosilsa matn maydoni ochiladi (tepada o'quvchining emaili), «Yuborish» xatni SMTP orqali jo'natadi. Xatdagi «Javob» (Reply-To) yuborgan admin/kuratorning emaili bo'ladi, shuning uchun o'quvchi javob yozsa unga boradi. Kurator faqat o'z o'quvchisiga yoza oladi; 10 daqiqada 10 tadan ko'p xat yuborib bo'lmaydi. SMTP sozlanmagan bo'lsa, xato xabari chiqadi.

## To'lovlarni boshqarish
Admin → To'lovlar: holat belgisini (masalan **To'langan**) bossangiz, boshqa holatlar chiqadi: To'langan uchun **Kutilmoqda** va **Qaytarildi**. Tanlangan holat darhol o'rnatiladi va to'lov shu holatning blokiga (filtriga) tushadi: Kutilmoqda → «Kutilmoqda», Qaytarildi → «Bekor qilingan». Daromad va hisobotlarga faqat **To'langan**lar kiradi. Har bir qatorda **O'chirish** tugmasi to'lov yozuvini butunlay o'chiradi (tasdiq bilan, ortga qaytmaydi). Holatni o'zgartirish va o'chirish kursga kirishga tegmaydi: o'quvchini kursdan chiqarish alohida (O'quvchilar → kurs belgisi yonidagi ×); To'langan qilinsa, kurs ochiladi.

## To'lov eslatmasi (Kutilmoqda)
Kutilmoqda holatidagi to'lov qatorida **sana** tanlanadi (masalan 15 oktabr) va «Saqlash» bosiladi. Shu kuni ertalab (09:00, Toshkent) o'quvchining emailiga «To'lov eslatmasi» xati **avtomatik** ketadi (kurs nomi, summa, admin Telegrami bilan); bir sana uchun bir marta. Qatorda **Hozir eslatish** tugmasi ham bor (qo'lda darhol yuborish). Avtomatik yuborish Vercel Cron orqali ishlaydi (`vercel.json`, har kuni 04:00 UTC): buning uchun Vercel → Settings → Environment Variables da **`CRON_SECRET`** (tasodifiy uzun matn, masalan `openssl rand -hex 32`) qo'yilishi shart, aks holda `/api/cron/payment-reminders` 401 qaytaradi. SMTP ham sozlangan bo'lishi kerak. Muddati 7 kundan oshgan, yoki To'langan/Bekor qilingan bo'lgan to'lovlarga eslatma ketmaydi.

## Dars bloklaridagi rasmlar (darhol ko'rinadi)
Modul sahifasida har bir dars blokida videoning **tayyor rasmi** (3-soniyadagi kadr) turadi: modulga kirilganda u video yuklanishini kutmay darhol ko'rinadi, kurs sahifasi ochilganda esa rasmlar fonda oldindan yuklab qo'yiladi. Rasmi bo'lmagan darsda avvalgidek videoning o'zidan kadr olinadi (sekinroq).
Yangi dars videosini R2'ga yuklab, darsga ulagach (Mac'da, terminalda):
1. `npx tsx --env-file=.env scripts/make-thumbs.ts` — yangi darslar uchun `public/thumbs/<darsId>.jpg` tayyorlaydi (bazaga tegmaydi; videoni to'liq yuklamaydi).
2. `git add public/thumbs && git commit -m "Dars rasmlari" && git push` — rasmlar saytga chiqadi (deploy tugashini kuting).
3. `npx tsx --env-file=.env scripts/make-thumbs.ts --link` — rasmi bor darslarga baza'da manzilni yozadi.
Terminalsiz: Admin → dars → **Kartochka rasmi** maydoniga rasmni kompyuterdan yuklash yoki havola yozish ham mumkin.

## O'quvchi paroli, ko'p kurs, reyting
- **Parolni ko'rish (faqat admin).** Admin → O'quvchilar → «Parol» ustunida **Ko'rsatish**: parol bosilganda serverdan olinadi va 30 soniyadan keyin yana yashiriladi. Platforma yaratgan parollar (yangi o'quvchi, «Yangi parol», kurator o'rnatgani) AES-256-GCM bilan shifrlab saqlanadi (kalit `AUTH_SECRET`dan olinadi, bazaning o'zida kalit yo'q). O'quvchi parolni **o'zi o'zgartirsa**, saqlangan nusxa o'chadi (uning shaxsiy paroli boshqa saytlarda ham bo'lishi mumkin), eski akkauntlarda ham parol yo'q — «Yangi parol» tugmasi bilan yangisi yaratiladi va ko'rinadi.
- **Bir nechta kurs.** «O'quvchi qo'shish» formasida kurslar belgilash qutichalari (soni cheklanmagan), har biri uchun alohida summa va to'lov yozuvi. Ro'yxatdagi o'quvchida kurs belgilari yonida **+ kurs** — qo'shimcha kurs ochadi (eskilari qoladi; ⇄ esa almashtiradi).
- **Telefon raqam.** «O'quvchi qo'shish» formasida ixtiyoriy maydon ("90 123 45 67", "+998 (90) 123-45-67" — qanday yozilsa ham `+998901234567` ko'rinishiga keltiriladi; boshqa davlat raqami `+` bilan). O'quvchilar ro'yxatida email ostida ko'rinadi va ✎ bilan o'zgartiriladi (bo'sh qoldirsangiz o'chadi). Raqamni faqat admin ko'radi: kurator, o'quvchi va ochiq sahifalarda umuman chiqmaydi.
- **Kurs ajratilishi.** O'quvchi faqat o'zi yozilgan kurslarni ko'radi (katalog, kabinet, darslar, postlar, chat, «Oxirgi ko'rgan video»); kursdan chiqarilgan/almashtirilgan o'quvchiga eski kursning videosi ko'rinmaydi. Reyting ham faqat shu kurs o'quvchilaridan tuziladi.
- **Reyting (Leader board)** kurs sahifasi pastida: eng yaxshi 10 + o'quvchining o'z o'rni; boshqalarga faqat «Ism F.» ko'rinadi (admin to'liq ismni ko'radi). Ballar: dars ko'rib tugatilsa +100 (video ≥80% haqiqiy ijro), tugamagan dars ko'rgan ulushiga qarab ≤60, modul tugatilsa +150, kurs tugatilsa +500, ketma-ket faol kunlar har kun +15 (≤150). «Shu hafta» — oxirgi 7 kunda tugatilgan dars (+100) va faol kun (+20). Teng ballda oldin yetgan yuqori. Qoidalar `src/lib/leaderboard.ts` da (`POINTS`).

## Postlar
Menyuda **Kabinet**dan keyin **Postlar**: kurator o'z kursi uchun e'lon/yangilik yozadi, o'quvchi faqat o'qiydi (yoza olmaydi). Har bir post **faqat o'z kursida** ko'rinadi: masalan, LOR kuratorining posti marketing kursi o'quvchisiga chiqmaydi. Kurator postni `/curator/posts` sahifasida yozadi (faqat o'ziga biriktirilgan kurslarga) va faqat o'zinikini o'chira oladi. O'quvchi bir nechta kursga yozilgan bo'lsa, postlarni kurs bo'yicha saralaydi.

## Ish tartibi
1. Mijoz Telegramda kelishadi va kartaga to'laydi (skrinshot yuboradi).
2. Admin: **O'quvchilar → O'quvchi qo'shish** — email, kurs, summa. Yangi o'quvchiga akkaunt ochiladi, tayyor parol yaratilib emailga yuboriladi; u email va shu parol bilan to'g'ridan-to'g'ri kiradi (keyin «Parol» bo'limida o'zgartiradi). Parol panelda ham ko'rinadi (xat ketmasa Telegramda yuborasiz).
3. O'quvchini kursdan **chiqarish**: Admin → O'quvchilar → kurs belgisi yonidagi **×** (tasdiq so'raladi). Kursga kirish yopiladi va kurator ro'yxatidan tushadi; akkaunt, to'lov yozuvi va natijalari saqlanadi. Kursga qayta qo'shsangiz (O'quvchi qo'shish), ko'rish tarixi qaytadi.
3a. O'quvchilar ro'yxati **kurs bo'yicha guruhlangan**: kurs nomi (va nechta kishi ekani) ko'rinib turadi, bosilganda o'sha kursning o'quvchilari ochiladi. Bir nechta kursga yozilgan foydalanuvchi har bir kursning ro'yxatida chiqadi, kursi yo'qlar «Kursi yo'q» guruhida. Qidiruv/filtr ishlatilsa, mos guruhlar o'zi ochiladi.
3b. O'quvchining kursini **almashtirish**: kurs belgisi yonidagi **⇄** → yangi kursni tanlang → «Almashtirish». Eski kursdan chiqadi, yangisiga yoziladi (to'lov yozuvlari o'zgarmaydi).
4. O'quvchi akkauntini **butunlay o'chirish**: O'quvchilar jadvalida qatordagi **O'chirish** (faqat o'quvchi, tasdiq bilan; ortga qaytmaydi). Kirish, kurslar, ko'rish natijalari, kirgan kunlar va chat yozuvlari o'chadi. To'lov yozuvlari saqlanadi (ularda o'quvchining ismi va emaili nusxasi qoladi), shuning uchun daromad hisobotlari buzilmaydi.
3. O'quvchi kirib faqat o'zi yozilgan kursni ko'radi: Kurslar sahifasida boshqa kurslar chiqmaydi, ularning havolasi ochilmaydi (404). Mehmon (kirmagan) esa e'lon qilingan kurslar katalogini ko'radi.

## Mualliflar
- **Mualliflar** — kurs egalari (siz, mijozlaringiz). Kursga muallif biriktiriladi; dashboard va to'lovlarda muallif bo'yicha hisobot va filtr bor.
- Hamma kurslar bitta neytral palitrada (grafit + oltin): kursga alohida logotip yoki rang berilmaydi.

## Xavfsizlik
- Video va dars matni faqat kabinetda, faqat kursga yozilgan (yoki admin) foydalanuvchiga serverdan chiqadi. Sotuv sahifasida faqat nomlar.
- **Kinescope'da domen cheklovi**: Kinescope → loyiha sozlamalari → Xavfsizlik (Domain restriction) → `ilmaviya.vercel.app` ni qo'shing. Busiz embed havolasini istalgan saytga qo'yib ko'rsatish mumkin.
- Kirishda urinishlar chegarasi (5 xato → 15 daqiqa kutish). Parol o'zgarsa yoki tiklansa, boshqa qurilmalardagi sessiyalar yopiladi.
- Vercel'da **AUTH_SECRET** albatta sozlang; admin dashboardda sozlanmagan narsalar ko'rsatiladi.
- **Videolarni yopish (R2) — eng muhimi.** R2 ning ochiq manzili (`pub-….r2.dev`) bilan turgan video fayllarni nomini bilgan har kim kirmasdan yuklab olishi mumkin. Yopiq shaklda (`r2:nom.mp4`) video faqat kursga yozilgan o'quvchiga, 4 soat yaroqli imzolangan havola bilan beriladi. O'tkazish tartibi:
  1. Cloudflare → R2 → **Manage API tokens** → token (Object Read & Write, faqat shu bucket). Kalitlarni `.env` va Vercel → Environment Variables ga yozing: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
  2. R2 bucket → Settings → **CORS Policy**: ruxsat etilgan manzil `https://ilmaviya.vercel.app`, usul `GET, HEAD`, sarlavhalar `Range`.
  3. `npx tsx --env-file=.env scripts/privatize-videos.ts` (ko'rib chiqish), keyin `--apply` — darslar `r2:` shaklga o'tadi (fayli topilmaganlari o'zgarmaydi).
  4. Saytda videolar ochilishini tekshiring, so'ng bucket → Settings → **Public access (r2.dev) → Disable**. Shundan keyin ochiq havolalar ishlamaydi.
- Sessiya: admin va kurator — 7 kun, o'quvchi — 30 kun. Parol xeshi bcrypt (narx 12), parol 8–72 belgi, juda oddiy parollar rad etiladi, joriy parolni terib topishga urinish ham cheklangan. Sarlavhalar: CSP (faqat o'zimizning manzil, Kinescope, R2, YouTube), HSTS, clickjacking himoyasi; `/admin`, `/cabinet`, `/curator` hech qayerda keshlanmaydi va qidiruvda chiqmaydi.
- GitHub repo **Private** bo'lsin (Settings → General → Danger Zone → Change visibility): kod ochiq turishi hujumchiga yo'l ko'rsatadi.
- Demo kursga namuna modul/darslarni yuklash: `npx tsx prisma/import-demo.ts` (o'quvchisi bo'lgan kursga tegmaydi).

- **Progress avtomatik:** Kinescope videosi oxirigacha ko'rilsa (≥80% haqiqiy ijro; surib o'tkazish sanalmaydi) dars "ko'rildi" bo'ladi. Qo'lda «Darsni tugatdim» tugmasi yo'q: dars faqat video ko'rilganda tugaydi (Kinescope yoki o'z videosi).

## Kirish qoidalari
- Tarif yo'q: kursga yozilgan o'quvchi kursning hamma darsini ko'radi.
- Darsga **ochilish vaqti** qo'yish mumkin (zapusk uchun).
- Kursda «narx» faqat admin formasidagi summani avtomatik to'ldirish uchun; saytda ko'rinmaydi.

## Baza va deploy (Vercel + Neon)
Baza — PostgreSQL (Neon). SQLite Vercel'da ishlamaydi.

1. Vercel → loyiha → **Storage** → **Create Database** → **Neon** → loyihaga ulang (`DATABASE_URL`, `DATABASE_URL_UNPOOLED` avtomatik qo'shiladi).
2. Vercel → **Settings → Environment Variables**: `AUTH_SECRET` (`openssl rand -hex 32`); xat yuborish uchun `SMTP_*` (`.env.example` ga qarang).
3. Lokal `.env` ga ham shu `DATABASE_URL` va `DATABASE_URL_UNPOOLED` ni yozing, keyin: `npm run db:push && npm run db:seed`.
4. Vercel'da **Redeploy**.
