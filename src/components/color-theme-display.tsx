"use client";
import * as React from "react";
import { Colors } from "@/lib/pallettes";
import { GradientType } from "@/lib/validation/theme-schema";

function getGradientCSS(gradient?: GradientType): string | undefined {
  if (!gradient || gradient.stops.length < 2) return undefined;
  const stops = gradient.stops
    .sort((a, b) => a.position - b.position)
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(", ");
  return `linear-gradient(${gradient.direction}, ${stops})`;
}

export function ColorThemeDisplay({
  colors,
  backgroundType = "color",
  gradient,
}: {
  colors: Colors;
  backgroundType?: "color" | "gradient" | "texture";
  gradient?: GradientType;
}) {
  const bgStyle: React.CSSProperties =
    backgroundType === "gradient" && gradient
      ? { backgroundImage: getGradientCSS(gradient)! }
      : { backgroundColor: colors.background };

  return (
    <div className="flex flew-row rounded border border-muted overflow-clip">
      <span
        className="h-4 w-4"
        style={{ backgroundColor: colors.primary }}
      />
      <span
        className="h-4 w-4"
        style={{ backgroundColor: colors.secondary }}
      />
      <span className="h-4 w-4" style={bgStyle} />
    </div>
  );
}
