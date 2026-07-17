"use server";
import { messageRateLimit } from "@/lib/rate-limit";

import { generateCarouselSlides } from "@/lib/langchain";
import { headers } from "next/headers";

export async function generateCarouselSlidesAction(userPrompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set");
    return null;
  }

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const ip = headers().get("x-real-ip") ?? "local";
    const rl = await messageRateLimit.limit(ip);

    if (!rl.success) {
      return null;
    }
  }

  try {
    const generatedSlides = await generateCarouselSlides(
      userPrompt,
      process.env.OPENAI_API_KEY
    );
    return generatedSlides;
  } catch (err) {
    console.error("generateCarouselSlidesAction error:", err);
    return null;
  }
}
