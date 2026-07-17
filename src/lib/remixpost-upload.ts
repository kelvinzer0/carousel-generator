/**
 * Upload media files to RemixPost API via local proxy (no CORS issues).
 */

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
 * Upload a single file (Blob) to RemixPost via /api/upload proxy.
 */
export async function uploadToRemixPost(
  file: Blob,
  filename: string,
  folderPath: string = "carousel-exports"
): Promise<RemixPostUploadResult> {
  try {
    const formData = new FormData();
    formData.append("file", file, filename);
    formData.append("folder_path", folderPath);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}

/**
 * Upload a PDF blob to RemixPost.
 */
export async function uploadPdfToRemixPost(
  pdfBlob: Blob,
  filename: string,
  folderPath: string = "carousel-exports/pdf"
): Promise<RemixPostUploadResult> {
  return uploadToRemixPost(pdfBlob, `${filename}.pdf`, folderPath);
}

/**
 * Upload multiple image blobs as individual files to RemixPost.
 */
export async function uploadImagesToRemixPost(
  images: { blob: Blob; filename: string }[],
  format: string,
  folderPath: string = "carousel-exports"
): Promise<RemixPostUploadResult[]> {
  const results: RemixPostUploadResult[] = [];

  for (const img of images) {
    const result = await uploadToRemixPost(img.blob, img.filename, folderPath);
    results.push(result);
  }

  return results;
}
