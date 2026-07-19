import { useCallback, useRef } from "react";
import { z } from "zod";
import { MultiSlideSchema } from "@/lib/validation/slide-schema";

/**
 * Refetch external images to local blob URLs.
 * Uses the /api/proxy route to avoid CORS issues.
 * Browser fetches images and converts to blob:// URLs for local use.
 */
export function useRefetchImages() {
  const blobCache = useRef<Map<string, string>>(new Map());

  const refetchImage = useCallback(
    async (url: string): Promise<string> => {
      // Already cached
      if (blobCache.current.has(url)) {
        return blobCache.current.get(url)!;
      }

      // Already a blob or data URL — skip
      if (url.startsWith("blob:") || url.startsWith("data:")) {
        return url;
      }

      // Empty or placeholder — skip
      if (!url || url.includes("placehold.co")) {
        return url;
      }

      try {
        // Use proxy route to avoid CORS
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) {
          console.warn(`Failed to fetch image: ${url} (${response.status})`);
          return url; // Keep original on failure
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Cache the result
        blobCache.current.set(url, blobUrl);

        return blobUrl;
      } catch (err) {
        console.warn(`Image fetch error: ${url}`, err);
        return url; // Keep original on failure
      }
    },
    []
  );

  const refetchSlides = useCallback(
    async (
      slides: z.infer<typeof MultiSlideSchema>
    ): Promise<z.infer<typeof MultiSlideSchema>> => {
      const updated = await Promise.all(
        slides.map(async (slide) => {
          const updatedElements = await Promise.all(
            slide.elements.map(async (element) => {
              if (element.type === "ContentImage" && element.source.src) {
                const localUrl = await refetchImage(element.source.src);
                return {
                  ...element,
                  source: { ...element.source, src: localUrl },
                };
              }
              return element;
            })
          );

          // Also refetch background image if present
          let bgImage = slide.backgroundImage;
          if (bgImage?.source.src) {
            const localBgUrl = await refetchImage(bgImage.source.src);
            bgImage = {
              ...bgImage,
              source: { ...bgImage.source, src: localBgUrl },
            };
          }

          return {
            ...slide,
            elements: updatedElements,
            backgroundImage: bgImage,
          };
        })
      );

      return updated;
    },
    [refetchImage]
  );

  const revokeAll = useCallback(() => {
    blobCache.current.forEach((blobUrl) => {
      URL.revokeObjectURL(blobUrl);
    });
    blobCache.current.clear();
  }, []);

  return { refetchSlides, refetchImage, revokeAll };
}
