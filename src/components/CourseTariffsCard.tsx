"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ADMIN_TELEGRAM, adminContactUrl } from "@/lib/config";
import { formatPrice, formatPriceRange } from "@/lib/format";

type Tariff = { id: string; name: string; price: number; oldPrice: number | null; features: string };
type Course = { slug: string; title: string; subtitle: string; coverUrl: string };

const step = (i: number) => ({ "--i": i }) as CSSProperties;

function Check() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#f1c657] to-[#c9962a] text-emerald-950">
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 10.5l4 4 8-9" />
      </svg>
    </span>
  );
}

// Katalogdagi kurs bloki. Bosilganda tarif tanlash oynasi ochiladi (native <dialog>: Esc, fokus, orqa fon tayyor).
export function CourseTariffsCard({ course, tariffs }: { course: Course; tariffs: Tariff[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  const cols = tariffs.length >= 3 ? "lg:grid-cols-3" : tariffs.length === 2 ? "sm:grid-cols-2" : "";

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="card-gold flex w-full cursor-pointer flex-col text-left">
        {course.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.coverUrl} alt="" className="mb-4 aspect-video w-full rounded-xl object-cover" />
        ) : (
          <div className="mb-4 aspect-video w-full rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-500" />
        )}
        <h2 className="text-lg font-semibold">{course.title}</h2>
        <p className="mt-1 flex-1 text-sm text-zinc-500">{course.subtitle}</p>
        {tariffs.length > 0 && <p className="gold-text-gloss mt-4 text-lg font-extrabold">{formatPriceRange(tariffs.map((t) => t.price))}</p>}
      </button>

      <dialog ref={dialog} className="tariff-dialog" aria-label={`${course.title}: tarif tanlash`}>
        <div className="flex min-h-full items-center justify-center p-4 sm:p-8" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="modal-in relative w-full max-w-4xl rounded-3xl border border-gold/40 bg-emerald-950/85 p-6 shadow-2xl backdrop-blur-xl sm:p-9">
            <button
              type="button"
              onClick={close}
              aria-label="Yopish"
              className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gold/50 text-gold-text transition hover:bg-gold/15"
            >
              ✕
            </button>

            <div className="enter pr-10" style={step(0)}>
              <p className="text-sm font-medium uppercase tracking-widest text-gold-text/70">Tarifni tanlang</p>
              <h2 className="mt-1 text-2xl font-bold text-gold-text sm:text-3xl">{course.title}</h2>
            </div>

            <div className={`mt-7 grid gap-5 ${cols} ${tariffs.length === 1 ? "mx-auto max-w-sm" : ""}`}>
              {tariffs.map((t, i) => (
                <div key={t.id} className="enter card-gold flex flex-col" style={step(i + 1)}>
                  <h3 className="text-xl font-semibold">{t.name}</h3>
                  <div className="mt-3">
                    {t.oldPrice && <p className="text-sm text-zinc-400 line-through">{formatPrice(t.oldPrice)}</p>}
                    <p className="gold-text-gloss text-3xl font-extrabold">{formatPrice(t.price)}</p>
                  </div>
                  <ul className="mt-5 flex-1 space-y-2.5 text-sm text-zinc-700">
                    {t.features.split("\n").filter(Boolean).map((f, k) => (
                      <li key={k} className="flex items-start gap-2.5"><Check />{f}</li>
                    ))}
                  </ul>
                  {ADMIN_TELEGRAM ? (
                    <a href={adminContactUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6 w-full py-3">Sotib olish uchun yozing</a>
                  ) : (
                    <p className="mt-6 rounded-xl bg-emerald-50 px-3 py-3 text-center text-sm text-emerald-900">Sotib olish uchun adminga yozing</p>
                  )}
                </div>
              ))}
            </div>

            <div className="enter mt-7 text-center" style={step(tariffs.length + 1)}>
              <Link href={`/courses/${course.slug}`} className="text-sm font-medium text-gold-text underline-offset-4 hover:underline">
                Kurs dasturi bilan tanishish →
              </Link>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
