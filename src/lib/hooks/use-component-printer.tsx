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
 * Apply canvas-based blur to simulate backdrop-filter: blur().
 *
 * Uses the self-draw + clip technique:
 * 1. Clip to the blur region
 * 2. Set ctx.filter = blur(Npx)
 * 3. Draw the canvas onto itself (filter applies during draw)
 * 4. Overlay tint color
 *
 * This is the simplest and most compatible approach. ctx.filter with
 * drawImage(canvas, ...) is well-supported in modern browsers.
 * No OffscreenCanvas, no getImageData/putImageData needed.
 *
 * Note: backdrop-filter only blurs content BEHIND the element.
 * Since html-to-image produces a flat composited canvas, we blur
 * the entire region. Foreground content (text, images above the blur
 * layer) will also get blurred — this is a known limitation of the
 * canvas post-processing approach. The visual result is still a
 * frosted-glass effect that closely matches the preview.
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

  const slideRect = slideElement.getBoundingClientRect();

  blurLayers.forEach((el) => {
    const blurEl = el as HTMLElement;
    const radius = parseInt(blurEl.dataset.blurRadius || "10", 10);
    if (radius <= 0) return;

    // Get blur region in canvas coordinates
    const blurRect = blurEl.getBoundingClientRect();
    const bx = Math.round((blurRect.left - slideRect.left) * scale);
    const by = Math.round((blurRect.top - slideRect.top) * scale);
    const bw = Math.round(blurRect.width * scale);
    const bh = Math.round(blurRect.height * scale);

    // Fallback to full canvas if getBoundingClientRect returns 0
    // (happens when parent container only has absolute children)
    const rx = bw > 0 && bh > 0 ? Math.max(0, bx) : 0;
    const ry = bw > 0 && bh > 0 ? Math.max(0, by) : 0;
    const rw = bw > 0 && bh > 0 ? Math.min(bw, w - rx) : w;
    const rh = bw > 0 && bh > 0 ? Math.min(bh, h - ry) : h;
    if (rw <= 0 || rh <= 0) return;

    // backdrop-filter: blur() only affects content BEHIND the element.
    // The tint (backgroundColor) sits ON TOP and is NOT blurred.
    //
    // html-to-image renders the tint into the canvas, so we need to:
    // 1. Clear the tint from the canvas (leaving transparent)
    // 2. Blur only the background content
    // 3. Re-apply the tint (sharp, not blurred)
    //
    // Without step 1, the tint gets blurred AND re-applied = double effect.

    const bgColor = blurEl.style.backgroundColor;
    const hasTint = bgColor && bgColor !== "transparent" && bgColor !== "rgba(0, 0, 0, 0)";

    // Step 1: Clear the tint that html-to-image rendered
    if (hasTint) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
      ctx.clearRect(rx, ry, rw, rh);
      ctx.restore();
    }

    // Step 2: Blur the background content (now without tint)
    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();

    // Step 3: Re-apply tint ONCE (sharp, not blurred)
    if (hasTint) {
      ctx.fillStyle = bgColor!;
      ctx.fillRect(rx, ry, rw, rh);
    }
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
