"use client";

import { useState, useTransition } from "react";
import { setStudentPassword } from "@/lib/actions/curator";
import { MIN_PASSWORD } from "@/lib/constants";

type Student = { id: string; name: string; email: string };

// O'quvchiga tushunarli, o'xshash belgilarsiz tasodifiy parol
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const randomPassword = (length = 10) => Array.from(crypto.getRandomValues(new Uint32Array(length)), (n) => ALPHABET[n % ALPHABET.length]).join("");

function Copy({ text, label = "Nusxa" }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }).catch(() => {})}
      className="btn-outline px-3 py-1 text-xs"
    >
      {ok ? "✓ Nusxalandi" : label}
    </button>
  );
}

// Chapda — kuratorning o'quvchilari; o'ngda tanlangan o'quvchining logini va parolni o'zgartirish. Hech kim tanlanmasa — kuratorning o'z parol formasi (ownForm).
export function StudentPasswords({ students, ownForm }: { students: Student[]; ownForm: React.ReactNode }) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null); // yangi parol (bir marta ko'rsatiladi)
  const [pending, startTransition] = useTransition();

  const selected = students.find((s) => s.id === selectedId) ?? null;
  const list = students.filter((s) => !q || `${s.name} ${s.email}`.toLowerCase().includes(q.toLowerCase()));

  const pick = (id: string | null) => {
    setSelectedId(id);
    setEditing(false);
    setPassword("");
    setError("");
    setDone(null);
  };
  const save = () =>
    startTransition(async () => {
      if (!selected) return;
      const res = await setStudentPassword(selected.id, password);
      if (!res.ok) return setError(res.error ?? "Saqlanmadi");
      setDone(password);
      setEditing(false);
      setPassword("");
      setError("");
    });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
      {/* Chap: o'quvchilar ro'yxati */}
      <section className="card space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-semibold">O&apos;quvchilar</h2>
          <span className="text-xs text-zinc-400">{students.length} ta</span>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} className="input" placeholder="Ism yoki email" />
        <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
          {list.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => pick(s.id)}
                className={`w-full rounded-xl px-3 py-2.5 text-left transition ${s.id === selectedId ? "bg-amber-50 ring-1 ring-brand" : "hover:bg-zinc-50"}`}
              >
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="truncate text-xs text-zinc-400">{s.email}</p>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="px-3 py-6 text-center text-sm text-zinc-400">{students.length === 0 ? "Sizga o'quvchilar biriktirilmagan" : "Topilmadi"}</li>}
        </ul>
      </section>

      {/* O'ng: tanlangan o'quvchi yoki o'zining paroli */}
      {!selected ? (
        <div>{ownForm}</div>
      ) : (
        <section className="card space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold">{selected.name}</h2>
              <p className="text-sm text-zinc-500">O&apos;quvchi akkaunti</p>
            </div>
            <button type="button" onClick={() => pick(null)} className="text-sm text-brand hover:underline">← Mening parolim</button>
          </div>

          <dl className="space-y-3 rounded-xl bg-zinc-50 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-zinc-500">Login (email)</dt>
              <dd className="flex items-center gap-2"><b className="break-all">{selected.email}</b><Copy text={selected.email} /></dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-zinc-500">Hozirgi parol</dt>
              <dd className="text-right">
                <b className="tracking-widest">••••••••</b>
                <p className="text-xs text-zinc-400">Xavfsizlik uchun parol saqlanmaydi, ko&apos;rib bo&apos;lmaydi. Yangisini o&apos;rnating.</p>
              </dd>
            </div>
          </dl>

          {done && (
            <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
              <p className="font-medium text-green-800">Parol o&apos;zgartirildi. O&apos;quvchi hamma qurilmadan chiqarildi.</p>
              <div className="flex flex-wrap items-center gap-2">
                <span>Yangi parol:</span>
                <b className="rounded-lg bg-white px-3 py-1 font-mono text-base">{done}</b>
                <Copy text={done} />
              </div>
              <p className="text-xs text-zinc-500">Parolni o&apos;quvchiga shaxsiy xabarda yuboring. Bu oyna yopilgach parol qayta ko&apos;rinmaydi.</p>
            </div>
          )}

          {!editing ? (
            <button type="button" onClick={() => { setEditing(true); setDone(null); }} className="btn-primary">Parolni o&apos;zgartirish</button>
          ) : (
            <div className="space-y-3">
              <label className="label" htmlFor="new-student-password">Yangi parolni yozing</label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="new-student-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input min-w-0 flex-1"
                  placeholder={`Kamida ${MIN_PASSWORD} ta belgi`}
                  autoComplete="off"
                  autoFocus
                />
                <button type="button" onClick={() => setPassword(randomPassword())} className="btn-outline">Tasodifiy</button>
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={save} disabled={pending || password.length < MIN_PASSWORD} className="btn-primary flex-1 disabled:opacity-50">{pending ? "Saqlanmoqda..." : "Saqlash"}</button>
                <button type="button" onClick={() => { setEditing(false); setPassword(""); setError(""); }} className="btn-outline">Bekor qilish</button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
