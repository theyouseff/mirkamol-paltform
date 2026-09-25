// Akkaunt o'chirilgan bo'lsa ham to'lov yozuvida saqlangan ism/email ko'rsatiladi
export const buyer = (o: { user: { name: string; email: string } | null; buyerName: string; buyerEmail: string }) =>
  o.user ? { name: o.user.name, email: o.user.email } : { name: `${o.buyerName || "—"} (akkaunt o'chirilgan)`, email: o.buyerEmail };
