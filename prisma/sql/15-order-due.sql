-- Kutilmoqda to'lov uchun muddat va eslatma belgisi (expand: yangi ustunlar, eski kodga ta'sir qilmaydi).
ALTER TABLE "Order" ADD COLUMN "dueDay" TEXT, ADD COLUMN "reminderSentAt" TIMESTAMP(3);
