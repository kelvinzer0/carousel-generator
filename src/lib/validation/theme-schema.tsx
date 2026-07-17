import * as z from "zod";

export const ColorSchema = z.object({
  primary: z.string().min(7).max(7).regex(/^#/),
  secondary: z.string(),
  background: z.string(),
});

export const GradientSchema = z.object({
  type: z.literal("gradient"),
  direction: z.string().default("to right"),
  stops: z.array(
    z.object({
      color: z.string(),
      position: z.number().min(0).max(100),
      opacity: z.number().min(0).max(100).default(100),
    })
  ).min(2).max(5),
});

export const TextureSchema = z.object({
  type: z.literal("texture"),
  url: z.string(),
  opacity: z.number().min(0).max(100).default(100),
  blend: z.enum(["normal", "multiply", "overlay", "soft-light", "hard-light"]).default("normal"),
});

export const PatternSchema = z.object({
  type: z.literal("pattern"),
  icons: z.array(z.object({
    emoji: z.string(),
    name: z.string(),
    faClass: z.string(),
    unicode: z.string(),
  })).min(1),
  color: z.string().default("#ffffff"),
  opacity: z.number().min(0).max(100).default(15),
  iconSize: z.number().min(8).max(120).default(24),
  patternSize: z.number().min(20).max(200).default(60),
  fill: z.enum(["solid", "outline"]).default("solid"),
});

export const TextStyleSchema = z.object({
  color: z.string(),
  gradient: GradientSchema.optional(),
  texture: TextureSchema.optional(),
  useGradient: z.boolean().default(false),
  useTexture: z.boolean().default(false),
});

// Background Layer
export const BackgroundLayerItemSchema = z.object({
  id: z.string(),
  type: z.enum(["color", "gradient", "image", "pattern"]),
  opacity: z.number().min(0).max(100).default(100),
  visible: z.boolean().default(true),
  color: z.string().optional(),
  gradient: GradientSchema.optional(),
  image: z.object({
    src: z.string(),
    fit: z.enum(["cover", "contain"]).default("cover"),
  }).optional(),
  pattern: PatternSchema.optional(),
});

export const BackgroundLayersSchema = z.array(BackgroundLayerItemSchema).default([]);

export const ThemeSchema = ColorSchema.extend({
  isCustom: z.boolean(),
  pallette: z.string(),
  primaryStyle: TextStyleSchema.optional(),
  secondaryStyle: TextStyleSchema.optional(),
  backgroundLayers: BackgroundLayersSchema.optional(),
});

export type GradientType = z.infer<typeof GradientSchema>;
export type TextureType = z.infer<typeof TextureSchema>;
export type PatternType = z.infer<typeof PatternSchema>;
export type TextStyleType = z.infer<typeof TextStyleSchema>;
export type BackgroundLayerItemType = z.infer<typeof BackgroundLayerItemSchema>;
