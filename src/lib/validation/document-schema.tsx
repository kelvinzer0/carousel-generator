import * as z from "zod";
import { MultiSlideSchema, UnstyledMultiSlideSchema } from "./slide-schema";
import { ThemeSchema } from "./theme-schema";
import { BrandSchema } from "./brand-schema";
import { FontsSchema } from "./fonts-schema";
import { PageNumberSchema } from "./page-number-schema";
import { PageSizeSchema } from "./page-size-schema";

export const ConfigSchema = z.object({
  brand: BrandSchema,
  theme: ThemeSchema,
  fonts: FontsSchema,
  pageNumber: PageNumberSchema,
  pageSize: PageSizeSchema.default("linkedin"),
});

export const DocumentSchema = z.object({
  slides: MultiSlideSchema,
  config: ConfigSchema,
  filename: z.string(),
});

export const UnstyledDocumentSchema = z.object({
  slides: UnstyledMultiSlideSchema,
});
