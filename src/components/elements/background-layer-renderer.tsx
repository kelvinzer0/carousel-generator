/* eslint-disable @next/next/no-img-element */
import React from "react";
import { cn } from "@/lib/utils";
import { BackgroundLayerItemType } from "@/lib/validation/theme-schema";

/**
 * Renders a single background layer (color, gradient, or image).
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
    ...style,
    opacity: layer.opacity / 100,
  };

  if (layer.type === "color" && layer.color) {
    return (
      <div
        className={cn(
          "w-full h-full absolute top-0 left-0 right-0 bottom-0",
          className
        )}
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
        // Convert hex color + opacity to rgba
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
        className={cn(
          "w-full h-full absolute top-0 left-0 right-0 bottom-0",
          className
        )}
        style={{
          ...baseStyle,
          backgroundImage: css,
        }}
      />
    );
  }

  if (layer.type === "image" && layer.image?.src) {
    return (
      <div
        className={cn(
          "w-full h-full absolute top-0 left-0 right-0 bottom-0",
          className
        )}
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

  return null;
}
