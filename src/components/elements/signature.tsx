import React from "react";
import { ConfigSchema, DocumentSchema } from "@/lib/validation/document-schema";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useGoogleFont } from "@/lib/hooks/use-google-font";
import { getTextStyleCSS } from "@/lib/text-style-css";
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_SVG } from "@/lib/validation/brand-schema";

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

  const platform = SOCIAL_PLATFORMS.find(
    (p) => p.value === (config.brand.socialPlatform || "none")
  );
  const platformSvg = platform && platform.value !== "none"
    ? SOCIAL_PLATFORM_SVG[platform.value]
    : null;

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
      <div className={`flex items-start flex-col min-w-0 flex-1`}>
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
          {platformSvg && (
            <svg
              viewBox="0 0 24 24"
              className="inline-block mr-1.5 align-middle relative"
              style={{ width: "1.05em", height: "1.05em", top: "-0.05em" }}
              fill="currentColor"
            >
              <path d={platformSvg} />
            </svg>
          )}
          {config.brand.handle}
        </p>
      </div>
    </div>
  );
}
