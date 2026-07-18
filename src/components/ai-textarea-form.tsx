"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormContext } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { Sparkles, Eye, Edit3, ImageIcon } from "lucide-react";
import { DocumentFormReturn } from "@/lib/document-form-types";
import { useState, useMemo } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Textarea } from "@/components/ui/textarea";
import { useKeysContext } from "@/lib/providers/keys-context";
import { useStatusContext } from "@/lib/providers/editor-status-context";
import { generateCarouselSlidesAction } from "@/app/actions";
import { parseMarkdownToSlides } from "@/lib/markdown-to-slides";
import { cn } from "@/lib/utils";

const FormSchema = z.object({
  prompt: z.string().min(2, {
    message: "Prompt must be at least 2 characters.",
  }),
});

/** Extract image URLs from markdown text */
function extractImageUrls(text: string): string[] {
  const regex = /!\[[^\]]*\]\(([^)]+)\)/g;
  const urls: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

/** Simple markdown → HTML (no external deps) */
function simpleMarkdownToHtml(md: string): string {
  return md
    // images
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<div class="my-3"><img src="$2" alt="$1" class="rounded-md max-h-48 object-cover w-full" onerror="this.src=\'https://placehold.co/400x200?text=Invalid+Image\'" /><p class="text-xs text-muted-foreground mt-1 text-center italic">$1</p></div>'
    )
    // headings
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    // bold / italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    // line breaks → paragraphs
    .replace(/\n\n/g, "</p><p class='mb-2'>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p class='mb-2'>")
    .replace(/$/, "</p>");
}

export function AITextAreaForm() {
  const { apiKey } = useKeysContext();
  const { setValue }: DocumentFormReturn = useFormContext();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const { setStatus } = useStatusContext();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const promptValue = form.watch("prompt");
  const imageUrls = useMemo(
    () => extractImageUrls(promptValue || ""),
    [promptValue]
  );

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setStatus("loading");

    const hasImages = imageUrls.length > 0;

    if (hasImages) {
      const slides = parseMarkdownToSlides(data.prompt);
      if (slides && slides.length > 0) {
        setValue("slides", slides);
        toast({ title: `Generated ${slides.length} slides from markdown` });
      } else {
        toast({ title: "Failed to parse markdown content" });
      }
    } else {
      const generatedSlides = await generateCarouselSlidesAction(
        `Generate a carousel from this article:\n\n${data.prompt}`
      );

      if (generatedSlides) {
        setValue("slides", generatedSlides);
        toast({ title: "New carousel generated" });
      } else {
        toast({ title: "Failed to generate carousel" });
      }
    }

    setStatus("ready");
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl w-full m-auto flex flex-col gap-3"
      >
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm text-muted-foreground">
                  Markdown content — supports `![alt](url)` for images
                </FormLabel>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-md transition-colors",
                      mode === "edit"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <Edit3 className="w-3 h-3 inline mr-1" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("preview")}
                    className={cn(
                      "px-2 py-0.5 text-xs rounded-md transition-colors",
                      mode === "preview"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    Preview
                  </button>
                </div>
              </div>
              <FormControl>
                {mode === "edit" ? (
                  <Textarea
                    placeholder={`Write your carousel content in markdown...\n\n# Slide Title\nSome description text\n\n![Hero Image](https://example.com/image.jpg)\n\n# Next Slide\nMore content here...`}
                    className="min-h-[200px] font-mono text-sm leading-relaxed resize-y"
                    {...field}
                  />
                ) : (
                  <div
                    className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm"
                    dangerouslySetInnerHTML={{
                      __html: promptValue
                        ? simpleMarkdownToHtml(promptValue)
                        : '<p class="text-muted-foreground italic">Nothing to preview...</p>',
                    }}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image gallery preview */}
        {imageUrls.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>
                {imageUrls.length} image{imageUrls.length > 1 ? "s" : ""}{" "}
                detected
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imageUrls.map((url, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-20 h-14 rounded border overflow-hidden bg-muted"
                >
                  <img
                    src={url}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/80x56?text=Error";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <span className="flex flex-row gap-1.5 items-center">
              <Sparkles className="w-4 h-4" />
              {imageUrls.length > 0
                ? `Generate slides from markdown (${imageUrls.length} image${imageUrls.length > 1 ? "s" : ""})`
                : "Generate with AI"}
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
