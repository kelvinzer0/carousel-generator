/**
 * Render gradient/texture text to canvas for export.
 * html-to-image doesn't support background-clip: text in SVG foreignObject,
 * so we pre-render gradient text elements to canvas before capture.
 *
 * Uses mask compositing: gradient full-area → text mask → destination-in
 * This matches CSS background-clip: text behavior including anti-aliased edges.
 */

const EXPORT_SCALE = 4;

const textureCache = new Map<string, HTMLImageElement>();

async function fetchImageAsBlob(url: string): Promise<string> {
  try {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Proxy returned ${response.status}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn("Proxy fetch failed, trying direct URL:", err);
    return url;
  }
}

export async function preloadTextures(container: HTMLElement): Promise<void> {
  const elements = container.querySelectorAll("*");
  const loadPromises: Promise<void>[] = [];
  const seenUrls = new Set<string>();

  elements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const computed = window.getComputedStyle(htmlEl);
    const bg = computed.backgroundImage;

    if (
      (computed.backgroundClip === "text" ||
        computed.webkitBackgroundClip === "text") &&
      bg &&
      bg.startsWith("url(")
    ) {
      const urlMatch = bg.match(/url\(["']?([^"')]+)["']?\)/);
      if (urlMatch) {
        const originalUrl = urlMatch[1];
        if (textureCache.has(originalUrl) || seenUrls.has(originalUrl)) return;
        seenUrls.add(originalUrl);

        const p = (async () => {
          try {
            const blobUrl = await fetchImageAsBlob(originalUrl);
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((resolve) => {
              img.onload = () => {
                textureCache.set(originalUrl, img);
                resolve();
              };
              img.onerror = () => {
                console.warn("Failed to load texture:", originalUrl);
                resolve();
              };
              img.src = blobUrl;
            });
          } catch (err) {
            console.warn("Texture preload error:", err);
          }
        })();

        loadPromises.push(p);
      }
    }
  });

  await Promise.all(loadPromises);
}

export function prerenderGradientText(
  container: HTMLElement
): () => void {
  const replacements: {
    original: HTMLElement;
    canvas: HTMLCanvasElement;
    parent: HTMLElement;
  }[] = [];

  const elements = container.querySelectorAll("*");

  elements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const computed = window.getComputedStyle(htmlEl);

    if (
      computed.backgroundClip === "text" ||
      computed.webkitBackgroundClip === "text"
    ) {
      const canvas = renderElementToCanvas(htmlEl, computed);
      if (canvas) {
        const rect = htmlEl.getBoundingClientRect();
        const parentRect = htmlEl.parentElement?.getBoundingClientRect();

        if (parentRect) {
          canvas.style.position = "absolute";
          canvas.style.top = (rect.top - parentRect.top) + "px";
          canvas.style.left = (rect.left - parentRect.left) + "px";
        } else {
          canvas.style.position = "absolute";
          canvas.style.top = htmlEl.offsetTop + "px";
          canvas.style.left = htmlEl.offsetLeft + "px";
        }

        canvas.style.width = htmlEl.offsetWidth + "px";
        canvas.style.height = htmlEl.offsetHeight + "px";
        canvas.style.pointerEvents = "none";

        const parentPosition = htmlEl.parentElement?.style.position;
        if (htmlEl.parentElement && (!parentPosition || parentPosition === "static")) {
          htmlEl.parentElement.style.position = "relative";
        }

        htmlEl.style.visibility = "hidden";
        htmlEl.parentElement?.appendChild(canvas);

        replacements.push({
          original: htmlEl,
          canvas,
          parent: htmlEl.parentElement!,
        });
      }
    }
  });

  return () => {
    replacements.forEach(({ original, canvas }) => {
      original.style.visibility = "";
      canvas.remove();
    });
  };
}

/**
 * Render element to canvas using mask compositing.
 * 1. Draw gradient/texture on full area (bgCanvas)
 * 2. Draw text mask on separate canvas (maskCanvas)
 * 3. Composite: bgCanvas + destination-in text mask → final result
 */
