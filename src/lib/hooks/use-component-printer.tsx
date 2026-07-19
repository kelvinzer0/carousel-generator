import React from "react";
import { SIZE_PRESETS, SizePresetKey } from "@/lib/page-size";
import { useFieldArrayValues } from "@/lib/hooks/use-field-array-values";
import { useFormContext } from "react-hook-form";
import { DocumentFormReturn } from "@/lib/document-form-types";
import { toCanvas } from "html-to-image";
import { Options as HtmlToImageOptions } from "html-to-image/lib/types";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { prerenderGradientText, preloadTextures } from "@/lib/prerender-gradient-text";
import {
  uploadPdfToRemixPost,
  uploadImagesToRemixPost,
  RemixPostUploadResult,
} from "@/lib/remixpost-upload";

export type ExportImageFormat = "png" | "webp" | "jpeg";

const FORMAT_EXT: Record<ExportImageFormat, string> = {
  png: "png",
  webp: "webp",
  jpeg: "jpg",
};

const IMAGE_EXPORT_SCALE = 4;

function getSlideElements(container: HTMLElement): HTMLElement[] {
  const items = container.querySelectorAll('[id^="carousel-item-"]');
  return Array.from(items) as HTMLElement[];
}

function hideUIElements(slideElement: HTMLElement): () => void {
  // Use a CSS class + style tag to hide UI elements during capture.
  // This survives React re-renders (unlike holding stale DOM references).
  const styleId = "hide-ui-for-capture";
  const existing = document.getElementById(styleId);
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    [id^="add-element-"],
    [id^="element-menubar-"],
    [id^="slide-menubar-"],
    [data-slot="tooltip-trigger"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  return () => {
    const s = document.getElementById(styleId);
    if (s) s.remove();
  };
}

/**
 * Temporarily patches CSSStyleSheet.prototype.cssRules to gracefully
 * skip cross-origin stylesheets (e.g. Google Fonts) that throw
 * SecurityError when accessed from a different origin.
 */
function withSafeStylesheets<T>(fn: () => Promise<T>): Promise<T> {
  const sheets = document.styleSheets;
  const origDesc = Object.getOwnPropertyDescriptor(
    CSSStyleSheet.prototype,
    "cssRules"
  );
  if (!origDesc) return fn();

  // Replace getter with one that returns empty list on CORS errors
  Object.defineProperty(CSSStyleSheet.prototype, "cssRules", {
    get() {
      try {
        return origDesc.get!.call(this);
      } catch {
        return [];
      }
    },
    configurable: true,
  });

  return fn().finally(() => {
    // Restore original getter
    Object.defineProperty(CSSStyleSheet.prototype, "cssRules", origDesc);
  });
}

/**
 * Apply canvas-based blur to regions marked with data-blur-layer.
 * backdrop-filter is not supported by html-to-image/canvas,
 * so we post-process the captured canvas to simulate the effect.
 */
function applyBlurToCanvas(
  canvas: HTMLCanvasElement,
  slideElement: HTMLElement,
  scale: number
): void {
  const blurLayers = slideElement.querySelectorAll('[data-blur-layer="true"]');
  if (!blurLayers.length) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const slideRect = slideElement.getBoundingClientRect();

  blurLayers.forEach((el) => {
    const blurEl = el as HTMLElement;
    const radius = parseInt(blurEl.dataset.blurRadius || "10", 10);
    const rect = blurEl.getBoundingClientRect();

    // Position relative to slide, scaled to canvas
    const x = Math.round((rect.left - slideRect.left) * scale);
    const y = Math.round((rect.top - slideRect.top) * scale);
    const w = Math.round(rect.width * scale);
    const h = Math.round(rect.height * scale);

    if (w <= 0 || h <= 0 || radius <= 0) return;

    // Extract the region, blur it, put it back
    const region = ctx.getImageData(x, y, w, h);

    // Apply stack blur (fast approximation of Gaussian)
    // Don't multiply by scale — blur radius should match the CSS visual size
    stackBlur(region.data, w, h, radius);

    ctx.putImageData(region, x, y);

    // Apply tint overlay if present
    const bgColor = blurEl.style.backgroundColor;
    if (bgColor && bgColor !== "transparent") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, w, h);
    }
  });
}

