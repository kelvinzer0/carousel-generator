import * as z from "zod";
import { DEFAULT_IMAGE_INPUT, ImageSchema } from "./image-schema";

export const SocialPlatformEnum = z.enum([
  "none",
  "instagram",
  "linkedin",
  "twitter",
  "tiktok",
  "youtube",
  "github",
  "facebook",
  "threads",
  "discord",
  "dribbble",
  "figma",
]);

export type SocialPlatform = z.infer<typeof SocialPlatformEnum>;

export const SOCIAL_PLATFORMS: {
  value: SocialPlatform;
  label: string;
  icon: string;
}[] = [
  { value: "none", label: "None", icon: "" },
  { value: "instagram", label: "Instagram", icon: "fa-brands fa-instagram" },
  { value: "linkedin", label: "LinkedIn", icon: "fa-brands fa-linkedin-in" },
  { value: "twitter", label: "X / Twitter", icon: "fa-brands fa-x-twitter" },
  { value: "tiktok", label: "TikTok", icon: "fa-brands fa-tiktok" },
  { value: "youtube", label: "YouTube", icon: "fa-brands fa-youtube" },
  { value: "github", label: "GitHub", icon: "fa-brands fa-github" },
  { value: "facebook", label: "Facebook", icon: "fa-brands fa-facebook" },
  { value: "threads", label: "Threads", icon: "fa-brands fa-threads" },
  { value: "discord", label: "Discord", icon: "fa-brands fa-discord" },
  { value: "dribbble", label: "Dribbble", icon: "fa-brands fa-dribbble" },
  { value: "figma", label: "Figma", icon: "fa-brands fa-figma" },
];

export const BrandSchema = z.object({
  avatar: ImageSchema.default(DEFAULT_IMAGE_INPUT),
  name: z
    .string()
    .min(2, {
      message: "Name be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  handle: z.string(),
  socialPlatform: SocialPlatformEnum.default("none"),
});
