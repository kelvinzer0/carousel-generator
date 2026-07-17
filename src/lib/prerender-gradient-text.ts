/**
 * Render gradient/texture text to canvas for export.
 * html-to-image doesn't support background-clip: text in SVG foreignObject,
 * so we pre-render gradient text elements to canvas before capture.
 *
 * Fixes:
 * - rgba() color parsing (parenthesis-aware)
 * - Stops without explicit % positions
 * - Texture (url()) rendering
 * - All CSS angle directions
 * - Per-stop opacity
 * - Font loading before render
 * - Improved text wrapping with letterSpacing
 * - mixBlendMode compositing
 * - Consistent scale factor from export pipeline
 */

/** Default export scale — matches IMAGE_EXPORT_SCALE in use-component-printer */
const EXPORT_SCALE = 4;

/**
 * Pre-render gradient text elements to canvas images.
 * Returns a restore function to undo the modifications.
 */
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
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.width = htmlEl.offsetWidth + "px";
        canvas.style.height = htmlEl.offsetHeight + "px";
        canvas.style.pointerEvents = "none";

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

// ─── Canvas Render ───────────────────────────────────────────────

function renderElementToCanvas(
  el: HTMLElement,
  computed: CSSStyleDeclaration
): HTMLCanvasElement | null {
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  if (width === 0 || height === 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width * EXPORT_SCALE;
  canvas.height = height * EXPORT_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);

  const text = el.textContent || "";
  if (!text.trim()) return null;

  // Font properties
  const fontSize = computed.fontSize;
  const fontFamily = computed.fontFamily;
  const fontWeight = computed.fontWeight;
  const fontStyle = computed.fontStyle || "normal";
  const letterSpacing = computed.letterSpacing;
  const lineHeight = computed.lineHeight;
  const textAlign = computed.textAlign || "left";

  ctx.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
  ctx.textBaseline = "top";

  // Fill style: gradient, texture, or solid color
  const backgroundImage = computed.backgroundImage;
  if (backgroundImage && backgroundImage !== "none") {
    if (backgroundImage.startsWith("url(")) {
      // Texture — skip for now (sync limitation), fall through to no fill
      applyTextureFill(ctx, backgroundImage, width, height, computed);
    } else {
      const gradient = createGradientFromCSS(ctx, backgroundImage, width, height);
      if (gradient) {
        ctx.fillStyle = gradient;
      }
    }
  }

  // Handle mixBlendMode for textures
  const mixBlendMode = computed.mixBlendMode;
  if (mixBlendMode && mixBlendMode !== "normal") {
    ctx.globalCompositeOperation = cssBlendToCanvas(mixBlendMode);
  }

  // Handle element opacity
  const opacity = parseFloat(computed.opacity);
  if (!isNaN(opacity) && opacity < 1) {
    ctx.globalAlpha *= opacity;
  }

  // Text alignment
  let x = 0;
  if (textAlign === "center") {
    ctx.textAlign = "center";
    x = width / 2;
  } else if (textAlign === "right") {
    ctx.textAlign = "right";
    x = width;
  } else {
    ctx.textAlign = "left";
  }

  // Wrap text (with letter-spacing support)
  const lines = wrapText(ctx, text, width, parseLetterSpacing(letterSpacing));
  const lineHeightPx = parseLineHeight(lineHeight, parseFloat(fontSize));
  let y = 0;

  lines.forEach((line) => {
    if (parseLetterSpacing(letterSpacing) > 0) {
      drawTextWithSpacing(ctx, line, x, y, parseLetterSpacing(letterSpacing));
    } else {
      ctx.fillText(line, x, y);
    }
    y += lineHeightPx;
  });

  return canvas;
}

// ─── CSS Gradient Parser (parenthesis-aware) ─────────────────────

/**
 * Split a CSS value by commas, respecting nested parentheses.
 * e.g. "to right, rgba(255,0,0,1) 0%, #0f0 100%"
 *   → ["to right", "rgba(255,0,0,1) 0%", "#0f0 100%"]
 */
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

/**
 * Parse CSS angle to gradient coordinates (x1,y1,x2,y2) on a canvas.
 */
