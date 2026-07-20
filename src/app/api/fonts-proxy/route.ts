import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Allowed origins for security — only Google Fonts domains
const ALLOWED_ORIGINS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return new NextResponse("Missing url param", { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    // Security: only proxy Google Fonts domains
    const isAllowed = ALLOWED_ORIGINS.some((origin) =>
      parsed.hostname === origin || parsed.hostname.endsWith("." + origin)
    );
    if (!isAllowed) {
      return new NextResponse("Domain not allowed", { status: 403 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return new NextResponse("Only HTTP/HTTPS allowed", { status: 400 });
    }

    const response = await fetch(targetUrl, {
      headers: {
        // Use a modern Chrome UA so Google Fonts returns woff2 (smallest/fastest)
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/css,*/*;q=0.1",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Upstream error: ${response.status}`, {
        status: 502,
      });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";

    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Content-Type", contentType);
    // Cache font files for 7 days, CSS for 1 hour
    const isFont = /font|woff|ttf|otf/.test(contentType);
    headers.set(
      "Cache-Control",
      isFont ? "public, max-age=604800" : "public, max-age=3600"
    );

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Fonts proxy error:", error);
    return new NextResponse("Proxy error", { status: 500 });
  }
}
