/**
 * Parse markdown text into carousel slides.
 *
 * Heading (# / ##) starts a new slide.
 * Images (![alt](url)) become ContentImage elements.
 * Other text becomes Description elements.
 */

import { z } from "zod";
import { MultiSlideSchema } from "@/lib/validation/slide-schema";
import { ImageInputType } from "@/lib/validation/image-schema";

type FontSize = "Small" | "Medium" | "Large";
type TextAlign = "Left" | "Center" | "Right";

interface TextStyle {
  fontSize: FontSize;
  align: TextAlign;
}

type ParsedElement =
  | { type: "Title"; text: string; style: TextStyle }
  | { type: "Subtitle"; text: string; style: TextStyle }
  | { type: "Description"; text: string; style: TextStyle }
  | {
      type: "ContentImage";
      source: { src: string; type: ImageInputType };
      style: { opacity: number; objectFit: "Cover" };
      censorAreas: { x: number; y: number; width: number; height: number }[];
    };

/** Split markdown into slide blocks by top-level headings */
function splitIntoBlocks(markdown: string): string[] {
  const lines = markdown.split("\n");
  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^#{1,2}\s+/.test(line) && !/^#{3,}\s+/.test(line)) {
      if (current.length > 0) {
        blocks.push(current.join("\n").trim());
      }
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    blocks.push(current.join("\n").trim());
  }

  return blocks.filter((b) => b.length > 0);
}

/** Extract decorative emojis from <!-- emojis: ... --> comments */
function extractDecorativeEmojis(block: string): string[] {
  const emojiRegex = /<!--\s*emojis?:\s*([^>]+)-->/i;
  const match = block.match(emojiRegex);
  if (!match) return [];

  // Extract individual emoji characters
  const emojiStr = match[1].trim();
  const emojis: string[] = [];
  // Match emoji characters (including compound emojis)
  const emojiChars = emojiStr.match(/\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu);
  if (emojiChars) {
    emojis.push(...emojiChars);
  }
  return emojis;
}

/** Remove <!-- emojis: ... --> comments from text */
function stripEmojiComments(text: string): string {
  return text.replace(/<!--\s*emojis?:\s*[^>]*-->/gi, "").trim();
}

