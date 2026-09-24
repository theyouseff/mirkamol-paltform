// Sahifa yuklanayotganda darhol ko'rinadigan qolip — bosgan zahoti javob sezilsin.
export function PageSkeleton() {
  return (
    <div className="page-in mx-auto max-w-6xl animate-pulse space-y-4 px-4 py-10" aria-hidden>
      <div className="h-8 w-56 rounded-lg bg-zinc-200" />
      <div className="h-4 w-80 max-w-full rounded bg-zinc-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-44 rounded-2xl bg-zinc-200" />
        <div className="h-44 rounded-2xl bg-zinc-200" />
        <div className="hidden h-44 rounded-2xl bg-zinc-200 lg:block" />
      </div>
    </div>
  );
}
