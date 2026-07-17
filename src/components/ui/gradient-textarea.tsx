"use client";

import TextareaAutosize from "react-textarea-autosize";
import * as React from "react";
import { cn } from "@/lib/utils";

interface GradientTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  gradientStyle?: React.CSSProperties;
}

/**
 * Textarea with gradient/texture support.
 *
 * Stacking via position:relative + z-index:
 *   - div (mirror, behind) — shows gradient clipped to text shape
 *   - TextareaAutosize (editable, front) — transparent text, visible caret
 *
 * The mirror is a <div> (not textarea) to avoid auto-resize conflicts.
 * It mirrors text content via React children from the controlled value.
 */
const GradientTextarea = React.forwardRef<
  HTMLTextAreaElement,
  GradientTextareaProps
>(({ className, gradientStyle, style, value, ...props }, ref) => {
  const hasGradient = gradientStyle && Object.keys(gradientStyle).length > 0;

  if (!hasGradient) {
    return (
      <div className="w-full">
        <TextareaAutosize
          className={cn(
            "w-full rounded-md outline outline-transparent hover:outline-input outline-2 bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden resize-none p-0",
            className
          )}
          value={value}
          {...props}
          ref={ref}
        />
      </div>
    );
  }

  const {
    backgroundImage,
    backgroundSize,
    backgroundPosition,
    opacity,
    mixBlendMode,
  } = gradientStyle;

  // Text styles shared between mirror div and editable textarea
  const textStyle: React.CSSProperties = {
    fontFamily: style?.fontFamily,
    fontSize: style?.fontSize,
    fontWeight: style?.fontWeight,
    fontStyle: style?.fontStyle,
    lineHeight: style?.lineHeight,
    letterSpacing: style?.letterSpacing,
    textAlign: style?.textAlign,
    padding: 0,
    margin: 0,
    border: "none",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

  const textValue = typeof value === "string" ? value : "";

  return (
    <div className="w-full relative">
      {/* Mirror div — behind, gradient clipped to text */}
      <div
        aria-hidden="true"
        className={cn("w-full overflow-hidden", className)}
        style={{
          ...textStyle,
          backgroundImage,
          backgroundSize: backgroundSize || "cover",
          backgroundPosition: backgroundPosition || "center",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          opacity: opacity ?? 1,
          mixBlendMode: mixBlendMode as React.CSSProperties["mixBlendMode"],
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      >
        {/* Mirror the text content — trailing newline trick for consistent height */}
        {textValue}
        {"\n"}
      </div>

      {/* Editable textarea — front, transparent text, visible caret */}
      <TextareaAutosize
        {...props}
        value={value}
        ref={ref}
        className={cn(
          "w-full rounded-md outline outline-transparent hover:outline-input outline-2 bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden resize-none p-0",
          className
        )}
        style={{
          ...style,
          ...textStyle,
          color: "transparent",
          WebkitTextFillColor: "transparent",
          caretColor: style?.color || "#000",
          position: "relative",
          zIndex: 1,
        }}
      />
    </div>
  );
});

GradientTextarea.displayName = "GradientTextarea";

export { GradientTextarea };
