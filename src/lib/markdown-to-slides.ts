/**
 * Parse markdown text into carousel slides.
 *
 * Heading (# / ##) starts a new slide.
 * Images (![alt](url)) become ContentImage elements.
 * Other text becomes Description elements.
 *
 * Example input:
 *   # First Slide Title
 *   Some description text
 *   ![Hero](https://example.com/hero.jpg)
 *
 *   # Second Slide
 *   More content
 *   ![Photo](https://example.com/photo.png)
 */

import { z } from "zod";
import { MultiSlideSchema } from "@/lib/validation/slide-schema";
import { ElementType } from "@/lib/validation/element-type";

import { ImageInputType } from "@/lib/validation/image-schema";

interface SlideElement {
  type: "Title" | "Subtitle" | "Description" | "ContentImage" | "Image";
  text?: string;
  source?: { src: string; type: ImageInputType };
  style?: Record<string, unknown>;
}

interface Slide {
  elements: SlideElement[];
}

/** Split markdown into slide blocks by top-level headings */
function splitIntoBlocks(markdown: string): string[] {
  const lines = markdown.split("\n");
  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    // New slide on # or ## heading (but not ### or deeper)
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
function parseBlock(block: string): SlideElement[] {
  const elements: SlideElement[] = [];
  const lines = block.split("\n");

  let hasTitle = false;
  const textLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Heading → Title or Subtitle
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      // Flush accumulated text as Description
      if (textLines.length > 0) {
        const desc = textLines.join("\n").trim();
        if (desc) {
          elements.push({
            type: "Description",
            text: desc,
            style: { fontSize: "Medium", align: "Left" },
          });
        }
        textLines.length = 0;
      }

      const level = headingMatch[1].length;
      const text = headingMatch[2].replace(/[*_~`]/g, ""); // strip inline md
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
      // Flush accumulated text
      if (textLines.length > 0) {
        const desc = textLines.join("\n").trim();
        if (desc) {
          elements.push({
            type: "Description",
            text: desc,
            style: { fontSize: "Medium", align: "Left" },
          });
        }
        textLines.length = 0;
      }

      elements.push({
        type: "ContentImage",
        source: { src: imgMatch[2], type: ImageInputType.Url },
        style: { opacity: 100, objectFit: "Cover" },
      });
      continue;
    }

    // Plain text or inline markdown
    textLines.push(trimmed);
  }

  // Flush remaining text
  if (textLines.length > 0) {
    const desc = textLines.join("\n").trim();
    if (desc) {
      elements.push({
        type: "Description",
        text: desc,
        style: { fontSize: "Medium", align: "Left" },
      });
    }
  }

  // If no title found, promote first Description to Subtitle
  if (!hasTitle) {
    const descIdx = elements.findIndex((e) => e.type === "Description");
    if (descIdx >= 0) {
      elements[descIdx] = {
        ...elements[descIdx],
        type: "Subtitle",
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
              source: el.source as { src: string; type: ImageInputType },
              style: {
                opacity: 100,
                objectFit: "Cover" as const,
              },
            };
          }
          return {
            type: el.type as "Title" | "Subtitle" | "Description",
            text: el.text || "",
            style: el.style || { fontSize: "Medium", align: "Left" },
          };
        }),
        backgroundImage: { type: "Image", source: { src: "", type: ImageInputType.Url }, style: { opacity: 30 } },
      });
    }

    return slides.length > 0 ? slides : null;
  } catch (err) {
    console.error("parseMarkdownToSlides error:", err);
    return null;
  }
}
