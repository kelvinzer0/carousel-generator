import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  MultiSlideSchema,
  UnstyledMultiSlideSchema,
} from "@/lib/validation/slide-schema";
import { UnstyledDocumentSchema } from "@/lib/validation/document-schema";
import {
  UnstyledTitleSchema,
  UnstyledDescriptionSchema,
  UnstyledSubtitleSchema,
} from "@/lib/validation/text-schema";

const carouselFunctionSchema = {
  name: "carouselCreator",
  description: "Creates a carousel with multiple slides for a given topic.",
  parameters: zodToJsonSchema(UnstyledDocumentSchema, {
    definitions: {
      UnstyledTitleSchema,
      UnstyledSubtitleSchema,
      UnstyledDescriptionSchema,
    },
  }),
};

const SYSTEM_PROMPT = `
Create a Carousel of slides following these rules

Arguments Schema Instructions:
 - Respect the argument schema and only use the allowed values for element type: 'Title', 'Subtitle', 'Description'.
 - Respect the 'maxLength' value which is the maximum number of characters in a given field. Write less than 70% of that number.
 - Each slide MUST include a 'decorativeEmojis' array with 3-6 relevant emojis.

Slide Structure:
 - FIRST slide: Intro/Hook — catchy title + 1-2 teaser bullets
 - LAST slide: Outro/CTA — summary + "Follow for more" + "Save this"

Guidelines:
 - 5-10 slides.
 - Each slide has 2-3 elements: [Title, Description], [Title, Subtitle], [Subtitle, Description].
 - Do NOT add emojis to text. Keep text clean.
 - Description bullets: concise but readable.

You MUST respond with valid JSON only, no markdown, no explanation. The JSON must follow this schema:
${JSON.stringify(zodToJsonSchema(UnstyledDocumentSchema, {
  definitions: {
    UnstyledTitleSchema,
    UnstyledSubtitleSchema,
    UnstyledDescriptionSchema,
  },
}), null, 2)}
`;

const SYSTEM_PROMPT_WITH_IMAGES = `
Create a Carousel of slides from the provided markdown content.

CRITICAL IMAGE RULES:
 - The markdown contains images in format ![alt](url)
 - You MUST preserve EVERY image URL exactly as provided
 - Each image becomes a ContentImage element with source: { src: "URL", type: "Url" }
 - DO NOT drop, replace, or modify any image URLs
 - If input has 3 images, output MUST have 3 images

Arguments Schema Instructions:
 - Respect the argument schema and only use the allowed values for element type: 'Title', 'Subtitle', 'Description', 'ContentImage'.
 - Respect the 'maxLength' value which is the maximum number of characters in a given field. Write less than 70% of that number.
 - Each slide MUST include a 'decorativeEmojis' array with 3-6 relevant emojis.

Slide Structure:
 - FIRST slide: Intro/Hook — catchy title + 1-2 teaser bullets
 - LAST slide: Outro/CTA — summary + "Follow for more" + "Save this"
 - Middle slides: content from the article

Guidelines:
 - 5-10 slides based on content length.
 - Each slide has 2-3 elements (Title, Subtitle, Description, or ContentImage).
 - Do NOT add emojis to text. Keep text clean.
 - Description bullets should be concise but readable.

You MUST respond with valid JSON only, no markdown, no explanation. The JSON must follow this schema:
${JSON.stringify(zodToJsonSchema(UnstyledDocumentSchema, {
  definitions: {
    UnstyledTitleSchema,
    UnstyledSubtitleSchema,
    UnstyledDescriptionSchema,
  },
}), null, 2)}
`;

