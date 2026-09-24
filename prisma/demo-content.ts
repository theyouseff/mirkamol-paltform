// Namuna modullar va video darslar: yangi bazani to'ldirish (seed) va demo kursni yangilash (import-demo) uchun.
// Saytning o'zi bu faylni ishlatmaydi — hamma narsa bazadan o'qiladi.
export type DemoLesson = {
  title: string;
  duration: string;
  description: string;
  points: string[]; // "Bu darsda" ro'yxati
  videoUrl?: string; // YouTube/Kinescope havolasi
};
export type DemoModule = { slug: string; title: string; description: string; lessons: DemoLesson[] };

export const DEMO_MODULES: DemoModule[] = [
  {
    slug: "tanishuv",
    title: "Tanishuv moduli",
    description: "Kurs, LOR yo'nalishi va asosiy tushunchalar bilan tanishuv",
    lessons: [
      {
        title: "Kursga xush kelibsiz",
        duration: "06:20",
        videoUrl: "https://kinescope.io/embed/vVtjrxph9JN5x6XyrH2fgh",
        description: "Kurs qanday tuzilgani, darslar ketma-ketligi va o'qish rejasi bilan tanishasiz. Har bir modulda nimalar kutayotganini va natijaga qanday erishishni bilib olasiz.",
        points: ["Kurs tuzilmasi va o'qish rejasi", "Darslarni qanday ko'rish kerak", "Natijaga erishish uchun tavsiyalar"],
      },
      {
        title: "LOR yo'nalishi: quloq, burun, tomoq",
        duration: "12:40",
        description: "Otorinolaringologiya (LOR) yo'nalishining asosiy bo'limlari va ularning o'zaro bog'liqligi. Quloq, burun va tomoq kasalliklari bir-biri bilan qanday bog'langanini tushunib olasiz.",
        points: ["LOR yo'nalishining bo'limlari", "Organlarning o'zaro bog'liqligi", "Amaliyotda uchraydigan asosiy holatlar"],
      },
      {
        title: "Anatomiya asoslari",
        duration: "18:05",
        description: "Klinik ish uchun zarur bo'lgan quloq, burun va tomoq anatomiyasining asosiy qismlari. Ko'rik paytida e'tibor beriladigan nuqtalar bilan tanishasiz.",
        points: ["Quloq tuzilishi", "Burun va burun bo'shlig'i", "Halqum va hiqildoq"],
      },
      {
        title: "Asosiy asbob-uskunalar bilan tanishuv",
        duration: "09:30",
        description: "LOR shifokorining kundalik ishida ishlatiladigan asosiy asboblar, ularni tayyorlash va to'g'ri ushlash qoidalari.",
        points: ["Otoskop va rinoskop", "Reflektor va yoritgichlar", "Asboblarni tayyorlash va tozalash"],
      },
      {
        title: "Bemor bilan birinchi uchrashuv",
        duration: "14:10",
        description: "Birinchi qabulda bemor bilan qanday muloqot qilish, ishonch o'rnatish va ko'rikka tayyorlash bo'yicha amaliy maslahatlar.",
        points: ["Salomlashish va ishonch", "Shikoyatlarni aniqlash", "Ko'rikka tayyorlash"],
      },
    ],
  },
  {
    slug: "amaliyot",
    title: "Amaliyot",
    description: "Ko'rik texnikasi va klinik holatlar bilan amaliy mashqlar",
    lessons: [
      {
        title: "Otoskopiya texnikasi",
        duration: "18:05",
        description: "Quloq ko'rigi (otoskopiya) texnikasi: asbobni to'g'ri ushlash, quloq yo'lini to'g'rilash va nog'ora pardani baholash.",
        points: ["Asbobni to'g'ri ushlash", "Quloq yo'lini to'g'rilash", "Nog'ora pardani baholash"],
      },
      {
        title: "Rinoskopiya texnikasi",
        duration: "16:45",
        description: "Burun bo'shlig'i ko'rigi: oldingi rinoskopiya bosqichlari va ko'rik paytida e'tibor beriladigan belgilar.",
        points: ["Bemorning to'g'ri holati", "Oldingi rinoskopiya bosqichlari", "Shilliq qavat holatini baholash"],
      },
      {
        title: "Farengoskopiya va laringoskopiya",
        duration: "20:30",
        description: "Tomoq va hiqildoq ko'rigi: shpatel va oyna bilan ishlash, ko'p uchraydigan xatolar va ularning oldini olish.",
        points: ["Farengoskopiya", "Oyna bilan laringoskopiya", "Ko'p uchraydigan xatolar"],
      },
      {
        title: "Bemor bilan suhbat va anamnez",
        duration: "09:30",
        description: "Anamnez yig'ishning tuzilgan tartibi: qaysi savollar, qanday ketma-ketlikda berilishi va javoblarni qanday yozib borish.",
        points: ["Asosiy savollar", "Anamnez tuzilmasi", "Yozuvlarni yuritish"],
      },
      {
        title: "Klinik holatlar: bosqichma-bosqich",
        duration: "24:15",
        description: "Real holatlar asosida ko'rikdan tashxis qo'yishgacha bo'lgan yo'lni bosqichma-bosqich ko'rib chiqamiz.",
        points: ["Holatni tahlil qilish", "Differensial fikrlash", "Yakuniy xulosa"],
      },
    ],
  },
  {
    slug: "yakuniy",
    title: "Yakuniy",
    description: "Bilimlarni mustahkamlash, xatolar tahlili va xulosa",
    lessons: [
      {
        title: "Eng ko'p uchraydigan kasalliklar",
        duration: "24:15",
        description: "LOR amaliyotida eng ko'p uchraydigan kasalliklar, ularning belgilari va dastlabki yondashuv.",
        points: ["Otitlar", "Rinit va sinusitlar", "Tonzillit va faringit"],
      },
      {
        title: "Xatolar tahlili",
        duration: "15:20",
        description: "Boshlovchi shifokorlar ko'p yo'l qo'yadigan xatolar va ularni qanday oldini olish mumkinligi.",
        points: ["Ko'rikdagi xatolar", "Muloqotdagi xatolar", "Xatolarning oldini olish"],
      },
      {
        title: "Klinik amaliyot: real holatlar tahlili",
        duration: "21:50",
        description: "Real klinik holatlarni birgalikda tahlil qilamiz: shikoyatlardan boshlab davolash rejasigacha.",
        points: ["Holatlarni tanlash", "Tahlil bosqichlari", "Davolash rejasi"],
      },
      {
        title: "Yakuniy test tahlili",
        duration: "12:00",
        description: "Yakuniy test savollari va ularning tahlili. O'z bilimingizni tekshirib, zaif joylarni aniqlaysiz.",
        points: ["Test savollari", "To'g'ri javoblar izohi", "Zaif joylarni aniqlash"],
      },
      {
        title: "Keyingi qadamlar va karyera",
        duration: "10:40",
        description: "Kursdan keyin nima qilish kerakligi: amaliyotni davom ettirish, mutaxassislik tanlash va rivojlanish yo'llari.",
        points: ["Amaliyotni davom ettirish", "Mutaxassislik tanlash", "Rivojlanish yo'llari"],
      },
    ],
  },
];

// Dars matni: tavsif, keyin "Bu darsda:" ro'yxati ("- " bilan). LessonContent shu formatni chiroyli ko'rsatadi.
export function lessonContent(l: DemoLesson) {
  return `${l.description}\n\nBu darsda:\n${l.points.map((p) => `- ${p}`).join("\n")}`;
}
