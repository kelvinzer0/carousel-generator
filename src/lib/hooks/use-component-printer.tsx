import React from "react";
import { SIZE_PRESETS, SizePresetKey } from "@/lib/page-size";
import { useFieldArrayValues } from "@/lib/hooks/use-field-array-values";
import { useFormContext } from "react-hook-form";
import { DocumentFormReturn } from "@/lib/document-form-types";
import { toCanvas, toPng, toJpeg } from "html-to-image";
import { Options as HtmlToImageOptions } from "html-to-image/lib/types";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { prerenderGradientText, preloadTextures } from "@/lib/prerender-gradient-text";
import {
  uploadPdfToRemixPost,
  uploadImagesToRemixPost,
  uploadToRemixPost,
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
  const hidden: { el: HTMLElement; display: string }[] = [];

  const selectors = [
    '[id^="add-element-"]',
    '[id^="element-menubar-"]',
    '[id^="slide-menubar-"]',
    '[data-slot="tooltip-trigger"]',
  ];

  selectors.forEach((selector) => {
    slideElement.querySelectorAll(selector).forEach((el) => {
      const htmlEl = el as HTMLElement;
      hidden.push({ el: htmlEl, display: htmlEl.style.display });
      htmlEl.style.display = "none";
    });
  });

  slideElement.querySelectorAll("button").forEach((btn) => {
    const htmlBtn = btn as HTMLElement;
    const text = htmlBtn.textContent?.trim();
    if (text === "+" || text === "" || htmlBtn.querySelector("svg")) {
      hidden.push({ el: htmlBtn, display: htmlBtn.style.display });
      htmlBtn.style.display = "none";
    }
  });

  return () => {
    hidden.forEach(({ el, display }) => {
      el.style.display = display;
    });
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
  };

  try {
    let dataUrl: string;
    if (format === "png") {
      dataUrl = await toPng(slideElement, options);
    } else if (format === "webp") {
      const canvas = await toCanvas(slideElement, options);
      dataUrl = canvas.toDataURL("image/webp", quality);
    } else {
      dataUrl = await toJpeg(slideElement, { ...options, quality });
    }
    return dataUrl;
  } finally {
    restoreGradient();
    restoreUI();
  }
}

/**
 * Convert data URL to Blob.
 */
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

  const uploadPdf = React.useCallback(async (): Promise<RemixPostUploadResult> => {
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
      return await uploadPdfToRemixPost(pdfBlob, filename);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "PDF upload failed",
      };
    } finally {
      setIsUploading(false);
    }
  }, [watch, SIZE]);

  // ── Upload Images to RemixPost ────────────────────────────────

  const uploadImages = React.useCallback(
    async (format: ExportImageFormat, quality: number = 0.95): Promise<RemixPostUploadResult[]> => {
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

        return await uploadImagesToRemixPost(images, format);
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
