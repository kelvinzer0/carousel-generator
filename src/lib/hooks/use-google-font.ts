import { useEffect, useState } from "react";
import { loadGoogleFont, getFontFamily } from "@/lib/google-fonts";

/**
 * Hook to dynamically load a Google Font and return its font-family CSS value.
 * Falls back to generic family while loading.
 */
export function useGoogleFont(fontId: string | undefined) {
  const [fontFamily, setFontFamily] = useState<string>("sans-serif");

  useEffect(() => {
    if (!fontId) return;

    // Immediately set the font family (even before load completes)
    // so the browser can start rendering with the right font
    setFontFamily(getFontFamily(fontId));

    loadGoogleFont(fontId).catch((err) => {
      console.warn("Failed to load font:", fontId, err);
    });
  }, [fontId]);

  return fontFamily;
}
