import { CropArea, CensorArea } from "@/lib/validation/image-schema";

/**
 * Render image with crop + censor areas applied, return as data URL.
 * Loads image via proxy to avoid CORS tainting the canvas.
 */
export async function applyImageEdits(
  src: string,
  crop?: CropArea,
  censorAreas?: CensorArea[]
): Promise<string> {
  // Load image — use proxy for remote URLs to avoid CORS
  const loadSrc =
    src.startsWith("data:") || src.startsWith("blob:")
      ? src
      : `/api/proxy?url=${encodeURIComponent(src)}`;

  const img = await loadImage(loadSrc);

  // Determine source region (crop)
  const sx = crop ? (crop.x / 100) * img.naturalWidth : 0;
  const sy = crop ? (crop.y / 100) * img.naturalHeight : 0;
  const sw = crop ? (crop.width / 100) * img.naturalWidth : img.naturalWidth;
  const sh = crop
    ? (crop.height / 100) * img.naturalHeight
    : img.naturalHeight;

  // Canvas size = cropped region
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const ctx = canvas.getContext("2d")!;

  // Draw cropped image
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  // Draw censor black bars
  if (censorAreas && censorAreas.length > 0) {
    ctx.fillStyle = "#000000";
    for (const area of censorAreas) {
      // Censor coords are in original image % — remap to crop space
      let rx: number, ry: number, rw: number, rh: number;
      if (crop) {
        rx = ((area.x - crop.x) / crop.width) * canvas.width;
        ry = ((area.y - crop.y) / crop.height) * canvas.height;
        rw = (area.width / crop.width) * canvas.width;
        rh = (area.height / crop.height) * canvas.height;
      } else {
        rx = (area.x / 100) * canvas.width;
        ry = (area.y / 100) * canvas.height;
        rw = (area.width / 100) * canvas.width;
        rh = (area.height / 100) * canvas.height;
      }
      ctx.fillRect(Math.round(rx), Math.round(ry), Math.round(rw), Math.round(rh));
    }
  }

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
