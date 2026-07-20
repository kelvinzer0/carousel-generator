/**
 * Google Fonts - Dynamic Loader
 * 
 * Fonts are loaded on-demand via Google Fonts CSS API.
 * No API key required, no build-time imports needed.
 */

// Top Google Fonts - curated list for carousel design
export const GOOGLE_FONTS: Record<string, { name: string; category: string; weights: number[] }> = {
  // Sans-Serif
  Inter: { name: "Inter", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Roboto: { name: "Roboto", category: "sans-serif", weights: [400, 500, 700, 900] },
  Montserrat: { name: "Montserrat", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Poppins: { name: "Poppins", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Open_Sans: { name: "Open Sans", category: "sans-serif", weights: [400, 500, 600, 700, 800] },
  Lato: { name: "Lato", category: "sans-serif", weights: [400, 700, 900] },
  Nunito: { name: "Nunito", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Raleway: { name: "Raleway", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Work_Sans: { name: "Work Sans", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  DM_Sans: { name: "DM Sans", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Outfit: { name: "Outfit", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Plus_Jakarta_Sans: { name: "Plus Jakarta Sans", category: "sans-serif", weights: [400, 500, 600, 700, 800] },
  Space_Grotesk: { name: "Space Grotesk", category: "sans-serif", weights: [400, 500, 600, 700] },
  Manrope: { name: "Manrope", category: "sans-serif", weights: [400, 500, 600, 700, 800] },
  Figtree: { name: "Figtree", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Urbanist: { name: "Urbanist", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Sora: { name: "Sora", category: "sans-serif", weights: [400, 500, 600, 700, 800] },
  Albert_Sans: { name: "Albert Sans", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Barlow: { name: "Barlow", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Rubik: { name: "Rubik", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Exo_2: { name: "Exo 2", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Josefin_Sans: { name: "Josefin Sans", category: "sans-serif", weights: [400, 500, 600, 700] },
  Cabin: { name: "Cabin", category: "sans-serif", weights: [400, 500, 600, 700] },
  Karla: { name: "Karla", category: "sans-serif", weights: [400, 500, 600, 700, 800] },
  Quicksand: { name: "Quicksand", category: "sans-serif", weights: [400, 500, 600, 700] },
  Mulish: { name: "Mulish", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Fira_Sans: { name: "Fira Sans", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Nunito_Sans: { name: "Nunito Sans", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  PT_Sans: { name: "PT Sans", category: "sans-serif", weights: [400, 700] },
  Mukta: { name: "Mukta", category: "sans-serif", weights: [400, 500, 600, 700, 800] },
  Oxygen: { name: "Oxygen", category: "sans-serif", weights: [400, 700] },
  Asap: { name: "Asap", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Yanone_Kaffeesatz: { name: "Yanone Kaffeesatz", category: "sans-serif", weights: [400, 500, 600, 700] },
  Bebas_Neue: { name: "Bebas Neue", category: "sans-serif", weights: [400] },
  Oswald: { name: "Oswald", category: "sans-serif", weights: [400, 500, 600, 700] },
  Barlow_Condensed: { name: "Barlow Condensed", category: "sans-serif", weights: [400, 500, 600, 700, 800, 900] },
  Roboto_Condensed: { name: "Roboto Condensed", category: "sans-serif", weights: [400, 500, 600, 700] },
  PT_Serif: { name: "PT Serif", category: "sans-serif", weights: [400, 700] },
  
  // Serif
  Playfair_Display: { name: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  Merriweather: { name: "Merriweather", category: "serif", weights: [400, 700, 900] },
  Lora: { name: "Lora", category: "serif", weights: [400, 500, 600, 700] },
  DM_Serif_Display: { name: "DM Serif Display", category: "serif", weights: [400] },
  EB_Garamond: { name: "EB Garamond", category: "serif", weights: [400, 500, 600, 700, 800] },
  Cormorant_Garamond: { name: "Cormorant Garamond", category: "serif", weights: [400, 500, 600, 700] },
  Libre_Baskerville: { name: "Libre Baskerville", category: "serif", weights: [400, 700] },
  Crimson_Text: { name: "Crimson Text", category: "serif", weights: [400, 600, 700] },
  Source_Serif_4: { name: "Source Serif 4", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  Noto_Serif: { name: "Noto Serif", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  Vollkorn: { name: "Vollkorn", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  Bitter: { name: "Bitter", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  Rokkitt: { name: "Rokkitt", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  Spectral: { name: "Spectral", category: "serif", weights: [400, 500, 600, 700, 800] },
  Cardo: { name: "Cardo", category: "serif", weights: [400, 700] },
  Old_Standard_TT: { name: "Old Standard TT", category: "serif", weights: [400, 700] },
  Ultra: { name: "Ultra", category: "serif", weights: [400] },
  
  // Display
  Syne: { name: "Syne", category: "display", weights: [400, 500, 600, 700, 800] },
  Archivo_Black: { name: "Archivo Black", category: "display", weights: [400] },
  Righteous: { name: "Righteous", category: "display", weights: [400] },
  Bungee: { name: "Bungee", category: "display", weights: [400] },
  Lobster: { name: "Lobster", category: "display", weights: [400] },
  Pacifico: { name: "Pacifico", category: "display", weights: [400] },
  Permanent_Marker: { name: "Permanent Marker", category: "display", weights: [400] },
  Abril_Fatface: { name: "Abril Fatface", category: "display", weights: [400] },
  Passion_One: { name: "Passion One", category: "display", weights: [400, 700, 900] },
  Fredoka: { name: "Fredoka", category: "display", weights: [400, 500, 600, 700] },
  Bangers: { name: "Bangers", category: "display", weights: [400] },
  Titan_One: { name: "Titan One", category: "display", weights: [400] },
  Alfa_Slab_One: { name: "Alfa Slab One", category: "display", weights: [400] },
  Anton: { name: "Anton", category: "display", weights: [400] },
  Acme: { name: "Acme", category: "display", weights: [400] },
  Teko: { name: "Teko", category: "display", weights: [400, 500, 600, 700] },
  
  // Monospace
  Fira_Code: { name: "Fira Code", category: "monospace", weights: [400, 500, 600, 700] },
  JetBrains_Mono: { name: "JetBrains Mono", category: "monospace", weights: [400, 500, 600, 700, 800] },
  Source_Code_Pro: { name: "Source Code Pro", category: "monospace", weights: [400, 500, 600, 700, 800, 900] },
  Space_Mono: { name: "Space Mono", category: "monospace", weights: [400, 700] },
  
  // Handwriting
  Caveat: { name: "Caveat", category: "handwriting", weights: [400, 500, 600, 700] },
  Dancing_Script: { name: "Dancing Script", category: "handwriting", weights: [400, 500, 600, 700] },
  Satisfy: { name: "Satisfy", category: "handwriting", weights: [400] },
  Great_Vibes: { name: "Great Vibes", category: "handwriting", weights: [400] },
  Sacramento: { name: "Sacramento", category: "handwriting", weights: [400] },
  Indie_Flower: { name: "Indie Flower", category: "handwriting", weights: [400] },
  Shadows_Into_Light: { name: "Shadows Into Light", category: "handwriting", weights: [400] },
};

// Cache for loaded fonts to avoid duplicate <link> tags
const loadedFonts = new Set<string>();
// Cache promises to avoid duplicate loads
const pendingFonts = new Map<string, Promise<void>>();

/**
 * Build font descriptor strings for document.fonts.load()
 * e.g. "700 1em Inter", "400 1em DM Serif Display"
 */
function getFontDescriptors(fontInfo: { name: string; weights: number[] }): string[] {
  return fontInfo.weights.map((w) => `${w} 1em "${fontInfo.name}"`);
}

/**
 * Dynamically load a Google Font via CSS API.
 * Resolves only after the font is truly available in document.fonts.
 */
export function loadGoogleFont(fontId: string): Promise<void> {
  // Already fully loaded
  if (loadedFonts.has(fontId)) {
    return Promise.resolve();
  }

  // Return existing pending promise
  const existing = pendingFonts.get(fontId);
  if (existing) return existing;

  const fontInfo = GOOGLE_FONTS[fontId];
  if (!fontInfo) {
    return Promise.reject(new Error(`Font ${fontId} not found in Google Fonts list`));
  }

  const fontName = fontInfo.name.replace(/ /g, "+");
  const weights = fontInfo.weights.join(";");
  const url = `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weights}&display=swap`;

  const promise = new Promise<void>((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;

    link.onload = async () => {
      try {
        // Wait until at least one weight is truly loaded in the browser
        const descriptors = getFontDescriptors(fontInfo);
        await Promise.allSettled(
          descriptors.map((d) => document.fonts.load(d))
        );
        loadedFonts.add(fontId);
        resolve();
      } catch {
        // Still mark as resolved even if fonts.load fails (e.g. some browsers)
        loadedFonts.add(fontId);
        resolve();
      }
    };

    link.onerror = () => {
      pendingFonts.delete(fontId);
      reject(new Error(`Failed to load font: ${fontInfo.name}`));
    };

    document.head.appendChild(link);
  });

  pendingFonts.set(fontId, promise);
  // Clean up pending map once settled
  promise.finally(() => pendingFonts.delete(fontId));

  return promise;
}

/**
 * Get CSS font-family value for a font ID
 */
export function getFontFamily(fontId: string): string {
  const fontInfo = GOOGLE_FONTS[fontId];
  if (!fontInfo) return "sans-serif";
  
  // Handle multi-word font names that need quotes
  const name = fontInfo.name;
  if (name.includes(" ")) {
    return `"${name}", ${fontInfo.category}`;
  }
  return `${name}, ${fontInfo.category}`;
}

/**
 * Preload a list of fonts (for initial render)
 */
export async function preloadFonts(fontIds: string[]): Promise<void> {
  await Promise.allSettled(fontIds.map((id) => loadGoogleFont(id)));
}
