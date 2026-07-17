/**
 * Render gradient/texture text to canvas for export.
 * html-to-image doesn't support background-clip: text in SVG foreignObject,
 * so we pre-render gradient text elements to canvas before capture.
 */

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
        // Hide original, insert canvas
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

  // Return restore function
  return () => {
    replacements.forEach(({ original, canvas }) => {
      original.style.visibility = "";
      canvas.remove();
    });
  };
}

/**
 * Render an element with gradient/texture text to a canvas.
 */
function renderElementToCanvas(
  el: HTMLElement,
  computed: CSSStyleDeclaration
): HTMLCanvasElement | null {
  const width = el.offsetWidth;
  const height = el.offsetHeight;

  if (width === 0 || height === 0) return null;

  const canvas = document.createElement("canvas");
  const scale = 2; // Higher quality
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(scale, scale);

  // Get text content
  const text = el.textContent || "";
  if (!text.trim()) return null;

  // Get font properties
  const fontSize = computed.fontSize;
  const fontFamily = computed.fontFamily;
  const fontWeight = computed.fontWeight;
  const fontStyle = computed.fontStyle || "normal";
  const letterSpacing = computed.letterSpacing;
  const lineHeight = computed.lineHeight;
  const textAlign = computed.textAlign || "left";

  ctx.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
  ctx.textBaseline = "top";

  // Create gradient
  const backgroundImage = computed.backgroundImage;
  if (backgroundImage && backgroundImage !== "none") {
    const gradient = createGradientFromCSS(ctx, backgroundImage, width, height);
    if (gradient) {
      ctx.fillStyle = gradient;
    }
  }

  // Handle text alignment
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

  // Wrap text
  const lines = wrapText(ctx, text, width);
  const lineHeightPx = parseLineHeight(lineHeight, parseFloat(fontSize));
  let y = 0;

  lines.forEach((line) => {
    ctx.fillText(line, x, y);
    y += lineHeightPx;
  });

  return canvas;
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
  const linearMatch = css.match(
    /linear-gradient\(([^)]+)\)/
  );
  if (linearMatch) {
    const parts = linearMatch[1].split(",").map((s) => s.trim());
    const direction = parts[0];

    // Determine gradient coordinates based on direction
    let x1 = 0, y1 = 0, x2 = width, y2 = 0;
    if (direction.includes("to right")) {
      x1 = 0; y1 = 0; x2 = width; y2 = 0;
    } else if (direction.includes("to left")) {
      x1 = width; y1 = 0; x2 = 0; y2 = 0;
    } else if (direction.includes("to bottom")) {
      x1 = 0; y1 = 0; x2 = 0; y2 = height;
    } else if (direction.includes("to top")) {
      x1 = 0; y1 = height; x2 = 0; y2 = 0;
    } else if (direction.includes("to bottom right")) {
      x1 = 0; y1 = 0; x2 = width; y2 = height;
    } else if (direction.includes("135deg")) {
      x1 = 0; y1 = height; x2 = width; y2 = 0;
    } else {
      // Default to left-right
      x1 = 0; y1 = 0; x2 = width; y2 = 0;
    }

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

    // Parse color stops
    const colorParts = parts.slice(1);
    colorParts.forEach((part) => {
      const stopMatch = part.match(
        /(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|[a-z]+)\s+(\d+)%/
      );
      if (stopMatch) {
        gradient.addColorStop(parseInt(stopMatch[2]) / 100, stopMatch[1]);
      }
    });

    return gradient;
  }

  // Parse radial-gradient
  const radialMatch = css.match(
    /radial-gradient\(([^)]+)\)/
  );
  if (radialMatch) {
    const parts = radialMatch[1].split(",").map((s) => s.trim());
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    );

    const colorParts = parts.slice(1);
    colorParts.forEach((part) => {
      const stopMatch = part.match(
        /(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|[a-z]+)\s+(\d+)%/
      );
      if (stopMatch) {
        gradient.addColorStop(parseInt(stopMatch[2]) / 100, stopMatch[1]);
      }
    });

    return gradient;
  }

  return null;
}

/**
 * Wrap text to fit within maxWidth.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? currentLine + " " + word : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

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
  return num * fontSize; // unitless multiplier
}
