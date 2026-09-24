import type { CSSProperties } from "react";

const HEX = /^#[0-9a-f]{6}$/i;

function mix(hex: string, target: number, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c + (target - c) * amount));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function isHexColor(value: string) {
  return HEX.test(value);
}

// Kursning asosiy rangidan to'q va och ranglarni hosil qilib, CSS o'zgaruvchilar sifatida beradi.
// Rang bo'sh bo'lsa — platformaning umumiy rangi qoladi.
export function brandVars(color?: string | null): CSSProperties {
  if (!color || !HEX.test(color)) return {};
  return {
    "--brand": color,
    "--brand-dark": mix(color, 0, 0.25),
    "--brand-soft": mix(color, 255, 0.9),
  } as CSSProperties;
}
