import React from "react";
import { ConfigSchema } from "@/lib/validation/document-schema";
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

  const nameStyle: React.CSSProperties = {
    fontFamily,
    whiteSpace: "nowrap",
    // When using gradient/texture, add a small paddingRight so the gradient
    // paint region isn't clipped at the last character's right edge.
    ...(primaryHasGradientTexture
      ? { ...getTextStyleCSS(primaryStyle), paddingRight: "0.1em" }
      : { color: config.theme.primary }),
  };

  const handleColor = config.theme.secondary;
  const handleTextStyle: React.CSSProperties = {
    fontFamily,
    fontSize: "0.875rem",
    fontWeight: 400,
    ...(secondaryHasGradientTexture
      ? getTextStyleCSS(secondaryStyle)
      : { color: handleColor }),
  };
  // SVG icon must use opaque color — not affected by gradient text-clip
  const iconStyle: React.CSSProperties = {
    width: "1em",
    height: "1em",
    flexShrink: 0,
    color: handleColor,
    fontFamily,
    fontSize: "0.875rem",
    fontWeight: 400,
  };

  return (
    <div
      className={cn("flex justify-start flex-row gap-3 items-center min-w-0", className)}
      style={{ flexShrink: 1 }}
    >
      {config.brand.avatar?.source.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.brand.avatar.source.src}
          alt={config.brand.name}
          className="w-12 h-12 rounded-full flex-shrink-0"
          style={{
            opacity: config.brand.avatar.style.opacity / 100,
          }}
        />
      )}
      <div className="flex items-start flex-col min-w-0">
        {/* 'truncate' is intentionally omitted when gradient is active:
            overflow:hidden clips the gradient paint region, cutting the last
            characters. Instead we rely on the parent min-w-0 to constrain width. */}
        <span
          style={nameStyle}
          className={primaryHasGradientTexture ? "block max-w-full" : "block truncate"}
        >
          {config.brand.name}
        </span>
        <span className="flex items-center flex-row gap-1.5">
          {platformSvg && (
            <svg
              viewBox="0 0 24 24"
              style={iconStyle}
              fill="currentColor"
            >
              <path d={platformSvg} />
            </svg>
          )}
          <span style={handleTextStyle}>{config.brand.handle}</span>
        </span>
      </div>
    </div>
  );
}
