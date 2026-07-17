/**
 * Upload media files to RemixPost API.
 */

const REMIXPOST_HOST =
  process.env.NEXT_PUBLIC_HOST_REMIXPOST || "https://automate.warunglakku.com";
const REMIXPOST_API_KEY =
  process.env.NEXT_PUBLIC_API_KEY_REMIXPOST || "";

export interface RemixPostUploadResult {
  success: boolean;
  data?: {
    id?: string;
    url?: string;
    [key: string]: unknown;
  };
  error?: string;
}

/**
 * Upload a single file (Blob) to RemixPost.
 */
export async function uploadToRemixPost(
  file: Blob,
  filename: string,
  folderPath: string = "carousel-exports"
): Promise<RemixPostUploadResult> {
  if (!REMIXPOST_API_KEY) {
    return { success: false, error: "API key not configured. Set NEXT_PUBLIC_API_KEY_REMIXPOST" };
  }

  try {
    const formData = new FormData();
    formData.append("file", file, filename);
    formData.append("folder_path", folderPath);

    const response = await fetch(`${REMIXPOST_HOST}/api/v1/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REMIXPOST_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        success: false,
        error: `Upload failed (${response.status}): ${text || response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown upload error",
    };
  }
}

/**
 * Upload a PDF blob to RemixPost.
 */
export async function uploadPdfToRemixPost(
  pdfBlob: Blob,
  filename: string
): Promise<RemixPostUploadResult> {
  return uploadToRemixPost(pdfBlob, `${filename}.pdf`, "carousel-exports/pdf");
}

/**
 * Upload multiple image blobs as individual files to RemixPost.
 */
export async function uploadImagesToRemixPost(
  images: { blob: Blob; filename: string }[],
  format: string
): Promise<RemixPostUploadResult[]> {
  const results: RemixPostUploadResult[] = [];

  for (const img of images) {
    const result = await uploadToRemixPost(
      img.blob,
      img.filename,
      `carousel-exports/${format}`
    );
    results.push(result);
  }

  return results;
}
