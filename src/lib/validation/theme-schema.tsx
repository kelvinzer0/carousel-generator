import * as z from "zod";

export const ColorSchema = z.object({
  primary: z.string().min(7).max(7).regex(/^#/),
  secondary: z.string(),
  background: z.string(),
});

export const GradientSchema = z.object({
  type: z.literal("gradient"),
  direction: z.string().default("to bottom"),
  stops: z.array(
    z.object({
      color: z.string(),
      position: z.number().min(0).max(100),
    })
  ).min(2).max(5),
});

export const TextureSchema = z.object({
  type: z.literal("texture"),
  url: z.string(),
  opacity: z.number().min(0).max(100).default(100),
  blend: z.enum(["normal", "multiply", "overlay", "soft-light", "hard-light"]).default("normal"),
});

export const BackgroundSchema = z.union([
  z.string(), // plain color
  GradientSchema,
  TextureSchema,
]);

export const ThemeSchema = ColorSchema.extend({
  isCustom: z.boolean(),
  pallette: z.string(),
  backgroundType: z.enum(["color", "gradient", "texture"]).default("color"),
  gradient: GradientSchema.optional(),
  texture: TextureSchema.optional(),
});

export type GradientType = z.infer<typeof GradientSchema>;
export type TextureType = z.infer<typeof TextureSchema>;
export type BackgroundType = z.infer<typeof BackgroundSchema>;
