// Oxirgi ko'rilgan videoning to'xtagan joyidagi kadr: dars sahifasida video to'xtatilganda brauzerga (localStorage) saqlanadi,
// kabinetda "Oxirgi ko'rgan video" kartochkasi uni video yuklanishini kutmasdan darhol ko'rsatadi.
export const FRAME_KEY = "lastFrame";

export type StoredFrame = { lessonId: string; pos: number; img: string };

export function readFrame(): StoredFrame | null {
  try {
    const raw = localStorage.getItem(FRAME_KEY);
    const f = raw ? (JSON.parse(raw) as StoredFrame) : null;
    return f && typeof f.img === "string" && typeof f.lessonId === "string" ? f : null;
  } catch {
    return null;
  }
}

// Videodagi hozirgi kadrni kichik JPEG qilib saqlaydi. Video boshqa manzildan (R2) CORS ruxsatisiz kelsa, brauzer buni taqiqlaydi — jim o'tkazib yuboriladi.
export function saveFrame(lessonId: string, video: HTMLVideoElement) {
  try {
    if (!video.videoWidth || video.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(640, video.videoWidth);
    canvas.height = Math.round((canvas.width * video.videoHeight) / video.videoWidth);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame: StoredFrame = { lessonId, pos: video.currentTime, img: canvas.toDataURL("image/jpeg", 0.72) };
    localStorage.setItem(FRAME_KEY, JSON.stringify(frame));
  } catch {}
}
