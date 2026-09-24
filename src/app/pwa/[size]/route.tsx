import { ImageResponse } from "next/og";

// /pwa/192 va /pwa/512 — ilova ikonkasi
export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = size === "512" ? 512 : 192;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#151922", color: "#e6b04f", fontSize: px * 0.55, fontWeight: 700 }}>
        T
      </div>
    ),
    { width: px, height: px },
  );
}
