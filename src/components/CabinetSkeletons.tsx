// Kabinet sahifalari yuklanayotganda bir zumda chiqadigan qoliplar (loading.tsx). Har biri o'z sahifasining
// tuzilishini takrorlaydi, shuning uchun blok bosilgan zahoti "ichiga kirildi" deb seziladi, kontent kelgach joyi siljimaydi.

function CardSkeleton({ i }: { i: number }) {
  return (
    <div className="glass overflow-hidden">
      <div className="skeleton aspect-video rounded-none" style={{ animationDelay: `${i * 120}ms` }} />
      <div className="space-y-3 p-5">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

function Grid({ count }: { count: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} i={i} />
      ))}
    </div>
  );
}

// Kurs sahifasi: sarlavha, progress, "Davom etish" tugmasi, modullar
export function CourseSkeleton() {
  return (
    <div className="zoom-in" aria-busy aria-label="Yuklanmoqda">
      <div className="skeleton h-4 w-20" />
      <div className="mt-5 max-w-3xl space-y-4">
        <div className="skeleton h-9 w-2/3" />
        <div className="skeleton h-5 w-1/2" />
        <div className="skeleton mt-2 h-2 w-full rounded-full" />
        <div className="skeleton h-11 w-64 rounded-xl" />
      </div>
      <div className="mt-8">
        <Grid count={3} />
      </div>
    </div>
  );
}

// Modul sahifasi: modul raqami, nomi, video darslar
export function ModuleSkeleton() {
  return (
    <div className="zoom-in" aria-busy aria-label="Yuklanmoqda">
      <div className="skeleton h-4 w-32" />
      <div className="mt-5 space-y-3">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-9 w-2/3" />
        <div className="skeleton mt-6 h-4 w-44" />
      </div>
      <div className="mt-5">
        <Grid count={3} />
      </div>
    </div>
  );
}

// Dars sahifasi: sarlavha, video, Oldingi/Keyingi tugmalari, yonida moduldagi darslar
export function LessonSkeleton() {
  return (
    <div className="zoom-in" aria-busy aria-label="Yuklanmoqda">
      <div className="skeleton h-4 w-32" />
      <div className="mt-5 space-y-3">
        <div className="skeleton h-4 w-44" />
        <div className="skeleton h-9 w-3/4" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {/* Video joyi: qora fon, o'rtada oltin doira — pleyer shu yerda ochiladi */}
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
            <div className="skeleton h-14 w-14 rounded-full" />
          </div>
          <div className="flex justify-between gap-3">
            <div className="skeleton h-10 w-36 rounded-xl" />
            <div className="skeleton h-10 w-36 rounded-xl" />
          </div>
        </div>
        <div className="glass h-fit space-y-3 p-4">
          <div className="skeleton h-4 w-40" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-1 py-1.5">
              <div className="skeleton h-6 w-6 shrink-0 rounded-full" />
              <div className="skeleton h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
