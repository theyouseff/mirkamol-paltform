import { ImageResponse } from "next/og";

// /pwa/192 va /pwa/512 — ilova ikonkasi
export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const px = size === "512" ? 512 : 192;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#2f3e52", color: "white", fontSize: px * 0.55, fontWeight: 700 }}>
        A
      </div>
    ),
    { width: px, height: px },
  );
}
