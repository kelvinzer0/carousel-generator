/* eslint-disable @next/next/no-img-element */
import React from "react";
import { cn } from "@/lib/utils";
import { BackgroundLayerItemType } from "@/lib/validation/theme-schema";
import { generatePatternDataUrl } from "@/lib/emoji-fontawesome-map";

/**
 * Renders a single background layer (color, gradient, image, or pattern).
 */
export function BackgroundLayerRenderer({
  layer,
  className = "",
  style,
}: {
  layer: BackgroundLayerItemType;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!layer.visible) return null;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    ...style,
    opacity: layer.opacity / 100,
  };

  if (layer.type === "color" && layer.color) {
    return (
      <div
        className={cn("absolute inset-0", className)}
        style={{
          ...baseStyle,
          backgroundColor: layer.color,
        }}
      />
    );
  }

  if (layer.type === "gradient" && layer.gradient) {
    const { direction, stops } = layer.gradient;
    const gradientStops = stops
      .map((stop) => {
        const r = parseInt(stop.color.slice(1, 3), 16);
        const g = parseInt(stop.color.slice(3, 5), 16);
        const b = parseInt(stop.color.slice(5, 7), 16);
        const a = (stop.opacity ?? 100) / 100;
        return `rgba(${r}, ${g}, ${b}, ${a}) ${stop.position}%`;
      })
      .join(", ");

    const isRadial = direction === "radial";
    const css = isRadial
      ? `radial-gradient(circle, ${gradientStops})`
      : `linear-gradient(${direction}, ${gradientStops})`;

    return (
      <div
        className={cn("absolute inset-0", className)}
        style={{
          ...baseStyle,
          backgroundImage: css,
          backgroundSize: "cover",
        }}
      />
    );
  }

  if (layer.type === "image" && layer.image?.src) {
    return (
      <div
        className={cn("absolute inset-0", className)}
        style={baseStyle}
      >
        <img
          alt=""
          src={layer.image.src}
          className="w-full h-full"
          style={{ objectFit: layer.image.fit || "cover" }}
        />
      </div>
    );
  }

  if (layer.type === "pattern" && layer.pattern?.icons?.length) {
    const { icons, color, opacity, iconSize, patternSize, fill } = layer.pattern;
    const patternUrl = generatePatternDataUrl(
      icons,
      patternSize,
      iconSize,
      color,
      opacity / 100,
      fill
    );

    if (patternUrl) {
      return (
        <div
          className={cn("absolute inset-0", className)}
          style={{
            ...baseStyle,
            backgroundImage: `url("${patternUrl}")`,
            backgroundRepeat: "repeat",
            backgroundSize: `${patternSize}px ${patternSize}px`,
          }}
        />
      );
    }
  }

  return null;
}
