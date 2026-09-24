// Namuna (imitatsiya) modullar va video darslar. Keyinroq kursning haqiqiy modul/darslariga ulanadi.
export type DemoLesson = { title: string; duration: string };
export type DemoModule = { slug: string; title: string; description: string; lessons: DemoLesson[] };

export const DEMO_MODULES: DemoModule[] = [
  {
    slug: "tanishuv",
    title: "Tanishuv moduli",
    description: "Kurs, LOR yo'nalishi va asosiy tushunchalar bilan tanishuv",
    lessons: [
      { title: "Kursga xush kelibsiz", duration: "06:20" },
      { title: "LOR yo'nalishi: quloq, burun, tomoq", duration: "12:40" },
      { title: "Anatomiya asoslari", duration: "18:05" },
      { title: "Asosiy asbob-uskunalar bilan tanishuv", duration: "09:30" },
      { title: "Bemor bilan birinchi uchrashuv", duration: "14:10" },
    ],
  },
  {
    slug: "amaliyot",
    title: "Amaliyot",
    description: "Ko'rik texnikasi va klinik holatlar bilan amaliy mashqlar",
    lessons: [
      { title: "Otoskopiya texnikasi", duration: "18:05" },
      { title: "Rinoskopiya texnikasi", duration: "16:45" },
      { title: "Farengoskopiya va laringoskopiya", duration: "20:30" },
      { title: "Bemor bilan suhbat va anamnez", duration: "09:30" },
      { title: "Klinik holatlar: bosqichma-bosqich", duration: "24:15" },
    ],
  },
  {
    slug: "yakuniy",
    title: "Yakuniy",
    description: "Bilimlarni mustahkamlash, xatolar tahlili va xulosa",
    lessons: [
      { title: "Eng ko'p uchraydigan kasalliklar", duration: "24:15" },
      { title: "Xatolar tahlili", duration: "15:20" },
      { title: "Klinik amaliyot: real holatlar tahlili", duration: "21:50" },
      { title: "Yakuniy test tahlili", duration: "12:00" },
      { title: "Keyingi qadamlar va karyera", duration: "10:40" },
    ],
  },
];

export function findDemoModule(slug: string) {
  const index = DEMO_MODULES.findIndex((m) => m.slug === slug);
  return index === -1 ? null : { module: DEMO_MODULES[index], number: index + 1 };
}
