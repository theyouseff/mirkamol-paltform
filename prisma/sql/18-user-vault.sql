-- Platforma yaratgan parol (yangi o'quvchi, "Yangi parol", kurator o'rnatgani): shifrlangan nusxasi — admin ko'ra olishi uchun (expand; eski kodga ta'sir qilmaydi).
-- O'quvchi parolni o'zi o'zgartirsa, bu ustun bo'shatiladi.
ALTER TABLE "User" ADD COLUMN "vaultPassword" TEXT;
