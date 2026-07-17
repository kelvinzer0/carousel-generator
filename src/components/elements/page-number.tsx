import React from "react";
import { ConfigSchema } from "@/lib/validation/document-schema";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useGoogleFont } from "@/lib/hooks/use-google-font";
import { getTextStyleCSS } from "@/lib/text-style-css";

export function PageNumber({
  config,
  number,
  className,
}: {
  config: z.infer<typeof ConfigSchema>;
  number: number;
  className?: string;
}) {
  const fontFamily = useGoogleFont(config.fonts.font2);
  const primaryStyle = config.theme.primaryStyle;
  const hasGradientTexture = primaryStyle?.useGradient || primaryStyle?.useTexture;

  return (
    <div className={`flex flex-row gap-3 items-center ${cn(className)}`}>
      <p
        className={cn(`text-xl`)}
        style={{
          fontFamily,
          ...(hasGradientTexture
            ? getTextStyleCSS(primaryStyle)
            : { color: config.theme.primary }),
        }}
      >
        {number}
      </p>
    </div>
  );
}
