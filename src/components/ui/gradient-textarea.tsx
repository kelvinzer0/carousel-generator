"use client";

import TextareaAutosize from "react-textarea-autosize";
import * as React from "react";
import { cn } from "@/lib/utils";

interface GradientTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  gradientStyle?: React.CSSProperties;
}

/**
 * Textarea with gradient/texture support via a wrapper div.
 * When gradientStyle is provided, it renders a visual layer
 * that clips to the text shape using background-clip: text.
 *
 * Structure:
 *   div.relative (container)
 *     div.absolute (gradient overlay, pointer-events: none)
 *       TextareaAutosize (readonly mirror — same content, clipped background)
 *     TextareaAutosize (actual editable — transparent text, visible caret)
 */
const GradientTextarea = React.forwardRef<
  HTMLTextAreaElement,
  GradientTextareaProps
>(({ className, gradientStyle, style, ...props }, ref) => {
  const hasGradient = gradientStyle && Object.keys(gradientStyle).length > 0;

  if (hasGradient) {
    // Extract gradient-related properties for the overlay
    const {
      backgroundImage,
      backgroundSize,
      backgroundPosition,
      opacity,
      mixBlendMode,
      ...restGradientStyle
    } = gradientStyle;

    return (
      <div className="w-full relative">
        {/* Gradient/texture overlay — clips to text shape */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            backgroundImage,
            backgroundSize: backgroundSize || "cover",
            backgroundPosition: backgroundPosition || "center",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            opacity: opacity ?? 1,
            mixBlendMode: mixBlendMode as React.CSSProperties["mixBlendMode"],
            // Mirror text properties exactly from the editable textarea
            fontFamily: style?.fontFamily,
            fontSize: style?.fontSize,
            fontWeight: style?.fontWeight,
            lineHeight: style?.lineHeight,
            letterSpacing: style?.letterSpacing,
            textAlign: style?.textAlign,
            padding: 0,
            margin: 0,
            border: "none",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {/* Mirror content — readonly, same text, clipped background */}
          <TextareaAutosize
            {...props}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            className={cn(
              "w-full bg-transparent overflow-hidden resize-none p-0 border-0 outline-none",
              className
            )}
            style={{
              color: "inherit",
              WebkitTextFillColor: "inherit",
              fontFamily: "inherit",
              fontSize: "inherit",
              fontWeight: "inherit",
              lineHeight: "inherit",
              letterSpacing: "inherit",
              textAlign: "inherit",
            }}
          />
        </div>
        {/* Actual editable textarea — transparent text, visible caret */}
        <TextareaAutosize
          {...props}
          ref={ref}
          className={cn(
            "w-full rounded-md outline outline-transparent hover:outline-input outline-2 bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden resize-none p-0",
            className
          )}
          style={{
            ...style,
            color: "transparent",
            WebkitTextFillColor: "transparent",
            caretColor: style?.color || "#000",
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <TextareaAutosize
        className={cn(
          "w-full rounded-md outline outline-transparent hover:outline-input outline-2 bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden resize-none p-0",
          className
        )}
        {...props}
        ref={ref}
      />
    </div>
  );
});

GradientTextarea.displayName = "GradientTextarea";

export { GradientTextarea };