export async function generateCarouselSlides(
  topicPrompt: string,
  apiKey: string
): Promise<z.infer<typeof MultiSlideSchema> | null> {
  const model = startModelClient(apiKey);

  let result;
  try {
    result = await model.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(topicPrompt),
    ]);
  } catch (err) {
    console.error("Model invocation failed:", err);
    return null;
  }

  // Try function_call first (OpenAI-style)
  let rawArgs = result.additional_kwargs?.function_call?.arguments;

  // Fallback: extract JSON from content (for providers that don't support function calling)
  if (!rawArgs) {
    const content = typeof result.content === "string" ? result.content : "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      rawArgs = jsonMatch[0];
    }
  }

  if (!rawArgs) {
    console.error("No JSON found in model response");
    console.error("Content:", result.content);
    console.error("Additional kwargs:", result.additional_kwargs);
    return null;
  }

  let jsonParsed: unknown;
  try {
    jsonParsed = JSON.parse(rawArgs);
  } catch (err) {
    console.error("JSON parse failed:", err);
    console.error("Raw args:", rawArgs);
    return null;
  }

  const unstyledDocumentParseResult =
    UnstyledDocumentSchema.safeParse(jsonParsed);
  if (unstyledDocumentParseResult.success) {
    return MultiSlideSchema.parse(unstyledDocumentParseResult.data.slides);
  } else {
    console.error("Schema validation failed:", unstyledDocumentParseResult.error);
    console.error("Parsed JSON:", jsonParsed);
    return null;
  }
}

const MARKDOWN_IMPROVE_PROMPT = `
You are a carousel content writer. Transform the user's input into well-structured markdown for a carousel.

## Format
- # Title starts a new slide
- - bullet points for descriptions
- **bold** for key terms
- ![alt](url) for images

## CRITICAL: Image Handling
- PRESERVE ALL existing ![alt](url) from the original input
- DO NOT remove, replace, or modify any image URLs
- Place images on the slide where they make most sense
- If original has images, your output MUST have the same images

## Structure
- 5-10 slides
- Each slide: 1 title + 2-4 bullets
- 3-5 bullets per slide max
- FIRST slide: Intro/Hook — catchy title that makes people want to keep reading
- LAST slide: Outro/CTA — "Follow for more" / "Save this for later"
- After each slide, add: <!-- emojis: 🎯 💡 ⚡ --> (3-6 relevant emojis)

## Writing Style
- Clean text, NO emojis in titles or bullets
- Concise but not cryptic — keep it readable
- Remove filler words (the, a, your, first, then)
- Commands: show the command, brief context after colon
  - Good: "Install: bash <(curl -sL URL)"
  - Bad: "Execute the install script by running: bash <(curl -sL URL)"

Output ONLY the markdown. No explanation.
`;

export async function improveMarkdown(
  roughInput: string,
  apiKey: string
): Promise<string | null> {
  const model = startModelClient(apiKey);

  // Extract original image URLs for validation
  const originalImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  const originalImages: string[] = [];
  let imgMatch;
  while ((imgMatch = originalImageRegex.exec(roughInput)) !== null) {
    originalImages.push(imgMatch[1]);
  }

  try {
    const result = await model.invoke([
      new SystemMessage(MARKDOWN_IMPROVE_PROMPT),
      new HumanMessage(roughInput),
    ]);

    const content = typeof result.content === "string" ? result.content : "";

    // Extract markdown from response (strip code blocks if present)
    const cleaned = content
      .replace(/^```(?:markdown)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim();

    if (cleaned.length === 0) return null;

    // Validate image preservation
    if (originalImages.length > 0) {
      const missingImages = originalImages.filter(
        (url) => !cleaned.includes(url)
      );
      if (missingImages.length > 0) {
        console.warn(
          `AI dropped ${missingImages.length} image(s):`,
          missingImages
        );
        // Re-add missing images at the end
        const imageMarkdown = missingImages
          .map((url) => `![](${url})`)
          .join("\n");
        return cleaned + "\n\n" + imageMarkdown;
      }
    }

    return cleaned;
  } catch (err) {
    console.error("improveMarkdown failed:", err);
    return null;
  }
}

function startModelClient(api_key: string) {
  const baseURL = process.env.OPENAI_BASE_URL || undefined;
  const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const model = new ChatOpenAI({
    openAIApiKey: api_key,
    modelName,
    temperature: 0,
    ...(baseURL && { configuration: { baseURL } }),
  });

  // Try to bind function calling, but don't fail if provider doesn't support it
  try {
    return model.bind({
      functions: [carouselFunctionSchema],
      function_call: { name: "carouselCreator" },
    });
  } catch {
    // Fallback: use model without function calling
    return model;
  }
}
