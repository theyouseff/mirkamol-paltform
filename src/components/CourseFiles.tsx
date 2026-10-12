// Kursning qo'shimcha materiallari bloki («Check - listlar»): modul kartochkasi uslubida, ichida PDF fayllar ro'yxati.
// linked=false (mehmon, sotuv sahifasi) — faqat nomlar; linked=true (kursga yozilgan) — har bir fayl bosilsa yangi oynada ochiladi.
export const FILES_BLOCK_TITLE = "Check - listlar";

export type CourseFileItem = { id: string; title: string; size: number };

const kb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

function ChecklistIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1" />
      <path d="m8.5 10 1.3 1.3L12 9" />
      <path d="M14 10.5h2.5" />
      <path d="m8.5 15.5 1.3 1.3L12 14.5" />
      <path d="M14 16h2.5" />
    </svg>
  );
}

export function CourseFiles({ files, linked, className = "" }: { files: CourseFileItem[]; linked: boolean; className?: string }) {
  if (files.length === 0) return null;
  return (
    <section className={`glass p-5 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-gradient-to-br from-ink-800 to-ink-950 p-2 text-gold-text shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_20px_-10px_rgba(212,175,55,0.55)]">
          <ChecklistIcon className="h-full w-full" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-gold-text/60">Qo&apos;shimcha material · {files.length} ta PDF</p>
          <h3 className="mt-1 text-lg font-bold">{FILES_BLOCK_TITLE}</h3>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {files.map((f, i) => {
          const body = (
            <>
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">{i + 1}</span>
              <span className="min-w-0 flex-1 leading-snug">{f.title}</span>
              <span className="shrink-0 text-xs text-gold-text/60">{linked ? "PDF ↗" : `PDF · ${kb(f.size)}`}</span>
            </>
          );
          return (
            <li key={f.id}>
              {linked ? (
                <a href={`/api/file/${f.id}`} target="_blank" rel="noopener" className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-1 text-sm text-gold-text/85 transition hover:bg-white/[0.06] hover:text-gold-text active:bg-white/10">
                  {body}
                </a>
              ) : (
                <div className="flex items-start gap-3 text-sm text-gold-text/85">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
