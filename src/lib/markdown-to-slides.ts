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

/** Parse a single block into slide elements */
function parseBlock(block: string): ParsedElement[] {
  const elements: ParsedElement[] = [];
  const lines = block.split("\n");

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

  return elements;
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
      const elements = parseBlock(block);
      if (elements.length === 0) continue;

      slides.push({
        elements: elements.map((el) => {
          if (el.type === "ContentImage") {
            return {
              type: "ContentImage" as const,
              source: el.source,
              style: el.style,
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
      });
    }

    return slides.length > 0 ? slides : null;
  } catch (err) {
    console.error("parseMarkdownToSlides error:", err);
    return null;
  }
}
