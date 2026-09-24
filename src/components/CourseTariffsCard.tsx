"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { formatPriceRange } from "@/lib/format";

type Course = { slug: string; title: string; subtitle: string; coverUrl: string };

const step = (i: number) => ({ "--i": i }) as CSSProperties;

// Namuna (imitatsiya) video darslar: keyinroq kursning haqiqiy darslariga ulanadi
const DEMO_LESSONS = [
  { title: "LOR asoslari: quloq, burun, tomoq", duration: "12:40" },
  { title: "Otoskopiya va rinoskopiya texnikasi", duration: "18:05" },
  { title: "Bemor bilan suhbat va anamnez", duration: "09:30" },
  { title: "Eng ko'p uchraydigan kasalliklar", duration: "24:15" },
  { title: "Klinik amaliyot: real holatlar tahlili", duration: "21:50" },
];

function Play() {
  return (
    <span className="gold-gloss relative isolate flex h-14 w-14 items-center justify-center overflow-hidden rounded-full transition-transform duration-300 before:rounded-none! group-hover:scale-110">
      <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6" fill="currentColor" aria-hidden>
        <path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" />
      </svg>
    </span>
  );
}

// Katalogdagi kurs bloki. Bosilganda video darslar oynasi ochiladi (native <dialog>: Esc, fokus, orqa fon tayyor).
export function CourseTariffsCard({ course, prices }: { course: Course; prices: number[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

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
        {prices.length > 0 && <p className="gold-text-gloss mt-4 text-lg font-extrabold">{formatPriceRange(prices)}</p>}
      </button>

      <dialog ref={dialog} className="tariff-dialog" aria-label={`${course.title}: video darslar`}>
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
              <p className="text-sm font-medium uppercase tracking-widest text-gold-text/70">Kurs mazmuni · {DEMO_LESSONS.length} ta video dars</p>
              <h2 className="mt-1 text-2xl font-bold text-gold-text sm:text-3xl">{course.title}</h2>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_LESSONS.map((l, i) => (
                <div key={l.title} className="enter group cursor-pointer overflow-hidden rounded-2xl border border-gold/30 bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-gold/70 hover:bg-white/10" style={step(i + 1)}>
                  <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(241,198,87,0.28),transparent_58%)]" />
                    <Play />
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white">{l.duration}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gold-text/60">{i + 1}-dars</p>
                    <h3 className="mt-1 font-semibold leading-snug text-gold-text">{l.title}</h3>
                  </div>
                </div>
              ))}
            </div>

            <div className="enter mt-7 text-center" style={step(DEMO_LESSONS.length + 1)}>
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
