import * as z from "zod";

export const PageSizeSchema = z.enum(["desktop", "linkedin", "instagram", "mobile", "tiktok"]);
export type PageSizeType = z.infer<typeof PageSizeSchema>;
