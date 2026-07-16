import { NextRequest, NextResponse } from "next/server";
import { chromium, Browser, Page } from "playwright-core";

// Path to Playwright's bundled Chromium
const CHROMIUM_PATH = "/opt/ms-playwright/chromium-1223/chrome-linux/chrome";

interface ExportRequest {
  url: string;
  format: "pdf" | "png" | "jpeg" | "webp";
  width: number;
  height: number;
  quality?: number;
  scale?: number;
}

async function getBrowser(): Promise<Browser> {
  return chromium.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
}

export async function POST(request: NextRequest) {
  let browser: Browser | null = null;

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

    browser = await getBrowser();
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: scale,
    });
    const page: Page = await context.newPage();

    // Navigate to the page
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);

    // Wait a bit for any animations
    await page.waitForTimeout(1000);

    if (format === "pdf") {
      // Generate PDF with exact page size
      const pdf = await page.pdf({
        width: `${width}px`,
        height: `${height}px`,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: false,
      });

      await browser.close();

      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="carousel.pdf"`,
        },
      });
    } else {
      // Generate image
      const screenshot = await page.screenshot({
        type: format === "jpeg" ? "jpeg" : "png",
        quality: format === "jpeg" ? quality : undefined,
        fullPage: true,
      });

      await browser.close();

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
  } catch (error) {
    console.error("Export error:", error);
    if (browser) {
      await browser.close().catch(() => {});
    }
    return NextResponse.json(
      { error: "Export failed", details: String(error) },
      { status: 500 }
    );
  }
}
