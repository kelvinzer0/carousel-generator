import React from "react";
import { cn } from "@/lib/utils";
import { GradientType, TextureType } from "@/lib/validation/theme-schema";

function getGradientCSS(gradient: GradientType): string {
  const stops = gradient.stops
    .sort((a, b) => a.position - b.position)
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(", ");
  return `linear-gradient(${gradient.direction}, ${stops})`;
}

export function BackgroundLayer({
  background,
  backgroundType = "color",
  gradient,
  texture,
  className = "",
}: {
  background: string;
  backgroundType?: "color" | "gradient" | "texture";
  gradient?: GradientType;
  texture?: TextureType;
  className?: string;
}) {
  let backgroundImage = "";
  let backgroundColor = background;
  let opacity = 1;
  let blendMode = "normal";

  if (backgroundType === "gradient" && gradient && gradient.stops.length >= 2) {
    backgroundImage = getGradientCSS(gradient);
    backgroundColor = "transparent";
  } else if (backgroundType === "texture" && texture?.url) {
    backgroundImage = `url(${texture.url})`;
    backgroundColor = background;
    opacity = texture.opacity / 100;
    blendMode = texture.blend;
  }

  return (
    <div
      style={{
        backgroundColor,
        backgroundImage,
        backgroundSize: backgroundType === "texture" ? "cover" : undefined,
        backgroundPosition: backgroundType === "texture" ? "center" : undefined,
        opacity,
        mixBlendMode: blendMode as React.CSSProperties["mixBlendMode"],
      }}
      className={cn(
        "w-full h-full absolute top-0 left-0 right-0 bottom-0",
        className
      )}
    />
  );
}