function renderElementToCanvas(
  el: HTMLElement,
  computed: CSSStyleDeclaration
): HTMLCanvasElement | null {
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  if (width === 0 || height === 0) return null;

  const text = el.textContent || "";
  if (!text.trim()) return null;

  const fontSize = computed.fontSize;
  const fontFamily = computed.fontFamily;
  const fontWeight = computed.fontWeight;
  const fontStyle = computed.fontStyle || "normal";
  const letterSpacing = computed.letterSpacing;
  const lineHeight = computed.lineHeight;
  const textAlign = computed.textAlign || "left";

  const fontStr = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;

  // --- Step 1: Draw gradient/texture on full area ---
  const bgCanvas = document.createElement("canvas");
  bgCanvas.width = width * EXPORT_SCALE;
  bgCanvas.height = height * EXPORT_SCALE;
  const bgCtx = bgCanvas.getContext("2d");
  if (!bgCtx) return null;
  bgCtx.scale(EXPORT_SCALE, EXPORT_SCALE);

  const backgroundImage = computed.backgroundImage;
  if (backgroundImage && backgroundImage !== "none") {
    if (backgroundImage.startsWith("url(")) {
      applyTextureFill(bgCtx, backgroundImage, width, height, computed);
    } else {
      const gradient = createGradientFromCSS(bgCtx, backgroundImage, width, height);
      if (gradient) {
        bgCtx.fillStyle = gradient;
      }
      bgCtx.fillRect(0, 0, width, height);
    }
  }

  // --- Step 2: Draw text mask ---
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width * EXPORT_SCALE;
  maskCanvas.height = height * EXPORT_SCALE;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) return null;
  maskCtx.scale(EXPORT_SCALE, EXPORT_SCALE);

  maskCtx.font = fontStr;
  maskCtx.textBaseline = "top";
  maskCtx.fillStyle = "white";

  // Text alignment
  let x = 0;
  if (textAlign === "center") {
    maskCtx.textAlign = "center";
    x = width / 2;
  } else if (textAlign === "right") {
    maskCtx.textAlign = "right";
    x = width;
  } else {
    maskCtx.textAlign = "left";
  }

  const ls = parseLetterSpacing(letterSpacing);
  const lines = wrapText(maskCtx, text, width, ls);
  const lineHeightPx = parseLineHeight(lineHeight, parseFloat(fontSize));
  let y = 0;

  lines.forEach((line) => {
    if (ls > 0) {
      drawTextWithSpacing(maskCtx, line, x, y, ls);
    } else {
      maskCtx.fillText(line, x, y);
    }
    y += lineHeightPx;
  });

  // --- Step 3: Composite — gradient masked by text shape ---
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = width * EXPORT_SCALE;
  finalCanvas.height = height * EXPORT_SCALE;
  const finalCtx = finalCanvas.getContext("2d");
  if (!finalCtx) return null;
  finalCtx.scale(EXPORT_SCALE, EXPORT_SCALE);

  // Draw gradient/texture first
  finalCtx.drawImage(bgCanvas, 0, 0, width * EXPORT_SCALE, height * EXPORT_SCALE,
                     0, 0, width, height);

  // Mask with text shape (destination-in keeps gradient only where text is)
  finalCtx.globalCompositeOperation = "destination-in";
  finalCtx.drawImage(maskCanvas, 0, 0, width * EXPORT_SCALE, height * EXPORT_SCALE,
                     0, 0, width, height);

  // Reset composite operation
  finalCtx.globalCompositeOperation = "source-over";

  // Apply opacity if needed
  const opacity = parseFloat(computed.opacity);
  if (!isNaN(opacity) && opacity < 1) {
    // Re-draw with opacity
    const opacityCanvas = document.createElement("canvas");
    opacityCanvas.width = width * EXPORT_SCALE;
    opacityCanvas.height = height * EXPORT_SCALE;
    const opacityCtx = opacityCanvas.getContext("2d");
    if (opacityCtx) {
      opacityCtx.globalAlpha = opacity;
      opacityCtx.drawImage(finalCanvas, 0, 0);
      return opacityCanvas;
    }
  }

  return finalCanvas;
}

// ─── Texture Fill (cover behavior) ──────────────────────────────

function applyTextureFill(
  ctx: CanvasRenderingContext2D,
  backgroundImage: string,
  width: number,
  height: number,
  computed: CSSStyleDeclaration
): boolean {
  const urlMatch = backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
  if (!urlMatch) return false;

  const url = urlMatch[1];
  const img = textureCache.get(url);

  if (!img || !img.complete || img.naturalWidth === 0) {
    return false;
  }

  return drawTextureCover(ctx, img, width, height, computed);
}

function drawTextureCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  computed: CSSStyleDeclaration
): boolean {
  try {
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    const scale = Math.max(width / imgW, height / imgH);
    const scaledW = imgW * scale;
    const scaledH = imgH * scale;

    const offsetX = (width - scaledW) / 2;
    const offsetY = (height - scaledH) / 2;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return false;

    tempCtx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

    const pattern = ctx.createPattern(tempCanvas, "no-repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
      return true;
    }

    return false;
  } catch (err) {
    console.warn("drawTextureCover error:", err);
    return false;
  }
}

// ─── CSS Gradient Parser ────────────────────────────────────────

function splitByComma(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function angleToCoords(
  angleStr: string,
  w: number,
  h: number
): [number, number, number, number] {
  const keywords: Record<string, number> = {
    "to top": 0,
    "to top right": 45,
    "to right": 90,
    "to bottom right": 135,
    "to bottom": 180,
    "to bottom left": 225,
    "to left": 270,
    "to top left": 315,
  };

  let deg: number | undefined;

  for (const [key, val] of Object.entries(keywords)) {
    if (angleStr.includes(key)) {
      deg = val;
      break;
    }
  }

  if (deg === undefined) {
    const degMatch = angleStr.match(/([\d.]+)deg/);
    if (degMatch) deg = parseFloat(degMatch[1]);
  }
  if (deg === undefined) {
    const radMatch = angleStr.match(/([\d.]+)rad/);
    if (radMatch) deg = (parseFloat(radMatch[1]) * 180) / Math.PI;
  }
  if (deg === undefined) {
    const turnMatch = angleStr.match(/([\d.]+)turn/);
    if (turnMatch) deg = parseFloat(turnMatch[1]) * 360;
  }
  if (deg === undefined) deg = 180;

  const rad = ((deg - 90) * Math.PI) / 180;
  const diag = Math.sqrt(w * w + h * h);
  const cx = w / 2;
  const cy = h / 2;
  const dx = (Math.cos(rad) * diag) / 2;
  const dy = (Math.sin(rad) * diag) / 2;

  return [cx - dx, cy - dy, cx + dx, cy + dy];
}

interface ColorStop {
  color: string;
  position: number | null;
  opacity: number;
}

function parseColorStop(raw: string): ColorStop | null {
  const s = raw.trim();
  if (!s) return null;

  let color = "";
  let position: number | null = null;
  let opacity = 1;

  const posMatch = s.match(/([\d.]+)\s*%\s*$/);
  if (posMatch) position = parseFloat(posMatch[1]);

  const funcMatch = s.match(
    /(rgba?\(\s*[\d,\s.]+\s*\)|hsla?\(\s*[\d,\s.%]+\s*\))/
  );
  if (funcMatch) {
    color = funcMatch[1].trim();
    const alphaMatch = color.match(
      /rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/
    );
    if (alphaMatch) opacity = parseFloat(alphaMatch[1]);
  } else {
    const hexMatch = s.match(/(#[0-9a-fA-F]{3,8})\b/);
    if (hexMatch) {
      color = hexMatch[1];
      if (color.length === 9) {
        opacity = parseInt(color.slice(7, 9), 16) / 255;
        color = color.slice(0, 7);
      }
    } else {
      const cleaned = posMatch
        ? s.slice(0, s.lastIndexOf(posMatch[0])).trim()
        : s;
      if (cleaned) color = cleaned;
    }
  }

  if (!color) return null;
  return { color, position, opacity };
}

function distributePositions(stops: ColorStop[]): void {
  const hasPositions = stops.some((s) => s.position !== null);

  if (!hasPositions) {
    stops.forEach((s, i) => {
      s.position = (i / (stops.length - 1)) * 100;
    });
    return;
  }

  for (let i = 0; i < stops.length; i++) {
    if (stops[i].position === null) {
      let prevIdx = -1;
      let nextIdx = -1;
      for (let j = i - 1; j >= 0; j--) {
        if (stops[j].position !== null) {
          prevIdx = j;
          break;
        }
      }
      for (let j = i + 1; j < stops.length; j++) {
        if (stops[j].position !== null) {
          nextIdx = j;
          break;
        }
      }

      const prevPos = prevIdx >= 0 ? stops[prevIdx].position! : 0;
      const nextPos = nextIdx >= 0 ? stops[nextIdx].position! : 100;
      const prevI = prevIdx >= 0 ? prevIdx : 0;
      const nextI = nextIdx >= 0 ? nextIdx : stops.length - 1;
      const span = nextI - prevI;

      stops[i].position =
        prevPos + ((i - prevI) / span) * (nextPos - prevPos);
    }
  }
}

function applyAlphaToColor(color: string, alpha: number): string {
  if (alpha >= 1) return color;
  const rgbaMatch = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (rgbaMatch) {
    const r = Math.round(parseFloat(rgbaMatch[1]));
    const g = Math.round(parseFloat(rgbaMatch[2]));
    const b = Math.round(parseFloat(rgbaMatch[3]));
    return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
  }
  return color;
}

function createGradientFromCSS(
  ctx: CanvasRenderingContext2D,
  css: string,
  width: number,
  height: number
): CanvasGradient | null {
  const linearMatch = css.match(/linear-gradient\((.+)\)/s);
  if (linearMatch) {
    const parts = splitByComma(linearMatch[1]);
    if (parts.length < 2) return null;

    const directionStr = parts[0];
    const isDirection =
      directionStr.includes("to ") ||
      directionStr.includes("deg") ||
      directionStr.includes("rad") ||
      directionStr.includes("turn");

    const colorParts = isDirection ? parts.slice(1) : parts;
    const direction = isDirection ? directionStr : "to bottom";

    const [x1, y1, x2, y2] = angleToCoords(direction, width, height);
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

    const stops: ColorStop[] = [];
    for (const part of colorParts) {
      const stop = parseColorStop(part);
      if (stop) stops.push(stop);
    }
    if (stops.length < 2) return null;

    distributePositions(stops);

    stops.forEach((stop) => {
      const pos = Math.max(0, Math.min(1, stop.position! / 100));
      const colorWithAlpha = applyAlphaToColor(stop.color, stop.opacity);
      try {
        gradient.addColorStop(pos, colorWithAlpha);
      } catch {}
    });

    return gradient;
  }

  const radialMatch = css.match(/radial-gradient\((.+)\)/s);
  if (radialMatch) {
    const parts = splitByComma(radialMatch[1]);
    if (parts.length < 2) return null;

    const colorParts = parts.filter(
      (p) =>
        !p.match(/^(circle|ellipse|at\s|closest|farthest|[\d.]+%|[\d.]+px)/)
    );

    const stops: ColorStop[] = [];
    for (const part of colorParts) {
      const stop = parseColorStop(part);
      if (stop) stops.push(stop);
    }
    if (stops.length < 2) return null;

    distributePositions(stops);

    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    );

    stops.forEach((stop) => {
      const pos = Math.max(0, Math.min(1, stop.position! / 100));
      const colorWithAlpha = applyAlphaToColor(stop.color, stop.opacity);
      try {
        gradient.addColorStop(pos, colorWithAlpha);
      } catch {}
    });

    return gradient;
  }

  return null;
}

// ─── Text Helpers ────────────────────────────────────────────────

function parseLetterSpacing(value: string): number {
  if (!value || value === "normal") return 0;
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  if (value.endsWith("px")) return num;
  return num;
}

function drawTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
): void {
  const align = ctx.textAlign;
  if (spacing <= 0) {
    ctx.fillText(text, x, y);
    return;
  }

  const chars = text.split("");
  const totalWidth =
    ctx.measureText(text).width + spacing * (chars.length - 1);

  let startX = x;
  if (align === "center") startX = x - totalWidth / 2;
  else if (align === "right") startX = x - totalWidth;

  ctx.textAlign = "left";
  let cx = startX;
  for (const ch of chars) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  ctx.textAlign = align;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number = 0
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  const measure = (s: string) =>
    ctx.measureText(s).width + letterSpacing * Math.max(0, s.length - 1);

  words.forEach((word) => {
    const testLine = currentLine ? currentLine + " " + word : word;
    if (measure(testLine) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

function parseLineHeight(value: string, fontSize: number): number {
  if (value === "normal" || !value) return fontSize * 1.2;
  const num = parseFloat(value);
  if (isNaN(num)) return fontSize * 1.2;
  if (value.endsWith("px")) return num;
  return num * fontSize;
}

function cssBlendToCanvas(blend: string): GlobalCompositeOperation {
  const map: Record<string, GlobalCompositeOperation> = {
    multiply: "multiply",
    overlay: "overlay",
    "soft-light": "soft-light",
    "hard-light": "hard-light",
    darken: "darken",
    lighten: "lighten",
    "color-dodge": "color-dodge",
    "color-burn": "color-burn",
    difference: "difference",
    exclusion: "exclusion",
    hue: "hue",
    saturation: "saturation",
    color: "color",
    luminosity: "luminosity",
  };
  return map[blend] || "source-over";
}