/**
 * Fast stack blur (approximation of Gaussian blur for canvas ImageData).
 * Based on Mario Klingemann's StackBlur algorithm.
 */
function stackBlur(data: Uint8ClampedArray, w: number, h: number, radius: number): void {
  if (radius < 1) return;
  radius = Math.round(radius);

  const wm = w - 1;
  const hm = h - 1;
  const div = radius + radius + 1;
  const r = new Int32Array(w * h);
  const g = new Int32Array(w * h);
  const b = new Int32Array(w * h);
  const a = new Int32Array(w * h);

  const rSum = new Int32Array(div);
  const gSum = new Int32Array(div);
  const bSum = new Int32Array(div);
  const aSum = new Int32Array(div);

  // Horizontal pass
  for (let y = 0; y < h; y++) {
    let inSumR = 0, inSumG = 0, inSumB = 0, inSumA = 0;
    let outSumR = 0, outSumG = 0, outSumB = 0, outSumA = 0;
    let sumR = 0, sumG = 0, sumB = 0, sumA = 0;

    for (let i = -radius; i <= radius; i++) {
      const idx = (y * w + Math.min(Math.max(i, 0), wm)) * 4;
      const val = radius + 1 - Math.abs(i);
      sumR += data[idx] * val;
      sumG += data[idx + 1] * val;
      sumB += data[idx + 2] * val;
      sumA += data[idx + 3] * val;
      if (i > 0) { inSumR += data[idx]; inSumG += data[idx + 1]; inSumB += data[idx + 2]; inSumA += data[idx + 3]; }
      else { outSumR += data[idx]; outSumG += data[idx + 1]; outSumB += data[idx + 2]; outSumA += data[idx + 3]; }
    }

    for (let x = 0; x < w; x++) {
      const idx = (y * w + x);
      r[idx] = Math.round(sumR / div);
      g[idx] = Math.round(sumG / div);
      b[idx] = Math.round(sumB / div);
      a[idx] = Math.round(sumA / div);

      const addIdx = (y * w + Math.min(x + radius + 1, wm)) * 4;
      const remIdx = (y * w + Math.max(x - radius, 0)) * 4;

      sumR += data[addIdx] - data[remIdx];
      sumG += data[addIdx + 1] - data[remIdx + 1];
      sumB += data[addIdx + 2] - data[remIdx + 2];
      sumA += data[addIdx + 3] - data[remIdx + 3];
    }
  }

  // Vertical pass
  for (let x = 0; x < w; x++) {
    let inSumR = 0, inSumG = 0, inSumB = 0, inSumA = 0;
    let outSumR = 0, outSumG = 0, outSumB = 0, outSumA = 0;
    let sumR = 0, sumG = 0, sumB = 0, sumA = 0;

    for (let i = -radius; i <= radius; i++) {
      const idx = (Math.min(Math.max(i, 0), hm) * w + x);
      const val = radius + 1 - Math.abs(i);
      sumR += r[idx] * val;
      sumG += g[idx] * val;
      sumB += b[idx] * val;
      sumA += a[idx] * val;
      if (i > 0) { inSumR += r[idx]; inSumG += g[idx]; inSumB += b[idx]; inSumA += a[idx]; }
      else { outSumR += r[idx]; outSumG += g[idx]; outSumB += b[idx]; outSumA += a[idx]; }
    }

    for (let y = 0; y < h; y++) {
      const outIdx = (y * w + x) * 4;
      data[outIdx] = Math.round(sumR / div);
      data[outIdx + 1] = Math.round(sumG / div);
      data[outIdx + 2] = Math.round(sumB / div);
      data[outIdx + 3] = Math.round(sumA / div);

      const addIdx = (Math.min(y + radius + 1, hm) * w + x);
      const remIdx = (Math.max(y - radius, 0) * w + x);

      sumR += r[addIdx] - r[remIdx];
      sumG += g[addIdx] - g[remIdx];
      sumB += b[addIdx] - b[remIdx];
      sumA += a[addIdx] - a[remIdx];
    }
  }
}

