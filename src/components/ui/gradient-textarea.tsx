"use client";

import TextareaAutosize from "react-textarea-autosize";
import * as React from "react";
import { cn } from "@/lib/utils";

/** Convert inline markdown (bold, italic) to HTML */
function inlineMarkdownToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

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
    // pre-wrap must be on a block element — keep on div, not span
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

  const textValue = typeof value === "string" ? value : "";

  return (
    <div className="w-full relative">
      {/* Mirror div — behind, gradient clipped to text.
          dangerouslySetInnerHTML is on the block <div> (not an inner <span>)
          so that white-space: pre-wrap correctly preserves newlines. */}
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
          // height auto so it can grow with content
          height: "auto",
          minHeight: "100%",
        }}
        // Render directly on the block div (not an inner span) so pre-wrap works
        dangerouslySetInnerHTML={{ __html: inlineMarkdownToHtml(textValue) + "\n" }}
      />

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
        } as any}
      />
    </div>
  );
});

GradientTextarea.displayName = "GradientTextarea";

export { GradientTextarea };

