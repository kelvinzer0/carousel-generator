import { NextRequest, NextResponse } from "next/server";

const CHROMIUM_PATH = "/opt/ms-playwright/chromium-1223/chrome-linux64/chrome";

interface ExportRequest {
  html: string;
  format: "pdf" | "png" | "jpeg";
  width: number;
  height: number;
  quality?: number;
  scale?: number;
  fonts?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { html, format, width, height, quality = 95, scale = 3, fonts = [] } = body;

    if (!html || !format || !width || !height) {
      return NextResponse.json(
        { error: "Missing required fields: html, format, width, height" },
        { status: 400 }
      );
    }

    const { chromium } = await import("playwright");
    const browser = await chromium.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    try {
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: scale,
      });
      const page = await context.newPage();

      // Build full HTML with fonts and styles
      const fontLinks = fonts.map(f => `<link href="https://fonts.googleapis.com/css2?family=${f.replace(/_/g, "+")}:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">`).join("\n");

      const fullHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    width: ${width}px; 
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .slide-page {
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    position: relative;
    page-break-after: always;
  }
  .slide-page:last-child {
    page-break-after: auto;
  }
  textarea {
    border: none;
    outline: none;
    resize: none;
    background: transparent;
    overflow: hidden;
  }
  ${fontLinks}
</style>
</head>
<body>${html}</body>
</html>`;

      await page.setContent(fullHTML, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);

      if (format === "pdf") {
        const pdf = await page.pdf({
          width: `${width}px`,
          height: `${height}px`,
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });

        return new NextResponse(pdf, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="carousel.pdf"`,
          },
        });
      } else {
        const screenshot = await page.screenshot({
          type: format === "jpeg" ? "jpeg" : "png",
          quality: format === "jpeg" ? quality : undefined,
          fullPage: true,
        });

        return new NextResponse(screenshot, {
          headers: {
            "Content-Type": format === "jpeg" ? "image/jpeg" : "image/png",
            "Content-Disposition": `attachment; filename="carousel.${format === "jpeg" ? "jpg" : "png"}`,
          },
        });
      }
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Export failed", details: String(error) },
      { status: 500 }
    );
  }
}
