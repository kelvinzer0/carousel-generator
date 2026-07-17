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

export type ExportImageFormat = "png" | "webp" | "jpeg";

const FORMAT_EXT: Record<ExportImageFormat, string> = {
  png: "png",
  webp: "webp",
  jpeg: "jpg",
};

// High quality scale factors
const IMAGE_EXPORT_SCALE = 4; // 4x for high quality export (consistent for both images and PDF)

function getSlideElements(container: HTMLElement): HTMLElement[] {
  const items = container.querySelectorAll('[id^="carousel-item-"]');
  return Array.from(items) as HTMLElement[];
}



/**
 * Hide UI elements in a slide before capture, return restore function.
 */
function hideUIElements(slideElement: HTMLElement): () => void {
  const hidden: { el: HTMLElement; display: string }[] = [];

  // Elements to hide
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
      htmlEl.style.display = 'none';
    });
  });

  // Hide buttons with + or SVG icons
  slideElement.querySelectorAll('button').forEach((btn) => {
    const htmlBtn = btn as HTMLElement;
    const text = htmlBtn.textContent?.trim();
    if (text === '+' || text === '' || htmlBtn.querySelector('svg')) {
      hidden.push({ el: htmlBtn, display: htmlBtn.style.display });
      htmlBtn.style.display = 'none';
    }
  });

  // Return restore function
  return () => {
    hidden.forEach(({ el, display }) => {
      el.style.display = display;
    });
  };
}

/**
 * Capture a slide element to a data URL with high quality settings.
 */
async function captureSlideToDataUrl(
  slideElement: HTMLElement,
  format: ExportImageFormat,
  quality: number,
  scale: number = IMAGE_EXPORT_SCALE
): Promise<string> {
  // Hide UI elements before capture
  const restoreUI = hideUIElements(slideElement);
  // Pre-load texture images, then pre-render gradient text to canvas
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

export function useComponentPrinter() {
  const { numPages } = useFieldArrayValues("slides");
  const { watch }: DocumentFormReturn = useFormContext();

  const sizePresetKey = (watch("config.pageSize") ||
    "linkedin") as SizePresetKey;
  const SIZE = SIZE_PRESETS[sizePresetKey] || SIZE_PRESETS.linkedin;

  const [isPrinting, setIsPrinting] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  // Direct ref for slides container
  const componentRef = React.useRef(null);

  const handlePrint = React.useCallback(async () => {
    const container = document.getElementById("element-to-download-as-pdf");
    if (!container) {
      console.error("Container element not found");
      return;
    }

    const slideElements = getSlideElements(container);
    if (slideElements.length === 0) {
      console.error("No slides found");
      return;
    }

    setIsPrinting(true);
    try {
      console.log("PDF export started, slides:", slideElements.length);
      console.log("SIZE:", SIZE);

      const pdf = new jsPDF({
        unit: "px",
        format: [SIZE.width, SIZE.height],
      });

      for (let i = 0; i < slideElements.length; i++) {
        const slideEl = slideElements[i];
        const pageContent = slideEl.querySelector(
          "[id^='page-base-']"
        ) as HTMLElement;
        if (!pageContent) {
          console.warn("No page-content found for slide", i);
          continue;
        }

        console.log("Capturing slide", i, "size:", pageContent.offsetWidth, "x", pageContent.offsetHeight);
        const dataUrl = await captureSlideToDataUrl(
          pageContent,
          "jpeg",
          0.95,
          IMAGE_EXPORT_SCALE
        );
        console.log("Slide", i, "captured, dataUrl length:", dataUrl.length);

        if (i > 0) pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", 0, 0, SIZE.width, SIZE.height);
      }

      const filename = watch("filename") || "carousel";
      console.log("Saving PDF as:", filename);
      pdf.save(filename);
      console.log("PDF saved successfully");
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsPrinting(false);
    }
  }, [watch, SIZE]);

  const exportAsImages = React.useCallback(
    async (format: ExportImageFormat, quality: number = 0.95) => {
      const container = document.getElementById("element-to-download-as-pdf");
      if (!container) {
        console.error("Container element not found");
        return;
      }

      setIsExporting(true);
      try {
        const slideElements = getSlideElements(container);
        if (slideElements.length === 0) {
          console.error("No slides found");
          return;
        }

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

  return {
    componentRef,
    handlePrint,
    isPrinting,
    exportAsImages,
    isExporting,
  };
}