async function captureSlideToDataUrl(
  slideElement: HTMLElement,
  format: ExportImageFormat,
  quality: number,
  scale: number = IMAGE_EXPORT_SCALE
): Promise<string> {
  const restoreUI = hideUIElements(slideElement);
  await document.fonts.ready;
  await preloadTextures(slideElement);
  const restoreGradient = prerenderGradientText(slideElement);

  const options: HtmlToImageOptions = {
    width: slideElement.offsetWidth,
    height: slideElement.offsetHeight,
    canvasWidth: slideElement.offsetWidth * scale,
    canvasHeight: slideElement.offsetHeight * scale,
    pixelRatio: scale,
    style: {
      margin: "0",
      padding: "0",
    },
    cacheBust: true,
    // Skip cross-origin stylesheets (e.g. Google Fonts) to avoid
    // SecurityError: Cannot access cssRules on cross-origin CSSStyleSheet
    filter: (node: HTMLElement) => {
      if (node.tagName === "LINK") {
        const href = node.getAttribute("href") || "";
        if (href.startsWith("http") && !href.startsWith(window.location.origin)) {
          return false;
        }
      }
      return true;
    },
  };

  try {
    return await withSafeStylesheets(async () => {
      // Always capture to canvas first (needed for blur post-processing)
      const canvas = await toCanvas(slideElement, options);

      // Apply canvas-based blur for backdrop-filter layers
      applyBlurToCanvas(canvas, slideElement, scale);

      // Convert canvas to desired format
      if (format === "png") {
        return canvas.toDataURL("image/png");
      } else if (format === "webp") {
        return canvas.toDataURL("image/webp", quality);
      } else {
        return canvas.toDataURL("image/jpeg", quality);
      }
    });
  } finally {
    restoreGradient();
    restoreUI();
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

export function useComponentPrinter() {
  const { numPages } = useFieldArrayValues("slides");
  const { watch }: DocumentFormReturn = useFormContext();

  const sizePresetKey = (watch("config.pageSize") ||
    "linkedin") as SizePresetKey;
  const SIZE = SIZE_PRESETS[sizePresetKey] || SIZE_PRESETS.linkedin;

  const [isPrinting, setIsPrinting] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const componentRef = React.useRef(null);

  // ── Download PDF ───────────────────────────────────────────────

  const handlePrint = React.useCallback(async () => {
    const container = document.getElementById("element-to-download-as-pdf");
    if (!container) return;
    const slideElements = getSlideElements(container);
    if (slideElements.length === 0) return;

    setIsPrinting(true);
    try {
      const pdf = new jsPDF({
        unit: "px",
        format: [SIZE.width, SIZE.height],
      });

      for (let i = 0; i < slideElements.length; i++) {
        const slideEl = slideElements[i];
        const pageContent = slideEl.querySelector(
          "[id^='page-base-']"
        ) as HTMLElement;
        if (!pageContent) continue;

        const dataUrl = await captureSlideToDataUrl(
          pageContent,
          "jpeg",
          0.95,
          IMAGE_EXPORT_SCALE
        );

        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", 0, 0, SIZE.width, SIZE.height);
      }

      const filename = watch("filename") || "carousel";
      pdf.save(filename);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsPrinting(false);
    }
  }, [watch, SIZE]);

  // ── Download Images (ZIP) ─────────────────────────────────────

  const exportAsImages = React.useCallback(
    async (format: ExportImageFormat, quality: number = 0.95) => {
      const container = document.getElementById("element-to-download-as-pdf");
      if (!container) return;

      setIsExporting(true);
      try {
        const slideElements = getSlideElements(container);
        if (slideElements.length === 0) return;

        const zip = new JSZip();
        const filename = watch("filename") || "carousel";

        for (let i = 0; i < slideElements.length; i++) {
          const slideEl = slideElements[i];
          const pageContent = slideEl.querySelector(
            "[id^='page-base-']"
          ) as HTMLElement;
          if (!pageContent) continue;

          const dataUrl = await captureSlideToDataUrl(
            pageContent,
            format,
            quality
          );
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const ext = FORMAT_EXT[format];
          const paddedIndex = String(i + 1).padStart(2, "0");
          zip.file(`${filename}-${paddedIndex}.${ext}`, blob);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, `${filename}.zip`);
      } catch (err) {
        console.error("Export failed:", err);
      } finally {
        setIsExporting(false);
      }
    },
    [watch, numPages]
  );

  // ── Upload PDF to RemixPost ───────────────────────────────────

  const uploadPdf = React.useCallback(
    async (folderPath: string): Promise<RemixPostUploadResult> => {
      const container = document.getElementById("element-to-download-as-pdf");
      if (!container) return { success: false, error: "Container not found" };

      const slideElements = getSlideElements(container);
      if (slideElements.length === 0)
        return { success: false, error: "No slides found" };

      setIsUploading(true);
      try {
        const pdf = new jsPDF({
          unit: "px",
          format: [SIZE.width, SIZE.height],
        });

        for (let i = 0; i < slideElements.length; i++) {
          const slideEl = slideElements[i];
          const pageContent = slideEl.querySelector(
            "[id^='page-base-']"
          ) as HTMLElement;
          if (!pageContent) continue;

          const dataUrl = await captureSlideToDataUrl(
            pageContent,
            "jpeg",
            0.95,
            IMAGE_EXPORT_SCALE
          );

          if (i > 0) pdf.addPage();
          pdf.addImage(dataUrl, "JPEG", 0, 0, SIZE.width, SIZE.height);
        }

        const filename = watch("filename") || "carousel";
        const pdfBlob = pdf.output("blob");
        return await uploadPdfToRemixPost(pdfBlob, filename, folderPath);
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "PDF upload failed",
        };
      } finally {
        setIsUploading(false);
      }
    },
    [watch, SIZE]
  );

  // ── Upload Images to RemixPost ────────────────────────────────

  const uploadImages = React.useCallback(
    async (
      format: ExportImageFormat,
      folderPath: string,
      quality: number = 0.95
    ): Promise<RemixPostUploadResult[]> => {
      const container = document.getElementById("element-to-download-as-pdf");
      if (!container) return [{ success: false, error: "Container not found" }];

      const slideElements = getSlideElements(container);
      if (slideElements.length === 0)
        return [{ success: false, error: "No slides found" }];

      setIsUploading(true);
      try {
        const filename = watch("filename") || "carousel";
        const images: { blob: Blob; filename: string }[] = [];

        for (let i = 0; i < slideElements.length; i++) {
          const slideEl = slideElements[i];
          const pageContent = slideEl.querySelector(
            "[id^='page-base-']"
          ) as HTMLElement;
          if (!pageContent) continue;

          const dataUrl = await captureSlideToDataUrl(
            pageContent,
            format,
            quality
          );
          const blob = dataUrlToBlob(dataUrl);
          const ext = FORMAT_EXT[format];
          const paddedIndex = String(i + 1).padStart(2, "0");
          images.push({
            blob,
            filename: `${filename}-${paddedIndex}.${ext}`,
          });
        }

        return await uploadImagesToRemixPost(images, format, folderPath);
      } catch (err) {
        return [
          {
            success: false,
            error: err instanceof Error ? err.message : "Image upload failed",
          },
        ];
      } finally {
        setIsUploading(false);
      }
    },
    [watch, numPages]
  );

  return {
    componentRef,
    handlePrint,
    isPrinting,
    exportAsImages,
    isExporting,
    uploadPdf,
    uploadImages,
    isUploading,
  };
}
