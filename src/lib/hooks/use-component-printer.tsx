import React from "react";
import { useReactToPrint } from "react-to-print";
import { SIZE_PRESETS, SizePresetKey } from "@/lib/page-size";
import { useFieldArrayValues } from "@/lib/hooks/use-field-array-values";
import { useFormContext } from "react-hook-form";
import { DocumentFormReturn } from "@/lib/document-form-types";
import { toCanvas, toPng, toJpeg } from "html-to-image";
import { Options as HtmlToImageOptions } from "html-to-image/lib/types";
import { jsPDF, jsPDFOptions } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export type ExportImageFormat = "png" | "webp" | "jpeg";

const FORMAT_EXT: Record<ExportImageFormat, string> = {
  png: "png",
  webp: "webp",
  jpeg: "jpg",
};

// High quality scale factors
const EXPORT_SCALE = 3; // 3x for high quality print (300 DPI equivalent)
const IMAGE_EXPORT_SCALE = 4; // 4x for image exports

type HtmlToPdfOptions = {
  margin: [number, number, number, number];
  filename: string;
  image: { type: string; quality: number };
  htmlToImage: HtmlToImageOptions;
  jsPDF: jsPDFOptions;
};

export const toPx = function toPx(val: number, k: number) {
  return Math.floor(((val * k) / 72) * 96);
};

function getPdfPageSize(opt: HtmlToPdfOptions) {
  // @ts-ignore
  const pageSize = jsPDF.getPageSize(opt.jsPDF);

  if (!pageSize.hasOwnProperty("inner")) {
    pageSize.inner = {
      width: pageSize.width - opt.margin[1] - opt.margin[3],
      height: pageSize.height - opt.margin[0] - opt.margin[2],
    };
    pageSize.inner.px = {
      width: toPx(pageSize.inner.width, pageSize.k),
      height: toPx(pageSize.inner.height, pageSize.k),
    };
    pageSize.inner.ratio = pageSize.inner.height / pageSize.inner.width;
  }

  return pageSize;
}

function canvasToPdf(canvas: HTMLCanvasElement, opt: HtmlToPdfOptions) {
  const pdfPageSize = getPdfPageSize(opt);

  var pxFullHeight = canvas.height;
  var pxPageHeight = Math.floor(canvas.width * pdfPageSize.inner.ratio);
  var nPages = Math.ceil(pxFullHeight / pxPageHeight);
  var pageHeight = pdfPageSize.inner.height;

  var pageCanvas = document.createElement("canvas");
  var pageCtx = pageCanvas.getContext("2d")!;
  pageCanvas.width = canvas.width;
  pageCanvas.height = pxPageHeight;

  const pdf = new jsPDF(opt.jsPDF);

  for (var page = 0; page < nPages; page++) {
    if (page === nPages - 1 && pxFullHeight % pxPageHeight !== 0) {
      pageCanvas.height = pxFullHeight % pxPageHeight;
      pageHeight =
        (pageCanvas.height * pdfPageSize.inner.width) / pageCanvas.width;
    }

    var w = pageCanvas.width;
    var h = pageCanvas.height;

    pageCtx.fillStyle = "white";
    pageCtx.fillRect(0, 0, w, h);
    pageCtx.drawImage(canvas, 0, page * pxPageHeight, w, h, 0, 0, w, h);

    if (page) pdf.addPage();
    var imgData = pageCanvas.toDataURL(
      "image/" + opt.image.type,
      opt.image.quality
    );
    pdf.addImage(
      imgData,
      opt.image.type,
      opt.margin[1],
      opt.margin[0],
      pdfPageSize.inner.width,
      pageHeight
    );
  }
  return pdf;
}

function getSlideElements(container: HTMLElement): HTMLElement[] {
  const items = container.querySelectorAll('[id^="carousel-item-"]');
  return Array.from(items) as HTMLElement[];
}

/**
 * Flatten gradient/texture text to solid colors for export.
 * html-to-image doesn't support background-clip: text in SVG foreignObject.
 * Returns modified elements for restoration.
 */
function flattenGradientText(container: HTMLElement) {
  const elements = container.querySelectorAll("*");
  const modified: { el: HTMLElement; origStyle: string }[] = [];

  elements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const computed = window.getComputedStyle(htmlEl);

    if (
      computed.backgroundClip === "text" ||
      computed.webkitBackgroundClip === "text"
    ) {
      modified.push({
        el: htmlEl,
        origStyle: htmlEl.getAttribute("style") || "",
      });

      const bgImage = computed.backgroundImage;
      let fallbackColor = computed.color || "#000000";

      // Extract first color from gradient
      const colorMatch = bgImage.match(
        /rgb[a]?\([^)]+\)|#[0-9a-fA-F]{3,8}|oklch\([^)]+\)/
      );
      if (colorMatch) {
        fallbackColor = colorMatch[0];
      }

      htmlEl.style.backgroundImage = "none";
      htmlEl.style.backgroundClip = "unset";
      htmlEl.style.webkitBackgroundClip = "unset";
      htmlEl.style.color = fallbackColor;
      htmlEl.style.webkitTextFillColor = fallbackColor;
    }
  });

  return modified;
}

function restoreGradientText(
  modified: { el: HTMLElement; origStyle: string }[]
) {
  modified.forEach(({ el, origStyle }) => {
    el.setAttribute("style", origStyle);
  });
}

/**
 * Embed font-face declarations into the element for export.
 * This ensures fonts are available when rendering to canvas.
 */
