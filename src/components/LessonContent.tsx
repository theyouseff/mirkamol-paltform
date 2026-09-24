import { GoldCheck } from "./GoldCheck";

// Dars matni: bo'sh qator — yangi abzats; "- " bilan boshlangan qatorlar — belgili ro'yxat;
// ":" bilan tugaydigan bitta qator — kichik sarlavha (masalan, "Bu darsda:").
export function LessonContent({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim());
        const head = lines[0].endsWith(":") && lines.length > 1 ? lines.shift()! : null;
        const isList = lines.length > 0 && lines.every((l) => /^[-•]\s+/.test(l));
        return (
          <div key={i}>
            {head && <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-text/70">{head.slice(0, -1)}</h3>}
            {isList ? (
              <ul className="space-y-2.5">
                {lines.map((l) => (
                  <li key={l} className="flex items-start gap-2.5 text-gold-text/90"><GoldCheck />{l.replace(/^[-•]\s+/, "")}</li>
                ))}
              </ul>
            ) : (
              <p className="whitespace-pre-line leading-relaxed text-gold-text/85">{lines.join("\n")}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
