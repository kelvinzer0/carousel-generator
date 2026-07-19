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
 * Apply canvas-based blur at the correct z-index position.
 *
 * backdrop-filter: blur() only affects content BEHIND the element (lower z-index),
 * leaving foreground content (higher z-index) sharp. To simulate this in canvas:
 *
 * 1. Identify all layers above the blur (foreground) and below (background)
 * 2. Render background layers to a temp canvas, apply Gaussian blur
 * 3. Paint blurred background back, then composite foreground on top
 *
 * Since html-to-image captures a flat composited canvas, we approximate by:
 * - Using the blur layer's DOM position to determine which rendered children
 *   are "behind" vs "in front" of the blur
 * - Separating foreground pixels, blurring the remaining canvas,
 *   then compositing foreground back on top
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

  const w = canvas.width;
  const h = canvas.height;
  if (w <= 0 || h <= 0) return;

  // Blur layers use absolute inset-0 and should cover the full slide.
  // Use canvas dimensions directly (more reliable than getBoundingClientRect
  // which can return 0 height when parent has only absolute children).
  const cx = 0;
  const cy = 0;
  const cw = w;
  const ch = h;

  // slideRect needed for foreground element position calculation
  const slideRect = slideElement.getBoundingClientRect();

  // Process each blur layer in DOM order
  blurLayers.forEach((el) => {
    const blurEl = el as HTMLElement;
    const radius = parseInt(blurEl.dataset.blurRadius || "10", 10);
    if (radius <= 0) return;

    // Collect foreground regions (elements rendered AFTER the blur layer in DOM).
    // These should remain sharp and be composited on top of the blur.
    const foregroundRects: { x: number; y: number; w: number; h: number }[] = [];
    const parent = blurEl.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const blurIndex = siblings.indexOf(blurEl);
      for (let i = blurIndex + 1; i < siblings.length; i++) {
        const sib = siblings[i] as HTMLElement;
        if (!sib || sib.dataset.blurLayer === "true") continue;
        const sibRect = sib.getBoundingClientRect();
        const sx = Math.round((sibRect.left - slideRect.left) * scale);
        const sy = Math.round((sibRect.top - slideRect.top) * scale);
        const sw = Math.round(sibRect.width * scale);
        const sh = Math.round(sibRect.height * scale);
        if (sw > 0 && sh > 0) {
          foregroundRects.push({ x: sx, y: sy, w: sw, h: sh });
        }
      }
    }

    // Also capture content ABOVE the blur layer's parent container
    // (e.g., PageFrame content: title, subtitle, description, footer)
    const blurContainer = blurEl.closest('[style*="z-index"]') || blurEl.parentElement?.parentElement;
    if (blurContainer) {
      let sibling = blurContainer.nextElementSibling;
      while (sibling) {
        const sibRect = (sibling as HTMLElement).getBoundingClientRect();
        const sx = Math.round((sibRect.left - slideRect.left) * scale);
        const sy = Math.round((sibRect.top - slideRect.top) * scale);
        const sw = Math.round(sibRect.width * scale);
        const sh = Math.round(sibRect.height * scale);
        if (sw > 0 && sh > 0) {
          foregroundRects.push({ x: sx, y: sy, w: sw, h: sh });
        }
        sibling = sibling.nextElementSibling;
      }
    }

    // 1. Save foreground pixels from the blur region
    const foregroundData: ImageData[] = [];
    foregroundRects.forEach((r) => {
      const ix = Math.max(0, r.x);
      const iy = Math.max(0, r.y);
      const iw = Math.min(r.w, w - ix);
      const ih = Math.min(r.h, h - iy);
      if (iw > 0 && ih > 0) {
        foregroundData.push(ctx.getImageData(ix, iy, iw, ih));
      }
    });

    // 2. Extract the blur region, blur it, paint back.
    // Use a DOM canvas (not OffscreenCanvas) because ctx.filter
    // is unreliable with OffscreenCanvas in many browsers.
    const regionData = ctx.getImageData(cx, cy, cw, ch);
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = cw;
    tmpCanvas.height = ch;
    const tmpCtx = tmpCanvas.getContext("2d")!;
    tmpCtx.putImageData(regionData, 0, 0);

    // Clear the blur region on main canvas
    ctx.clearRect(cx, cy, cw, ch);

    // Draw blurred region back using a second temp canvas
    // (ctx.filter only works when drawing FROM a source, not on putImageData)
    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = cw;
    blurCanvas.height = ch;
    const blurCtx = blurCanvas.getContext("2d")!;
    blurCtx.filter = `blur(${radius}px)`;
    blurCtx.drawImage(tmpCanvas, 0, 0);

    ctx.drawImage(blurCanvas, cx, cy);

    // Cleanup temp canvases
    tmpCanvas.remove();
    blurCanvas.remove();

    // 3. Apply tint overlay on the blurred region
    const bgColor = blurEl.style.backgroundColor;
    if (bgColor && bgColor !== "transparent" && bgColor !== "rgba(0, 0, 0, 0)") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(cx, cy, cw, ch);
    }

    // 4. Restore foreground pixels on top of the blur
    let fi = 0;
    foregroundRects.forEach((r) => {
      const ix = Math.max(0, r.x);
      const iy = Math.max(0, r.y);
      const iw = Math.min(r.w, w - ix);
      const ih = Math.min(r.h, h - iy);
      if (iw > 0 && ih > 0 && fi < foregroundData.length) {
        ctx.putImageData(foregroundData[fi], ix, iy);
        fi++;
      }
    });
  });
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
