import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  GOOGLE_FONTS,
  loadGoogleFont,
  getFontFamily,
} from "@/lib/google-fonts";
import { DocumentFormReturn } from "@/lib/document-form-types";

// Group fonts by category
const FONT_CATEGORIES = {
  "Sans-Serif": Object.keys(GOOGLE_FONTS).filter(
    (id) => GOOGLE_FONTS[id].category === "sans-serif"
  ),
  Serif: Object.keys(GOOGLE_FONTS).filter(
    (id) => GOOGLE_FONTS[id].category === "serif"
  ),
  Display: Object.keys(GOOGLE_FONTS).filter(
    (id) => GOOGLE_FONTS[id].category === "display"
  ),
  Monospace: Object.keys(GOOGLE_FONTS).filter(
    (id) => GOOGLE_FONTS[id].category === "monospace"
  ),
  Handwriting: Object.keys(GOOGLE_FONTS).filter(
    (id) => GOOGLE_FONTS[id].category === "handwriting"
  ),
};

export function FontsForm() {
  const form: DocumentFormReturn = useFormContext();

  return (
    <Form {...form}>
      <form className="space-y-6 w-full" onSubmit={(e) => e.preventDefault()}>
        <FormField
          control={form.control}
          name="config.fonts.font1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Font 1</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  loadGoogleFont(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary font" />
                  </SelectTrigger>
                </FormControl>
                <FontSelectContent />
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="config.fonts.font2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Font 2</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  loadGoogleFont(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a secondary font" />
                  </SelectTrigger>
                </FormControl>
                <FontSelectContent />
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

function FontSelectContent() {
  return (
    <SelectContent className="max-h-[300px]">
      {Object.entries(FONT_CATEGORIES).map(([category, fontIds]) => (
        <div key={category}>
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {category}
          </div>
          {fontIds.map((fontId) => (
            <SelectItem key={fontId} value={fontId}>
              <FontPreview fontId={fontId} />
            </SelectItem>
          ))}
        </div>
      ))}
    </SelectContent>
  );
}

function FontPreview({ fontId }: { fontId: string }) {
  const [loaded, setLoaded] = useState(false);
  const fontInfo = GOOGLE_FONTS[fontId];

  useEffect(() => {
    loadGoogleFont(fontId).then(() => setLoaded(true)).catch(() => {});
  }, [fontId]);

  return (
    <span
      style={{
        fontFamily: loaded ? getFontFamily(fontId) : "inherit",
      }}
    >
      {fontInfo.name}
    </span>
  );
}
