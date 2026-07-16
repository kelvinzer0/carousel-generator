import { NextRequest, NextResponse } from "next/server";

// Path to Playwright's bundled Chromium
const CHROMIUM_PATH = "/opt/ms-playwright/chromium-1223/chrome-linux64/chrome";

interface ExportRequest {
  url: string;
  format: "pdf" | "png" | "jpeg" | "webp";
  width: number;
  height: number;
  quality?: number;
  scale?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const {
      url,
      format,
      width,
      height,
      quality = 95,
      scale = 3,
    } = body;

    if (!url || !format || !width || !height) {
      return NextResponse.json(
        { error: "Missing required fields: url, format, width, height" },
        { status: 400 }
      );
    }

    // Dynamic import to avoid bundling issues
    const { chromium } = await import("playwright");

    const browser = await chromium.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    try {
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: scale,
      });
      const page = await context.newPage();

      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Wait for fonts to load
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1000);

      if (format === "pdf") {
        const pdf = await page.pdf({
          width: `${width}px`,
          height: `${height}px`,
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          preferCSSPageSize: false,
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

        const mimeType =
          format === "jpeg"
            ? "image/jpeg"
            : format === "webp"
            ? "image/webp"
            : "image/png";

        return new NextResponse(screenshot, {
          headers: {
            "Content-Type": mimeType,
            "Content-Disposition": `attachment; filename="carousel.${format}"`,
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