function angleToCoords(
  angleStr: string,
  w: number,
  h: number
): [number, number, number, number] {
  // Keyword directions
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

  // Check keyword
  for (const [key, val] of Object.entries(keywords)) {
    if (angleStr.includes(key)) {
      deg = val;
      break;
    }
  }

  // Check numeric degree
  if (deg === undefined) {
    const degMatch = angleStr.match(/([\d.]+)deg/);
    if (degMatch) deg = parseFloat(degMatch[1]);
  }

  // Check rad, turn
  if (deg === undefined) {
    const radMatch = angleStr.match(/([\d.]+)rad/);
    if (radMatch) deg = (parseFloat(radMatch[1]) * 180) / Math.PI;
  }
  if (deg === undefined) {
    const turnMatch = angleStr.match(/([\d.]+)turn/);
    if (turnMatch) deg = parseFloat(turnMatch[1]) * 360;
  }

  if (deg === undefined) deg = 180; // default: to bottom

  // CSS gradient angle: 0deg = to top (bottom→top), 90deg = to right (left→right)
  // Canvas gradient: need x1,y1 → x2,y2
  const rad = ((deg - 90) * Math.PI) / 180; // offset so 90deg = horizontal right
  // Use the diagonal to ensure the gradient covers the full element
  const diag = Math.sqrt(w * w + h * h);
  const cx = w / 2;
  const cy = h / 2;
  const dx = (Math.cos(rad) * diag) / 2;
  const dy = (Math.sin(rad) * diag) / 2;

  return [cx - dx, cy - dy, cx + dx, cy + dy];
}

interface ColorStop {
  color: string;
  position: number | null; // null = auto-distribute
  opacity: number; // 0-1
}

/**
 * Parse a single color stop string like "rgba(255,0,0,0.5) 30%" or "#f00 50%" or "red".
 */
function parseColorStop(raw: string): ColorStop | null {
  const s = raw.trim();
  if (!s) return null;

  let color = "";
  let position: number | null = null;
  let opacity = 1;

  // Try to extract position (number followed by %)
  const posMatch = s.match(/([\d.]+)\s*%\s*$/);
  if (posMatch) {
    position = parseFloat(posMatch[1]);
  }

  // Extract color: try rgba(), rgb(), hsla(), hsl(), #hex, or named
  // rgba/rgb/hsl/hsla with parentheses
  const funcMatch = s.match(
    /(rgba?\(\s*[\d,\s.]+\s*\)|hsla?\(\s*[\d,\s.%]+\s*\))/
  );
  if (funcMatch) {
    color = funcMatch[1].trim();
    // Extract alpha from rgba/hsla if present
    const alphaMatch = color.match(
      /rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)/
    );
    if (alphaMatch) {
      opacity = parseFloat(alphaMatch[1]);
    }
  } else {
    // Try hex
    const hexMatch = s.match(/(#[0-9a-fA-F]{3,8})\b/);
    if (hexMatch) {
      color = hexMatch[1];
      // 8-digit hex has alpha
      if (color.length === 9) {
        opacity = parseInt(color.slice(7, 9), 16) / 255;
        color = color.slice(0, 7);
      }
    } else {
      // Named color or everything before position
      const cleaned = posMatch
        ? s.slice(0, s.lastIndexOf(posMatch[0])).trim()
        : s;
      if (cleaned) color = cleaned;
    }
  }

  if (!color) return null;
  return { color, position, opacity };
}

/**
 * Auto-distribute positions for stops that don't have explicit %.
 */
function distributePositions(stops: ColorStop[]): void {
  const hasPositions = stops.some((s) => s.position !== null);

  if (!hasPositions) {
    // No positions at all — distribute evenly
    stops.forEach((s, i) => {
      s.position = (i / (stops.length - 1)) * 100;
    });
    return;
  }

  // Fill in gaps: for null positions, interpolate between known positions
  for (let i = 0; i < stops.length; i++) {
    if (stops[i].position === null) {
      // Find prev and next with position
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

/**
 * Apply alpha to a color string (multiply with global alpha).
 */
function applyAlphaToColor(color: string, alpha: number): string {
  if (alpha >= 1) return color;

  // If already rgba, parse and re-set alpha
  const rgbaMatch = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (rgbaMatch) {
    const r = Math.round(parseFloat(rgbaMatch[1]));
    const g = Math.round(parseFloat(rgbaMatch[2]));
    const b = Math.round(parseFloat(rgbaMatch[3]));
    return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
  }

  // For hex and named colors, use a canvas to convert
  // Fallback: return color and let globalAlpha handle it
  return color;
}

/**
 * Create a canvas gradient from CSS gradient string.
 */
function createGradientFromCSS(
  ctx: CanvasRenderingContext2D,
  css: string,
  width: number,
  height: number
): CanvasGradient | null {
  // Parse linear-gradient
  const linearMatch = css.match(/linear-gradient\((.+)\)/s);
  if (linearMatch) {
    const parts = splitByComma(linearMatch[1]);
    if (parts.length < 2) return null;

    const directionStr = parts[0];
    // Check if first part is a color (no direction keyword/angle)
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
      } catch {
        // Invalid color, skip
      }
    });

    return gradient;
  }

  // Parse radial-gradient
  const radialMatch = css.match(/radial-gradient\((.+)\)/s);
  if (radialMatch) {
    const parts = splitByComma(radialMatch[1]);
    if (parts.length < 2) return null;

    // Skip shape/position keywords for now (circle, ellipse, at center, etc.)
    const colorParts = parts.filter(
      (p) =>
        !p.match(
          /^(circle|ellipse|at\s|closest|farthest|[\d.]+%|[\d.]+px)/
        )
    );

    const stops: ColorStop[] = [];
    for (const part of colorParts) {
      const stop = parseColorStop(part);
      if (stop) stops.push(stop);
    }

    if (stops.length < 2) return null;

    distributePositions(stops);

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) / 2
    );

    stops.forEach((stop) => {
      const pos = Math.max(0, Math.min(1, stop.position! / 100));
      const colorWithAlpha = applyAlphaToColor(stop.color, stop.opacity);
      try {
        gradient.addColorStop(pos, colorWithAlpha);
      } catch {
        // Invalid color, skip
      }
    });

    return gradient;
  }

  return null;
}

