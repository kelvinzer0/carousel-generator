"use client";

import TextareaAutosize from "react-textarea-autosize";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
type InputTitleProps = {
  title?: string;
  placeholder?: string;
};

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

const AutoTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, value, ...props }, ref) => {
    const textValue = typeof value === "string" ? value : "";
    const hasMarkdown = /\*\*.+?\*\*/.test(textValue) || /\*(.+?)\*/.test(textValue);

    if (!hasMarkdown) {
      return (
        <div className="w-full">
          {/* @ts-ignore Style works ok */}
          <TextareaAutosize
            className={cn(
              "w-full rounded-md outline outline-transparent hover:outline-input outline-2 bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden resize-none p-0",
              className
            )}
            value={value}
            style={style}
            {...props}
            ref={ref}
          />
        </div>
      );
    }

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

    return (
      <div className="w-full relative">
        {/* Mirror div — behind, renders markdown bold/italic */}
        <div
          aria-hidden="true"
          className={cn("w-full overflow-hidden", className)}
          style={{
            ...textStyle,
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            zIndex: 0,
          }}
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
  }
);

AutoTextarea.displayName = "Textarea";

export { AutoTextarea };
