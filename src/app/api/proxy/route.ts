import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    let url = new URL(request.url);
    let imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse("URL Not provided", { status: 400 });
    }

    // Validate URL is a valid image URL
    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return new NextResponse("Only HTTP/HTTPS URLs allowed", { status: 400 });
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CarouselGenerator/1.0)",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch: ${response.status}`, {
        status: 502,
      });
    }

    const contentType = response.headers.get("Content-Type");
    if (!contentType || !contentType.startsWith("image")) {
      return new NextResponse("Content type must be image", {
        status: 400,
      });
    }

    const headers = new Headers();
    // Allow from any origin for canvas usage
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=86400");

    return new NextResponse(response.body, {
      status: 200,
      statusText: "OK",
      headers,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Proxy error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
