import { TextStyleType, GradientType, TextureType } from "@/lib/validation/theme-schema";
import React from "react";

export function getTextStyleCSS(style?: TextStyleType): React.CSSProperties {
  if (!style) return {};

  if (style.useGradient && style.gradient && style.gradient.stops.length >= 2) {
    const stops = style.gradient.stops
      .sort((a, b) => a.position - b.position)
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");

    const isRadial = style.gradient.direction === "radial";
    const backgroundImage = isRadial
      ? `radial-gradient(circle, ${stops})`
      : `linear-gradient(${style.gradient.direction}, ${stops})`;

    return {
      backgroundImage,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      WebkitTextFillColor: "transparent",
    };
  }

  if (style.useTexture && style.texture?.url) {
    return {
      backgroundImage: `url(${style.texture.url})`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      WebkitTextFillColor: "transparent",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "repeat",
      opacity: style.texture.opacity / 100,
      mixBlendMode: style.texture.blend as React.CSSProperties["mixBlendMode"],
    };
  }

  return { color: style.color };
}
