import { NextRequest, NextResponse } from "next/server";

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || "";
const PIXABAY_BASE_URL = "https://pixabay.com/api/";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "20";
  const orientation = searchParams.get("orientation") || "horizontal";
  const imageType = searchParams.get("image_type") || "photo";

  if (!PIXABAY_API_KEY) {
    return NextResponse.json(
      { error: "PIXABAY_API_KEY not configured" },
      { status: 500 }
    );
  }

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    key: PIXABAY_API_KEY,
    q: query,
    page,
    per_page: perPage,
    orientation,
    image_type: imageType,
    safesearch: "true",
  });

  try {
    const response = await fetch(`${PIXABAY_BASE_URL}?${params.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Pixabay API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform the response to a simpler format
    const images = data.hits.map((hit: any) => ({
      id: hit.id,
      previewURL: hit.previewURL,
      webformatURL: hit.webformatURL,
      largeImageURL: hit.largeImageURL,
      tags: hit.tags,
      user: hit.user,
      width: hit.imageWidth,
      height: hit.imageHeight,
    }));

    return NextResponse.json({
      total: data.total,
      totalHits: data.totalHits,
      images,
    });
  } catch (error) {
    console.error("Pixabay API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Pixabay" },
      { status: 500 }
    );
  }
}
