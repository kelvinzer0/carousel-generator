import { ElementType } from "@/lib/validation/element-type";
import * as z from "zod";

const ImageDataUrlSchema = z
  .string()
  .refine((dataUrl) => /^data:image\/[a-z]+;base64,/.test(dataUrl), {
    message: "Invalid data URL format. It should start with 'data:image/'.",
  });

// TODO: Make more granular defaults in all schemas

export const ObjectFitType = z.enum(["Cover", "Contain"]);
export type ObjectFitType = z.infer<typeof ObjectFitType>;

export const CensorAreaSchema = z.object({
  x: z.number().min(0).max(100),      // left %
  y: z.number().min(0).max(100),      // top %
  width: z.number().min(0).max(100),  // width %
  height: z.number().min(0).max(100), // height %
});
export type CensorArea = z.infer<typeof CensorAreaSchema>;

export const ImageStyleSchema = z.object({
  opacity: z.number().positive().lte(100).default(100),
});

export const ContentImageStyleSchema = ImageStyleSchema.extend({
  objectFit: ObjectFitType.default(ObjectFitType.enum.Cover),
});

export enum ImageInputType {
  Url = "URL",
  Upload = "UPLOAD",
  Generated = "GENERATED",
  Pixabay = "PIXABAY",
}
const ImageInputTypeSchema = z.nativeEnum(ImageInputType);

const DEFAULT_IMAGE_SOURCE = {
  src: "",
  type: ImageInputType.Url,
};

export const ImageSourceSchema = z.object({
  src: z.union([z.string().url(), ImageDataUrlSchema, z.literal("")]),
  type: ImageInputTypeSchema,
});

export const ImageSchema = z.object({
  type: z.literal(ElementType.enum.Image).default(ElementType.enum.Image),
  source: ImageSourceSchema.default(DEFAULT_IMAGE_SOURCE),
  style: ImageStyleSchema.default({}),
});

export const CropAreaSchema = z.object({
  x: z.number().min(0).max(100),      // left %
  y: z.number().min(0).max(100),      // top %
  width: z.number().min(1).max(100),  // width %
  height: z.number().min(1).max(100), // height %
});
export type CropArea = z.infer<typeof CropAreaSchema>;

export const ContentImageSchema = z.object({
  type: z
    .literal(ElementType.enum.ContentImage)
    .default(ElementType.enum.ContentImage),
  source: ImageSourceSchema.default(DEFAULT_IMAGE_SOURCE),
  style: ContentImageStyleSchema.default({}),
  censorAreas: z.array(CensorAreaSchema).default([]),
  crop: CropAreaSchema.optional(),
});

export const DEFAULT_CONTENT_IMAGE_INPUT: z.infer<typeof ContentImageSchema> =
  ContentImageSchema.parse({});

export const DEFAULT_IMAGE_INPUT: z.infer<typeof ImageSchema> =
  ImageSchema.parse({});

export const DEFAULT_BACKGROUND_IMAGE_INPUT: z.infer<typeof ImageSchema> =
  ImageSchema.parse({
    style: {
      opacity: 30,
    },
  });
