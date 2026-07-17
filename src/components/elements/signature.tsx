import React from "react";
import { ConfigSchema, DocumentSchema } from "@/lib/validation/document-schema";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useGoogleFont } from "@/lib/hooks/use-google-font";
import { getTextStyleCSS } from "@/lib/text-style-css";

export function Signature({
  config,
  className,
}: {
  config: z.infer<typeof ConfigSchema>;
  className?: string;
}) {
  const fontFamily = useGoogleFont(config.fonts.font2);
  const primaryStyle = config.theme.primaryStyle;
  const secondaryStyle = config.theme.secondaryStyle;
  const primaryHasGradientTexture = primaryStyle?.useGradient || primaryStyle?.useTexture;
  const secondaryHasGradientTexture = secondaryStyle?.useGradient || secondaryStyle?.useTexture;

  return (
    <div
      className={`flex justify-start flex-row gap-3 items-center ${cn(
        className
      )}`}
    >
      {config.brand.avatar?.source.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.brand.avatar.source.src}
          alt={config.brand.name}
          className={`w-12 h-12 rounded-full`}
          style={{
            opacity: config.brand.avatar.style.opacity / 100,
          }}
        />
      )}
      <div className={`flex items-start flex-col`}>
        <p
          className={cn(`text-base`)}
          style={{
            fontFamily,
            ...(primaryHasGradientTexture
              ? getTextStyleCSS(primaryStyle)
              : { color: config.theme.primary }),
          }}
        >
          {config.brand.name}
        </p>
        <p
          className={cn(`text-sm font-normal`)}
          style={{
            fontFamily,
            ...(secondaryHasGradientTexture
              ? getTextStyleCSS(secondaryStyle)
              : { color: config.theme.secondary }),
          }}
        >
          {config.brand.handle}
        </p>
      </div>
    </div>
  );
}
