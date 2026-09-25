// Kurator kelmagan kunga qo'yadigan holatlar (brauzer va serverda umumiy)
export const DAY_STATUSES = [
  { value: "SEEN", label: "Dars ko'rdi", short: "Ko'rgan" },
  { value: "NOT_SEEN", label: "Dars ko'rmadi", short: "Ko'rmagan" },
  { value: "EXCUSED", label: "Sababli", short: "Sababli" },
] as const;

export type DayStatus = (typeof DAY_STATUSES)[number]["value"];

export type DayNote = { day: string; status: DayStatus; reason: string; author: string };

export const isDayStatus = (v: string): v is DayStatus => DAY_STATUSES.some((s) => s.value === v);
