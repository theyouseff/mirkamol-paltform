-- O'quvchining telefon raqami (ixtiyoriy; faqat admin ko'radi): bo'sh qiymat bilan qo'shiladi (expand; eski kodga ta'sir qilmaydi).
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
