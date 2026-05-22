// Client-Side Image-Compression vor Upload
//
// ROOT-CAUSE 413-Errors: Vercel-Serverless-Function Body-Limit ist 4.5 MB.
// User-Bilder können >4.5 MB sein (iPhone-Foto = oft 5-8 MB JPG).
// Lösung: vor Upload zu canvas → 0.85 JPEG-Quality → <3.5 MB Ziel.

const TARGET_MAX_BYTES = 3_500_000;  // 3.5 MB · sicherer Abstand zu Vercel 4.5 MB
const MAX_DIMENSION = 2400;          // max Kante 2400px (für Cover/Inbox ausreichend)
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45];

/**
 * Komprimiert eine Bilddatei via Canvas wenn nötig.
 * - Nur image/jpeg, image/png, image/webp werden komprimiert
 * - Andere Mime-Types (PDF, etc.) werden unverändert zurückgegeben
 * - File < TARGET_MAX_BYTES wird unverändert zurückgegeben
 * - File >= TARGET_MAX_BYTES wird auf JPEG re-encoded mit
 *   absteigender Qualität bis unter Limit
 *
 * Server-side guard: window/document-Check.
 */
export async function compressImageIfNeeded(file: File): Promise<File> {
  if (typeof window === "undefined" || typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.size < TARGET_MAX_BYTES) return file;
  if (file.type === "image/gif") return file; // GIFs nicht via canvas re-encoden

  // Bild in HTMLImageElement laden
  const img = await loadImage(file);
  let { width, height } = img;
  // Skalieren wenn zu groß
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  // Erste Qualitätsstufe → wenn klein genug, return
  for (const q of QUALITY_STEPS) {
    const blob = await canvasToBlob(canvas, "image/jpeg", q);
    if (!blob) continue;
    if (blob.size < TARGET_MAX_BYTES) {
      const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
    }
  }
  // Wenn auch bei 0.45 Quality noch zu groß: nutze letzte Stufe als best-effort
  const finalBlob = await canvasToBlob(canvas, "image/jpeg", QUALITY_STEPS[QUALITY_STEPS.length - 1]);
  if (finalBlob) {
    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([finalBlob], newName, { type: "image/jpeg", lastModified: Date.now() });
  }
  return file;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image-Load fehlgeschlagen"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}
