// Kirgandan keyin foydalanuvchi qaysi oynaga tushadi (middleware'da ham ishlaydi — Prisma'siz).
export const homeFor = (role: string) => (role === "ADMIN" ? "/admin" : role === "CURATOR" ? "/curator" : "/courses");

export const isStaff = (role: string) => role === "ADMIN" || role === "CURATOR";
