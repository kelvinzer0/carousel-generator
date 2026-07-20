import { useEffect, useState } from "react";
import { loadGoogleFont, getFontFamily } from "@/lib/google-fonts";

/**
 * Hook to dynamically load a Google Font and return its font-family CSS value.
 * - Immediately returns the correct CSS font-family string (so the browser starts
 *   fetching the font right away via the CSS property).
 * - Forces a re-render once the font is truly downloaded so React repaints with
 *   the actual typeface instead of the system fallback.
 */
export function useGoogleFont(fontId: string | undefined) {
  // Start with the correct font-family string immediately (not "sans-serif"),
  // so the browser begins using the right font declaration right away.
  const [fontFamily, setFontFamily] = useState<string>(() =>
    fontId ? getFontFamily(fontId) : "sans-serif"
  );
  // Counter that increments when the font finishes loading, triggering a re-render.
  const [, setLoadedVersion] = useState(0);

  useEffect(() => {
    if (!fontId) return;

    // Always update CSS font-family in case fontId changed
    setFontFamily(getFontFamily(fontId));

    // Load the font and then force a repaint so the browser uses the real typeface
    loadGoogleFont(fontId)
      .then(() => {
        setLoadedVersion((v) => v + 1);
      })
      .catch((err) => {
        console.warn("Failed to load font:", fontId, err);
      });
  }, [fontId]);

  return fontFamily;
}