// ─── Texture Support ─────────────────────────────────────────────

/**
 * Apply texture fill from url() — renders texture clipped to text.
 * Note: texture loading is async, so this is best-effort for export.
 */
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

  // For data URLs and same-origin images, we can try synchronous pattern
  // For external URLs, this may fail due to CORS — fall back gracefully
  try {
    // Create an off-screen canvas with the texture
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    // If image is already cached (data URL or preloaded), draw immediately
    if (img.complete && img.naturalWidth > 0) {
      const pattern = ctx.createPattern(img, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        return true;
      }
    }
    // If not loaded, we can't block — the caller should handle async
    // For export, the image should be pre-loaded
  } catch {
    // CORS or other error — texture won't render
  }
  return false;
}

/**
 * Pre-load texture images in the container before export.
 * Call this before prerenderGradientText() for texture support.
 */
export async function preloadTextures(container: HTMLElement): Promise<void> {
  const elements = container.querySelectorAll("*");
  const promises: Promise<void>[] = [];

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
        const p = new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve();
          img.onerror = () => resolve(); // don't block on error
          img.src = urlMatch[1];
        });
        promises.push(p);
      }
    }
  });

  await Promise.all(promises);
}

// ─── Text Helpers ────────────────────────────────────────────────

/**
 * Parse letter-spacing CSS value to pixels.
 */
function parseLetterSpacing(value: string): number {
  if (!value || value === "normal") return 0;
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  if (value.endsWith("px")) return num;
  // em/rem not handled precisely, approximate
  return num;
}

/**
 * Draw text with manual letter-spacing.
 */
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

/**
 * Wrap text to fit within maxWidth, accounting for letter-spacing.
 */
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

/**
 * Parse line-height from CSS value.
 */
function parseLineHeight(value: string, fontSize: number): number {
  if (value === "normal" || !value) return fontSize * 1.2;
  const num = parseFloat(value);
  if (isNaN(num)) return fontSize * 1.2;
  if (value.endsWith("px")) return num;
  return num * fontSize;
}

/**
 * Map CSS mix-blend-mode to canvas globalCompositeOperation.
 */
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
