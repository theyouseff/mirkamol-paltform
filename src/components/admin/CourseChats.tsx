"use client";

import { useState } from "react";
import { ChatPanel, type ChatStudent } from "@/components/chat/ChatPanel";

export type CourseChatData = {
  id: string;
  title: string;
  studentCount: number;
  // Har bir kuratorning o'z suhbatlari: oxirgi xabar va o'qilmaganlar faqat shu kurator bilan bo'lgan yozishmadan
  curators: { id: string; name: string; email: string; students: ChatStudent[] }[];
};

const cardBase = "w-full rounded-xl border px-4 py-3 text-left transition";
const on = "border-gold/40 bg-gradient-to-r from-gold/20 to-transparent shadow-[inset_3px_0_0_#c9a227]";
const off = "border-white/10 bg-white/5 hover:bg-white/10";

// Admin uchun: kurs → kuratorlar → kurator o'quvchilari → o'quvchi suhbati (faqat ko'rish).
export function CourseChats({ courses }: { courses: CourseChatData[] }) {
  const [courseId, setCourseId] = useState<string | null>(null);
  const [curatorId, setCuratorId] = useState<string | null>(null);
  const course = courses.find((c) => c.id === courseId) ?? null;
  const curator = course?.curators.find((c) => c.id === curatorId) ?? null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gold-text">Kurslar va chatlar</h2>
        <p className="text-sm text-gold-text/70">Kursni bosing → kurator → o&apos;quvchi: shu kurator bilan o&apos;quvchining suhbati ko&apos;rinadi (har bir kuratorniki alohida).</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setCourseId(c.id === courseId ? null : c.id);
              setCuratorId(null);
            }}
            className={`${cardBase} ${c.id === courseId ? on : off}`}
          >
            <p className="truncate font-medium text-gold-text">{c.title}</p>
            <p className="text-xs text-gold-text/60">{c.curators.length} kurator · {c.studentCount} o&apos;quvchi</p>
          </button>
        ))}
        {courses.length === 0 && <p className="text-sm text-gold-text/60">Kurslar yo&apos;q</p>}
      </div>

      {course && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gold-text/70">Kuratorlar — {course.title}</h3>
          {course.curators.length === 0 ? (
            <p className="text-sm text-gold-text/60">Bu kursga kurator biriktirilmagan (Kuratorlar bo&apos;limidan biriktiring).</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {course.curators.map((k) => (
                <button key={k.id} type="button" onClick={() => setCuratorId(k.id === curatorId ? null : k.id)} className={`${cardBase} ${k.id === curatorId ? on : off}`}>
                  <p className="truncate font-medium text-gold-text">{k.name}</p>
                  <p className="truncate text-xs text-gold-text/60">{k.email}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {course && curator && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gold-text/70">{curator.name} — o&apos;quvchilar va chatlar</h3>
          <ChatPanel key={`${course.id}:${curator.id}`} students={curator.students} curatorId={curator.id} readOnly />
        </div>
      )}
    </section>
  );
}
