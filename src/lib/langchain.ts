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

Guidelines:
 - Create 8-15 slides.
 - Each slide has 2-3 different elements. E.g. [Title, Description], or [Title, Subtitle], or [Subtitle, Description].
 - Each slide All the elements in that slide are about that idea.
 - Adapt, reorganize and rephrase the content to fit the slides format.
 - Add Emojis to the text in Title, Subtitle and Description.
 - Don't add slide numbers.
 - Description element text should be short.

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
