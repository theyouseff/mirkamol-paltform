import { redirect } from "next/navigation";

// Alohida kabinet bosh sahifasi yo'q: o'quvchi kurslarini "Kurslar" sahifasidan ochadi.
export default function CabinetPage() {
  redirect("/courses");
}