/** Parse a single block into slide elements */
function parseBlock(block: string): { elements: ParsedElement[]; decorativeEmojis: string[] } {
  const elements: ParsedElement[] = [];
  const cleanedBlock = stripEmojiComments(block);
  const lines = cleanedBlock.split("\n");

  const decorativeEmojis = extractDecorativeEmojis(block);

  let hasTitle = false;
  const textLines: string[] = [];

  const flushText = (defaultAlign: TextAlign = "Left") => {
    if (textLines.length > 0) {
      const desc = textLines.join("\n").trim();
      if (desc) {
        elements.push({
          type: "Description",
          text: desc,
          style: { fontSize: "Medium", align: defaultAlign },
        });
      }
      textLines.length = 0;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Heading → Title or Subtitle
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushText();
      const level = headingMatch[1].length;
      const text = headingMatch[2].replace(/[*_~`]/g, "");
      elements.push({
        type: level === 1 ? "Title" : "Subtitle",
        text,
        style: {
          fontSize: level === 1 ? "Large" : "Medium",
          align: "Center",
        },
      });
      hasTitle = true;
      continue;
    }

    // Image → ContentImage
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      flushText();
      elements.push({
        type: "ContentImage",
        source: { src: imgMatch[2], type: ImageInputType.Url },
        style: { opacity: 100, objectFit: "Cover" },
        censorAreas: [],
      });
      continue;
    }

    textLines.push(trimmed);
  }

  flushText();

  // If no title found, promote first Description to Subtitle
  if (!hasTitle) {
    const descIdx = elements.findIndex((e) => e.type === "Description");
    if (descIdx >= 0) {
      const desc = elements[descIdx] as Extract<ParsedElement, { type: "Description" }>;
      elements[descIdx] = {
        type: "Subtitle",
        text: desc.text,
        style: { fontSize: "Medium", align: "Center" },
      };
    }
  }

  return { elements, decorativeEmojis };
}

/** Estimate pixel height of an element */
function estimateElementHeight(el: ParsedElement): number {
  switch (el.type) {
    case "Title":
      return 60;
    case "Subtitle":
      return 45;
    case "Description": {
      // Estimate: ~20px per line, count newlines + bullet count
      const lines = el.text.split("\n").length;
      return Math.max(40, lines * 24);
    }
    case "ContentImage":
      return 160; // h-40 = 10rem
    default:
      return 40;
  }
}

/** Slide height budget (padding + footer + gaps) */
const SLIDE_PADDING = 80; // 40px top + 40px bottom
const FOOTER_HEIGHT = 30;
const ELEMENT_GAP = 8;
const MIN_IMAGE_SPACE = 180; // image + gap

/** Check if slide has room for an image */
function hasRoomForImage(elements: ParsedElement[], totalHeight: number): boolean {
  const usedHeight = elements.reduce((sum, el) => sum + estimateElementHeight(el), 0);
  const gaps = Math.max(0, elements.length - 1) * ELEMENT_GAP;
  const estimatedTotal = usedHeight + gaps + SLIDE_PADDING + FOOTER_HEIGHT;
  // Available is roughly 1080px for standard carousels
  const availableHeight = 1080;
  return (availableHeight - estimatedTotal) >= MIN_IMAGE_SPACE;
}

/**
 * Redistribute images across slides.
 * If a slide is too full, move images to the next slide.
 */
function redistributeImages(
  slides: z.infer<typeof MultiSlideSchema>
): z.infer<typeof MultiSlideSchema> {
  const result: z.infer<typeof MultiSlideSchema> = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const elements = slide.elements;

    // Separate images from text elements
    const textElements = elements.filter((el) => el.type !== "ContentImage");
    const imageElements = elements.filter((el) => el.type === "ContentImage");

    if (imageElements.length === 0) {
      // No images, keep as-is
      result.push(slide);
      continue;
    }

    // Check if all images fit on current slide
    const imagesThatFit: typeof imageElements = [];
    const imagesOverflow: typeof imageElements = [];

    // Estimate height with text elements
    const textHeight = textElements.reduce(
      (sum, el) => sum + estimateElementHeight(el as ParsedElement),
      0
    );
    const textGaps = Math.max(0, textElements.length - 1) * ELEMENT_GAP;
    const baseHeight = textHeight + textGaps + SLIDE_PADDING + FOOTER_HEIGHT;
    const availableHeight = 1080;
    let remainingSpace = availableHeight - baseHeight;

    for (const img of imageElements) {
      const imgHeight = 160 + ELEMENT_GAP;
      if (remainingSpace >= imgHeight) {
        imagesThatFit.push(img);
        remainingSpace -= imgHeight;
      } else {
        imagesOverflow.push(img);
      }
    }

    // Current slide: text elements + images that fit
    const slideElements = [...textElements, ...imagesThatFit];
    if (slideElements.length > 0) {
      result.push({
        ...slide,
        elements: slideElements,
      });
    }

    // Overflow images → next slide(s)
    if (imagesOverflow.length > 0) {
      // Check if next slide exists and has room
      const nextSlide = slides[i + 1];
      if (nextSlide) {
        // Insert overflow images at the beginning of next slide
        const nextElements = [...imagesOverflow, ...nextSlide.elements];
        slides[i + 1] = { ...nextSlide, elements: nextElements };
      } else {
        // Create new slide for overflow images
        result.push({
          elements: imagesOverflow,
          backgroundImage: {
            type: "Image" as const,
            source: { src: "", type: ImageInputType.Url },
            style: { opacity: 30 },
          },
          decorativeEmojis: slide.decorativeEmojis,
        });
      }
    }
  }

  return result;
}

/** Main parser: markdown string → carousel slides */
export function parseMarkdownToSlides(
  markdown: string
): z.infer<typeof MultiSlideSchema> | null {
  try {
    const blocks = splitIntoBlocks(markdown);
    if (blocks.length === 0) return null;

    const slides: z.infer<typeof MultiSlideSchema> = [];

    for (const block of blocks) {
      const { elements, decorativeEmojis } = parseBlock(block);
      if (elements.length === 0) continue;

      slides.push({
        elements: elements.map((el) => {
          if (el.type === "ContentImage") {
            return {
              type: "ContentImage" as const,
              source: el.source,
              style: el.style,
              censorAreas: [],
            };
          }
          return {
            type: el.type,
            text: el.text,
            style: el.style,
          };
        }),
        backgroundImage: {
          type: "Image" as const,
          source: { src: "", type: ImageInputType.Url },
          style: { opacity: 30 },
        },
        decorativeEmojis: decorativeEmojis.length > 0 ? decorativeEmojis : undefined,
      });
    }

    // Redistribute images — move overflow images to next slides
    const redistributed = redistributeImages(slides);

    return redistributed.length > 0 ? redistributed : null;
  } catch (err) {
    console.error("parseMarkdownToSlides error:", err);
    return null;
  }
}
