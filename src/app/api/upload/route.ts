import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const REMIXPOST_HOST =
  process.env.HOST_REMIXPOST || "https://automate.warunglakku.com";
const REMIXPOST_API_KEY =
  process.env.API_KEY_REMIXPOST || "";

export async function POST(request: NextRequest) {
  try {
    if (!REMIXPOST_API_KEY) {
      return NextResponse.json(
        { success: false, error: "API key not configured on server" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderPath = (formData.get("folder_path") as string) || "carousel-exports";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Forward to RemixPost API
    const upstreamForm = new FormData();
    upstreamForm.append("file", file, file.name);
    upstreamForm.append("folder_path", folderPath);

    const response = await fetch(`${REMIXPOST_HOST}/api/v1/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REMIXPOST_API_KEY}`,
      },
      body: upstreamForm,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          error: `RemixPost returned ${response.status}: ${text || response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Upload proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
