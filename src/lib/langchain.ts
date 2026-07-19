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
 - Respect the argument schema and only use the allowed values for element type, which are 'Title', 'Subtitle' and 'Description'.
 - Each slide can use the multiple elements and they can be of different type or not.
 - Respect the 'maxLength' value which is the maximum number of characters in a given field. Write less than 70% of that number.
 - Each slide MUST include a 'decorativeEmojis' array with 3-6 relevant emojis. These will be rendered as decorative background elements.

Slide Structure (REQUIRED):
 - FIRST slide MUST be Intro/Hook: attention-grabbing title + 1-2 teaser bullets
 - LAST slide MUST be Outro/CTA: summary + "Follow for more" + "Save this"

Guidelines:
 - Create 8-15 slides.
 - Each slide has 2-3 different elements. E.g. [Title, Description], or [Title, Subtitle], or [Subtitle, Description].
 - Each slide All the elements in that slide are about that idea.
 - Adapt, reorganize and rephrase the content to fit the slides format.
 - Do NOT add emojis to Title, Subtitle, or Description text. Keep text clean.
 - Don't add slide numbers.
 - Description element text should be short (under 8 words per bullet).
 - Remove filler words. Be direct.

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
The markdown may contain image links in the format ![alt](url).
Preserve image URLs exactly as provided — they will be rendered as content images.

Arguments Schema Instructions:
 - Respect the argument schema and only use the allowed values for element type: 'Title', 'Subtitle', 'Description'.
 - Respect the 'maxLength' value which is the maximum number of characters in a given field. Write less than 70% of that number.
 - Each slide MUST include a 'decorativeEmojis' array with 3-6 relevant emojis. These will be rendered as decorative background elements.

Slide Structure (REQUIRED):
 - FIRST slide MUST be Intro/Hook: attention-grabbing title + 1-2 teaser bullets
 - LAST slide MUST be Outro/CTA: summary + "Follow for more" + "Save this"

Guidelines:
 - Create 8-15 slides based on the content structure.
 - Each slide has 2-3 different elements.
 - Split long content across multiple slides logically.
 - Do NOT add emojis to Title, Subtitle, or Description text. Keep text clean.
 - Don't add slide numbers.
 - Description element text should be short (under 8 words per bullet).
 - Remove filler words. Be direct.

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
You are a carousel content writer. Transform the user's rough input into well-structured markdown for a carousel presentation.

Rules:
- Use # for slide titles (each # starts a new slide)
- Use - for bullet points (easier to scan than paragraphs)
- Use **bold** for emphasis on key terms
- Use ![alt](url) for images if URLs are provided
- Keep each slide focused on ONE idea
- 5-10 slides is ideal
- Do NOT add emojis to text. Text must be clean.
- After each slide, add a line: <!-- emojis: emoji1 emoji2 emoji3 --> (3-6 relevant emojis)
- Description should be bullet points, not paragraphs
- Be concise: 3-5 bullets per slide max

SLIDE STRUCTURE (REQUIRED):
- FIRST slide MUST be an Intro/Hook slide:
  - Title: attention-grabbing question or bold statement (under 8 words)
  - Description: 1-2 short bullets teasing what they'll learn
  - Make reader curious — use numbers, contrroversy, or "how to"
  - Examples: "You're doing X wrong", "5 secrets about Y", "How to Z in 10 min"
- LAST slide MUST be an Outro/CTA slide:
  - Title: summary or motivational closing
  - Description:
    - One bullet summarizing the key takeaway
    - One bullet: "Follow for more tips" or "Follow @yourhandle"
    - One bullet: "Save this for later" or "Share with someone who needs this"

COMPRESSION RULES (CRITICAL):
- Each bullet MUST be under 8 words when possible
- Remove filler: "the", "a", "your", "first", "then", "next"
- Remove politeness: "please", "you need to", "you should"
- Compress commands: show only the essential command, not explanation
- Use colon format: **keyword**: short description
- Bad: "Update the operating system first: sudo su followed by apt update"
- Good: "Update OS: sudo su && apt update"
- Bad: "Connect to your VM using SSH: ssh ubuntu@<V2Ray server public IP address>"
- Good: "SSH: ssh ubuntu@<IP>"
- Strip obvious context — reader knows they're following a guide

Output ONLY the markdown, no explanation.
`;

export async function improveMarkdown(
  roughInput: string,
  apiKey: string
): Promise<string | null> {
  const model = startModelClient(apiKey);

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

    return cleaned.length > 0 ? cleaned : null;
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
