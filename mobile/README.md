# ilmaviya — mobil ilova (Android + iOS)

Ilova **ilmaviya.vercel.app** saytini ochadi (Capacitor 8). Baza, akkauntlar, kurslar — hammasi sayt bilan bir xil;
saytga qo'shilgan har bir o'zgarish ilovada ham darhol ko'rinadi (do'konga qayta yuklash shart emas).
Ilovani qayta yuklash faqat **native** qism o'zgarganda kerak: ikonka, nom, ruxsatlar, himoya kodi, Capacitor versiyasi.

| | |
|---|---|
| Nomi | `ilmaviya` |
| ID (Android applicationId / iOS Bundle ID) | `ilmaviya.app` — o'zgartirib bo'lmaydi |
| Versiya | 1.0 (Android `versionCode 1`) |

## Ilovada saytdan farqi
- **Ekranni yozib olishdan himoya:** Androidda skrinshot va ekran yozuvi butunlay bloklanadi (`MainActivity.java`, FLAG_SECURE);
  iPhone'da ekran yozilayotganda ilova qora parda bilan yopiladi (`AppDelegate.swift`).
- **Sotuv yo'q** (App Store qoidasi): kirmagan foydalanuvchi kurslar katalogini ko'rmaydi (kirish oynasiga o'tadi), «Kursga yozilish»
  va «Akkauntingiz yo'qmi? Adminga yozish» ko'rinmaydi. Sayt ilovani User-Agent'dagi `IlmaviyaApp` belgisidan taniydi (`src/lib/app-mode.ts`).
- Telegram va boshqa tashqi havolalar tizim brauzerida ochiladi; check-list PDF — 5 daqiqalik imzolangan havola bilan (`src/components/AppBridge.tsx`).
- Internet bo'lmasa — `www/offline.html`. Analitikada ilova qurilmasi «iPhone · ilova» ko'rinishida chiqadi.

## Kerakli dasturlar (bir marta)
- **Android:** [Android Studio](https://developer.android.com/studio) (ichida Java va Android SDK bor).
- **iOS:** Mac App Store'dan **Xcode** (keyin bir marta ochib, qo'shimcha komponentlarni o'rnating; `sudo xcode-select -s /Applications/Xcode.app`).
- Terminalda shu papkada: `npm install` (keyin node_modules'ni iCloud'dan himoyalash: `mv node_modules node_modules.nosync && ln -s node_modules.nosync node_modules`).

## Android — Play Market uchun fayl (.aab)
1. `npm run android` — Android Studio'da loyiha ochiladi (birinchi marta Gradle yuklab olinadi, bir necha daqiqa).
2. Sinash: telefonni USB bilan ulang (Sozlamalar → Dasturchi rejimi → USB debugging) yoki emulyator → ▶ Run.
3. Do'kon uchun: **Build → Generate Signed App Bundle / APK → Android App Bundle** → **Create new keystore**.
   ⚠️ Keystore fayli va parolini xavfsiz joyda saqlang (masalan, 2 nusxa: kompyuter + flesh). Uni yo'qotsangiz, ilovani **yangilab bo'lmaydi**.
   Play Console'da «Play App Signing» yoqiladi — bu holda keystore faqat yuklash kaliti bo'ladi.
4. Natija: `android/app/release/app-release.aab` → Play Console → ilova → Testing / Production → Create release → shu faylni yuklang.

## iOS — App Store uchun
1. `npm run ios` — Xcode'da loyiha ochiladi.
2. Chapda **App** → **Signing & Capabilities** → Team: Apple Developer akkauntingiz (Automatically manage signing ✓).
3. Sinash: iPhone'ni ulang yoki simulyator tanlab ▶ Run.
4. Do'kon uchun: yuqorida qurilma o'rniga **Any iOS Device (arm64)** → **Product → Archive** → Organizer → **Distribute App → App Store Connect → Upload**.
5. App Store Connect'da (appstoreconnect.apple.com) yangi ilova: nomi `ilmaviya`, Bundle ID `ilmaviya.app`, keyin yuklangan build'ni tanlab tekshiruvga yuborasiz.

## Do'kon uchun kerak bo'ladigan ma'lumotlar
- **Maxfiylik siyosati:** https://ilmaviya.vercel.app/privacy
- **Akkauntni o'chirish (Google Play):** https://ilmaviya.vercel.app/privacy#ochirish
- **Tekshiruvchi uchun sinov akkaunti** (ikkala do'kon ham so'raydi: ilovaga faqat kirib ishlatiladi): adminda bitta kursga yozilgan sinov o'quvchisi oching
  va uning email/parolini «App Review / App access» bo'limiga yozing. ⚠️ Qurilmalar limiti: tekshiruvchilar ko'p qurilmadan kirishi mumkin —
  shu akkauntni Analitikada kuzatib, kerak bo'lsa «Hammasidan chiqarish» qiling.
- **Ma'lumotlar xavfsizligi (Data safety / App Privacy):** to'planadi — ism, email, telefon, foydalanuvchi ID, ilova faolligi (darslar progressi),
  qurilma/IP; maqsad — ilova ishlashi va akkaunt xavfsizligi; reklama va kuzatuv yo'q; uchinchi tomonga sotilmaydi; shifrlangan uzatish (HTTPS).
- **Kontent reytingi:** ta'lim, zo'ravonlik/reklama yo'q.
- **Skrinshotlar:** telefon (Android — kamida 2 ta; iPhone 6.9" — 1320×2868 kabi o'lchamlarda).

## Ikonka va ochilish ekrani
Manba rasmlar `assets/` da (olovli «i», to'q fon `#151922`). O'zgartirgach: `npm run assets && npx cap sync`.
Hozirgi ikonka saytdagi 512 px logotipdan yasalgan; aniqroq bo'lishi uchun logotipning 1024 px yoki kattaroq asl faylini `assets/` ga qo'yib qayta yarating.

## Yangi versiya chiqarish (native qism o'zgarganda)
- Android: `android/app/build.gradle` → `versionCode` ni 1 ga oshiring, `versionName` ni yangilang.
- iOS: Xcode → App → General → Version / Build.
- Keyin `npx cap sync` va yuqoridagi yig'ish qadamlari.
