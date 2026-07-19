"use client";
import { useFormContext } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { DocumentFormReturn } from "@/lib/document-form-types";
import { ImageFormField } from "@/components/forms/fields/image-form-field";
import {
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_SVG,
  SocialPlatform,
} from "@/lib/validation/brand-schema";
import { cn } from "@/lib/utils";

export function BrandForm({}: {}) {
  const form: DocumentFormReturn = useFormContext();

  return (
    <Form {...form}>
      <form className="space-y-6 w-full" onSubmit={(e) => e.preventDefault()}>
        <FormField
          control={form.control}
          name="config.brand.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" className="" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="config.brand.handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Handle</FormLabel>
              <FormControl>
                <Input placeholder="Your handle" className="" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="config.brand.socialPlatform"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Platform Icon</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <button
                      key={platform.value}
                      type="button"
                      title={platform.label}
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-md border text-sm transition-colors",
                        field.value === platform.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={() => field.onChange(platform.value)}
                    >
                      {platform.value === "none" ? (
                        <span className="text-xs">@</span>
                      ) : SOCIAL_PLATFORM_SVG[platform.value] ? (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                          <path d={SOCIAL_PLATFORM_SVG[platform.value]} />
                        </svg>
                      ) : (
                        <span className="text-xs">?</span>
                      )}
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ImageFormField
          form={form}
          label="Avatar Image"
          fieldName="config.brand.avatar"
        />
      </form>
    </Form>
  );
}
