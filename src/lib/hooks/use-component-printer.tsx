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
 * Collect blur layer metadata from the DOM for pre-processing.
 */
interface BlurLayerInfo {
  element: HTMLElement;
  radius: number;
  zIndex: number;
  bgColor: string;
  hasTint: boolean;
}

function getBlurLayerInfos(slideElement: HTMLElement): BlurLayerInfo[] {
  const blurLayers = slideElement.querySelectorAll('[data-blur-layer="true"]');
  const infos: BlurLayerInfo[] = [];
  blurLayers.forEach((el) => {
    const blurEl = el as HTMLElement;
    const radius = parseInt(blurEl.dataset.blurRadius || "10", 10);
    if (radius <= 0) return;
    const zIndex = parseInt(blurEl.dataset.blurZindex || "0", 10);
    const bgColor = blurEl.style.backgroundColor;
    const hasTint =
      !!bgColor &&
      bgColor !== "transparent" &&
      bgColor !== "rgba(0, 0, 0, 0)";
    infos.push({ element: blurEl, radius, zIndex, bgColor, hasTint });
  });
  return infos;
}

/**
 * DOM-level pre-processing to simulate backdrop-filter: blur() for export.
 *
 * Problem: html-to-image cannot render CSS backdrop-filter. The old approach
 * tried to post-process the canvas, but since html-to-image produces a flat
 * composited bitmap, it was impossible to separate foreground from background
 * content — the blur leaked into text and other foreground elements.
 *
 * Solution: Before capture, we convert the backdrop-filter effect into standard
 * CSS filter: blur() applied directly to each background layer element that sits
 * below the blur layer. Since each layer is absolutely positioned, applying
 * filter: blur() to it blurs only that layer's content — the same effect as
 * backdrop-filter blurring all content behind the element.
 *
 * Steps per blur layer:
 *   1. Find all sibling elements in the background container with a lower
 *      z-index (these are "behind" the blur layer).
 *   2. Add filter: blur(Npx) to each of those elements' inline styles.
 *   3. Remove backdrop-filter from the blur layer itself (keep backgroundColor
 *      for the tint overlay).
 *   4. Foreground content (text, images with higher z-index) is untouched.
 *
 * After capture, all inline style changes are reverted.
 *
 * @returns A cleanup function that restores styles to their original state.
 */
function preProcessBlurLayers(slideElement: HTMLElement): () => void {
  const blurInfos = getBlurLayerInfos(slideElement);
  if (blurInfos.length === 0) return () => {};

  const bgContainer = slideElement.querySelector(
    '[data-bg-layers-container="true"]'
  ) as HTMLElement | null;

  if (!bgContainer) return () => {};

  const styleRestores: { el: HTMLElement; prop: string; orig: string }[] = [];

  blurInfos.forEach((info) => {
    // Find siblings in the background container that are BELOW this blur layer
    const siblings = Array.from(bgContainer.children) as HTMLElement[];

    for (const sib of siblings) {
      if (sib === info.element) continue;
      const sibZIndex = parseInt(sib.style.zIndex || "0", 10);
      if (sibZIndex < info.zIndex) {
        // Save original filter value and apply blur
        styleRestores.push({
          el: sib,
          prop: "filter",
          orig: sib.style.filter,
        });
        // Combine with any existing filter
        const existingFilter = sib.style.filter;
        sib.style.filter = existingFilter
          ? `${existingFilter} blur(${info.radius}px)`
          : `blur(${info.radius}px)`;
      }
    }

    // Remove backdrop-filter from the blur layer (keep backgroundColor for tint)
    styleRestores.push({
      el: info.element,
      prop: "backdropFilter",
      orig: info.element.style.backdropFilter,
    });
    styleRestores.push({
      el: info.element,
      prop: "WebkitBackdropFilter",
      orig: (info.element.style as any).WebkitBackdropFilter || "",
    });
    info.element.style.backdropFilter = "none";
    (info.element.style as any).WebkitBackdropFilter = "none";
  });

  return () => {
    // Restore all modified styles in reverse order
    for (let i = styleRestores.length - 1; i >= 0; i--) {
      const { el, prop, orig } = styleRestores[i];
      (el.style as any)[prop] = orig;
    }
  };
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

  const baseOptions: HtmlToImageOptions = {
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
      // Pre-process: convert backdrop-filter to CSS filter on wrapper divs
      // so html-to-image can render the blur correctly in a single pass.
      const restoreBlurPreProcess = preProcessBlurLayers(slideElement);

      const canvas = await toCanvas(slideElement, baseOptions);

      // Restore DOM after capture
      restoreBlurPreProcess();

      return canvasToDataUrl(canvas, format, quality);
    });
  } finally {
    restoreGradient();
    restoreUI();
  }
}

/** Convert a canvas to a data URL in the specified format. */
function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  format: ExportImageFormat,
  quality: number
): string {
  if (format === "png") {
    return canvas.toDataURL("image/png");
  } else if (format === "webp") {
    return canvas.toDataURL("image/webp", quality);
  } else {
    return canvas.toDataURL("image/jpeg", quality);
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
