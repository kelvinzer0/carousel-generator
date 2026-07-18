"use client";

import { useFormContext } from "react-hook-form";
import { DocumentFormReturn } from "@/lib/document-form-types";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SIZE_PRESETS, SizePresetKey } from "@/lib/page-size";

const sizeOptions: { value: SizePresetKey; label: string; desc: string }[] = [
  { value: "desktop", label: "Desktop", desc: "2:1 (1080×540)" },
  { value: "linkedin", label: "LinkedIn", desc: "4:5 (1080×1350)" },
  { value: "instagram", label: "Instagram", desc: "4:5 (1080×1350)" },
  { value: "mobile", label: "Mobile", desc: "4:5 (1080×1350)" },
  { value: "tiktok", label: "TikTok", desc: "9:16 (1080×1920)" },
];

export function SizeForm() {
  const form: DocumentFormReturn = useFormContext();

  return (
    <FormField
      control={form.control}
      name="config.pageSize"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Carousel Size</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex flex-col gap-3"
            >
              {sizeOptions.map((opt) => (
                <div
                  key={opt.value}
                  className="flex items-center space-x-3 border rounded-md p-3 hover:bg-accent cursor-pointer"
                  onClick={() => field.onChange(opt.value)}
                >
                  <RadioGroupItem value={opt.value} id={`size-${opt.value}`} />
                  <div className="flex flex-col">
                    <label
                      htmlFor={`size-${opt.value}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {opt.label}
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {opt.desc}
                    </span>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
