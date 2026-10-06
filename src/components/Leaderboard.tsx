import Link from "next/link";
import { loadBoard, POINTS, shortName, type BoardRow, type Period } from "@/lib/leaderboard";

const TOP = 10;

const MEDAL: Record<number, string> = {
  1: "from-[#f8d27a] to-[#c9962a] text-[#2a1d05]",
  2: "from-[#eef1f6] to-[#9aa5b4] text-[#1c2430]",
  3: "from-[#f3bd8a] to-[#a8641f] text-[#2a1503]",
};

const initials = (name: string) => shortName(name).split(" ").map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);

function Row({ r, me, name }: { r: BoardRow; me: boolean; name: string }) {
  const medal = MEDAL[r.rank];
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 sm:gap-4 sm:px-4 ${
        me ? "border-gold/60 bg-gradient-to-r from-gold/25 to-gold/5 shadow-[0_0_24px_-10px_rgba(212,175,55,0.6)]" : r.rank <= 3 ? "border-gold/25 bg-white/[0.06]" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${medal ? `bg-gradient-to-b ${medal} shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]` : "bg-white/10 text-gold-text/80"}`}>{r.rank}</span>
      <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-ink-950/60 text-xs font-semibold text-gold-text sm:flex" aria-hidden>{initials(name)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gold-text">
          {name}
          {me && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 align-middle text-[11px] font-bold text-ink-950">Siz</span>}
        </p>
        <p className="truncate text-xs text-gold-text/60">
          {r.lessonsDone} dars tugatgan{r.streak >= 2 && <span className="ml-2 text-gold-text/80">🔥 {r.streak} kun ketma-ket</span>}
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold tabular-nums text-gold-text">{r.points.toLocaleString("ru-RU")}</p>
        <p className="-mt-0.5 text-[11px] uppercase tracking-wider text-gold-text/50">ball</p>
      </div>
    </li>
  );
}

// Kurs ichidagi reyting: eng yaxshi 10 o'quvchi + (agar 10 talikda bo'lmasa) o'zining o'rni. Boshqa o'quvchilarga faqat "Ism F." ko'rinadi.
// Admin to'liq ismni ko'radi. Davr: "Umumiy" yoki "Shu hafta" (haftalik poyga har dushanba boshidan emas, oxirgi 7 kun bo'yicha).
export async function Leaderboard({ courseId, viewerId, viewerIsAdmin, period }: { courseId: string; viewerId: string; viewerIsAdmin: boolean; period: Period }) {
  const board = await loadBoard(courseId, period);
  const top = board.rows.slice(0, TOP);
  const mine = board.rows.find((r) => r.userId === viewerId) ?? null;
  const mineOutside = mine && mine.rank > TOP ? mine : null;
  const ahead = mine && mine.rank > 1 ? board.rows[mine.rank - 2] : null;
  const gap = mine && ahead ? Math.max(1, ahead.points - mine.points + 1) : null;
  const display = (userId: string, name: string) => (viewerIsAdmin ? name : userId === viewerId ? name : shortName(name));
  const nameOf = new Map(board.rows.map((r) => [r.userId, r.name]));

  const tab = (p: Period, label: string) => (
    <Link
      href={p === "all" ? "?#reyting" : "?lb=week#reyting"}
      scroll={false}
      className={`rounded-xl border px-4 py-2 text-sm font-medium transition active:scale-95 ${period === p ? "border-gold/50 bg-gradient-to-r from-gold/25 to-transparent text-gold-text shadow-[inset_3px_0_0_#c9a227]" : "border-white/10 bg-white/5 text-gold-text/75 hover:bg-white/10"}`}
    >
      {label}
    </Link>
  );

  return (
    <section id="reyting" className="mt-12 scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gold-text">Reyting</h2>
          <p className="mt-1 text-sm text-gold-text/65">
            Kursni ketma-ket va to&apos;liq o&apos;tayotganlar oldinda · {board.participants} o&apos;quvchi
          </p>
        </div>
        <div className="flex gap-2">
          {tab("all", "Umumiy")}
          {tab("week", "Shu hafta")}
        </div>
      </div>

      {top.length === 0 ? (
        <div className="glass p-6 text-center text-gold-text/75">
          {period === "week" ? "Bu hafta hali hech kim ball olmadi — birinchi bo'ling!" : "Reyting hali boshlanmadi. Birinchi darsni ko'rib, oldingi o'rinni egallang!"}
        </div>
      ) : (
        <ol className="space-y-2">
          {top.map((r) => (
            <Row key={r.userId} r={r} me={r.userId === viewerId} name={display(r.userId, nameOf.get(r.userId) ?? "")} />
          ))}
          {mineOutside && (
            <>
              <li aria-hidden className="py-0.5 text-center text-gold-text/40">⋯</li>
              <Row r={mineOutside} me name={display(viewerId, nameOf.get(viewerId) ?? "")} />
            </>
          )}
        </ol>
      )}

      {mine && gap && <p className="text-sm text-gold-text/80">Keyingi o&apos;ringacha <b className="text-gold-text">{gap}</b> ball qoldi — bitta dars yetadi!</p>}
      {!mine && !viewerIsAdmin && top.length > 0 && <p className="text-sm text-gold-text/80">Siz hali reytingda yo&apos;qsiz: darsni ko&apos;rib, ball to&apos;plashni boshlang.</p>}

      <details className="glass group px-4 py-3 text-sm text-gold-text/85">
        <summary className="cursor-pointer list-none font-medium text-gold-text">Ballar qanday hisoblanadi? <span className="text-gold-text/50 transition group-open:rotate-180">▾</span></summary>
        <ul className="mt-3 space-y-1.5 text-gold-text/80">
          <li>• Darsni ko&apos;rib tugatsangiz: <b>+{POINTS.lesson}</b> (video kamida 80% haqiqatan ijro etilsa; surib o&apos;tkazish hisoblanmaydi)</li>
          <li>• Dars tugamagan bo&apos;lsa, ko&apos;rgan qismingiz uchun <b>{POINTS.partialMax}</b> ballgacha</li>
          <li>• Moduldagi hamma darsni tugatsangiz: <b>+{POINTS.module}</b></li>
          <li>• Kursdagi hamma darsni tugatsangiz: <b>+{POINTS.course}</b></li>
          <li>• Har kun kirib ketma-ket o&apos;qisangiz: har kun <b>+{POINTS.streakPerDay}</b> (10 kungacha, eng ko&apos;pi {POINTS.streakMax})</li>
          <li>• «Shu hafta» — oxirgi 7 kunda tugatgan darsingiz (<b>{POINTS.weekLesson}</b>) va faol kuningiz (<b>{POINTS.weekDay}</b>) bo&apos;yicha</li>
          <li>• Ball teng bo&apos;lsa, o&apos;sha ballga oldin yetgan o&apos;quvchi yuqori turadi</li>
        </ul>
      </details>
    </section>
  );
}
