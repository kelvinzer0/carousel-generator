/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BackgroundLayerItemType } from "@/lib/validation/theme-schema";
import { generatePatternDataUrlAsync } from "@/lib/emoji-fontawesome-map";

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
    return (
      <PatternLayer
        layer={layer}
        baseStyle={baseStyle}
        className={className}
      />
    );
  }

  if (layer.type === "blur" && layer.blur) {
    const { radius, bgColor, bgOpacity } = layer.blur;
    const tintBg = bgColor
      ? bgColor + Math.round((bgOpacity / 100) * 255).toString(16).padStart(2, "0")
      : "transparent";

    return (
      <>
        {/* Live preview: use native backdrop-filter */}
        <div
          className={cn("absolute inset-0", className)}
          style={{
            ...baseStyle,
            backdropFilter: `blur(${radius}px)`,
            WebkitBackdropFilter: `blur(${radius}px)`,
            backgroundColor: tintBg,
          }}
          data-blur-radius={radius}
          data-blur-layer="true"
        />
      </>
    );
  }

  return null;
}

/**
 * Pattern layer with async canvas rendering.
 */
function PatternLayer({
  layer,
  baseStyle,
  className,
}: {
  layer: BackgroundLayerItemType;
  baseStyle: React.CSSProperties;
  className?: string;
}) {
  const [patternUrl, setPatternUrl] = useState<string>("");
  const pattern = layer.pattern!;

  useEffect(() => {
    if (!pattern.icons.length) {
      setPatternUrl("");
      return;
    }

    generatePatternDataUrlAsync(
      pattern.icons,
      pattern.patternSize,
      pattern.iconSize,
      pattern.color,
      pattern.opacity / 100,
      pattern.fill
    )
      .then(setPatternUrl)
      .catch(() => setPatternUrl(""));
  }, [pattern.icons, pattern.patternSize, pattern.iconSize, pattern.color, pattern.opacity, pattern.fill]);

  if (!patternUrl) return null;

  return (
    <div
      className={cn("absolute inset-0", className)}
      style={{
        ...baseStyle,
        backgroundImage: `url("${patternUrl}")`,
        backgroundRepeat: "repeat",
        backgroundSize: `${pattern.patternSize}px ${pattern.patternSize}px`,
      }}
    />
  );
}