function embedFontStyles(doc: Document, element: HTMLElement) {
  const styleSheets = Array.from(doc.styleSheets);
  let fontCSS = "";

  styleSheets.forEach((sheet) => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach((rule) => {
        if (rule instanceof CSSFontFaceRule) {
          fontCSS += rule.cssText + "\n";
        }
      });
    } catch (e) {
      // Cross-origin stylesheet, skip
    }
  });

  if (fontCSS) {
    const style = doc.createElement("style");
    style.textContent = fontCSS;
    element.prepend(style);
  }
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

  const modified = flattenGradientText(slideElement);

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
    restoreGradientText(modified);
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
  const componentRef = React.useRef(null);

  const reactToPrintContent = React.useCallback(() => {
    const current = componentRef.current;

    if (current && typeof current === "object") {
      // @ts-ignore
      const clone = current.cloneNode(true);

      // Clean up the clone for export
      proxyImgSources(clone);
      removeSelectionStyleById(clone, "page-base-");
      removeSelectionStyleById(clone, "content-image-");
      removePaddingStyleById(clone, "carousel-item-");
      removeStyleById(clone, "slide-wrapper-", "px-2");
      removeAllById(clone, "add-slide-");
      removeAllById(clone, "add-element-");
      removeAllById(clone, "element-menubar-");
      removeAllById(clone, "slide-menubar-");

      // Remove any remaining buttons and UI controls
      clone.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent?.trim();
        if (text === '+' || text === '' || btn.querySelector('svg')) {
          btn.remove();
        }
      });

      // Remove tooltip triggers and other UI elements
      clone.querySelectorAll('[data-slot="tooltip-trigger"]').forEach(el => el.remove());

      // Embed fonts for proper rendering
      embedFontStyles(document, clone);
      insertFonts(clone);

      clone.className = "flex flex-col";
      clone.style = {};

      return clone;
    }

    return componentRef.current;
  }, []);

  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    removeAfterPrint: true,
    onBeforePrint: () => setIsPrinting(true),
    onAfterPrint: () => setIsPrinting(false),
    pageStyle: `@page { size: ${SIZE.width}px ${SIZE.height}px; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`,
    print: async (printIframe) => {
      const contentDocument = printIframe.contentDocument;
      if (!contentDocument) {
        console.error("iFrame does not have a document content");
        return;
      }

      const html = contentDocument.getElementById(
        "element-to-download-as-pdf"
      );
      if (!html) {
        console.error("Couldn't find element to convert to PDF");
        return;
      }

      const options: HtmlToPdfOptions = {
        margin: [0, 0, 0, 0],
        filename: watch("filename"),
        image: { type: "webp", quality: 0.98 },
        htmlToImage: {
          height: SIZE.height * numPages,
          width: SIZE.width,
          canvasHeight: SIZE.height * numPages * EXPORT_SCALE,
          canvasWidth: SIZE.width * EXPORT_SCALE,
          pixelRatio: EXPORT_SCALE,
          cacheBust: true,
        },
        jsPDF: { unit: "px", format: [SIZE.width, SIZE.height] },
      };

      const modified = flattenGradientText(html);
      const canvas = await toCanvas(html, options.htmlToImage).catch(
        (err) => {
          console.error("Canvas generation failed:", err);
          return null;
        }
      );
      restoreGradientText(modified);

      if (!canvas) {
        console.error("Failed to create canvas");
        return;
      }

      const pdf = canvasToPdf(canvas, options);
      pdf.save(options.filename);
    },
  });

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

function proxyImgSources(html: HTMLElement) {
  const images = Array.from(
    html.getElementsByTagName("img")
  ) as HTMLImageElement[];
  const url = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

  const externalImages = images.filter(
    (image) =>
      !image.src.startsWith("/") &&
      !image.src.startsWith("data:") &&
      !image.src.startsWith(url)
  );

  externalImages.forEach((image) => {
    try {
      const apiRequestURL = new URL(`${url}/api/proxy`);
      apiRequestURL.searchParams.set("url", image.src);
      image.src = apiRequestURL.toString();
    } catch (e) {
      console.warn("Failed to proxy image:", image.src, e);
    }
  });
}

function removeAllById(html: HTMLElement, id: string) {
  const elements = Array.from(
    html.querySelectorAll(`[id^=${id}]`)
  ) as HTMLDivElement[];
  elements.forEach((element) => {
    element.remove();
  });
}

function removePaddingStyleById(html: HTMLElement, id: string) {
  const classNames = "pl-2 md:pl-4";
  removeStyleById(html, id, classNames);
}

function removeSelectionStyleById(html: HTMLElement, id: string) {
  const classNames = "outline-input ring-2 ring-offset-2 ring-ring";
  removeStyleById(html, id, classNames);
}

function removeStyleById(html: HTMLElement, id: string, classNames: string) {
  const elements = Array.from(
    html.querySelectorAll(`[id^=${id}]`)
  ) as HTMLDivElement[];
  elements.forEach((element) => {
    element.className = removeClassnames(element, classNames);
  });
}

function removeClassnames(element: HTMLDivElement, classNames: string): string {
  return element.className
    .split(" ")
    .filter((el) => !classNames.split(" ").includes(el))
    .join(" ");
}

function insertFonts(element: HTMLElement) {
  const allElements = Array.from(
    element.getElementsByTagName("textarea")
  ) as HTMLTextAreaElement[];

  allElements.forEach(function (element) {
    let tailwindFonts = element.className
      .split(" ")
      .filter((cn) => cn.startsWith("font-"));

    tailwindFonts.forEach((font) => {
      const fontFaceValue = getComputedStyle(
        element.ownerDocument.body
      ).getPropertyValue("--" + font);
      if (fontFaceValue) {
        element.style.fontFamily = fontFaceValue;
      }
    });
  });
}
