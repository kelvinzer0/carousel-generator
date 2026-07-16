import * as z from "zod";

export const PageSizeSchema = z.enum(["linkedin", "instagram", "tiktok"]);
export type PageSizeType = z.infer<typeof PageSizeSchema>;
