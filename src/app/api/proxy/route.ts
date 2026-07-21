import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Allowed domains for image proxy — prevents SSRF abuse
const ALLOWED_DOMAINS = [
  "images.unsplash.com",
  "images.pexels.com",
  "pixabay.com",
  "cdn.pixabay.com",
  "placehold.co",
  "placehold.co",
  "picsum.photos",
  "loremflickr.com",
  "upload.wikimedia.org",
  "cdn.pixabay.com",
];

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

    // Security: only proxy allowed domains (prevents SSRF)
    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith("." + domain)
    );
    if (!isAllowed) {
      return new NextResponse("Domain not allowed", { status: 403 });
    }

    const response = await fetch(imageUrl, {
      headers: {
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Referer": parsed.origin + "/",
        "Sec-Ch-Ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": "\"Windows\"",
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
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
