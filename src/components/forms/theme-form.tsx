import { useFormContext } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { pallettes } from "@/lib/pallettes";
import { CustomIndicatorRadioGroupItem } from "../custom-indicator-radio-group-item";
import { ColorThemeDisplay } from "../color-theme-display";
import { DocumentFormReturn } from "@/lib/document-form-types";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Separator } from "../ui/separator";
import { BackgroundLayersEditor } from "./background-layers-editor";
import { ImageUploadButton } from "../image-upload-button";

const GRADIENT_PRESETS = [
  { label: "Sunset", direction: "to right", stops: [{ color: "#ff7e5f", position: 0 }, { color: "#feb47b", position: 100 }] },
  { label: "Ocean", direction: "to right", stops: [{ color: "#2193b0", position: 0 }, { color: "#6dd5ed", position: 100 }] },
  { label: "Purple", direction: "to right", stops: [{ color: "#7b4397", position: 0 }, { color: "#dc2430", position: 100 }] },
  { label: "Neon", direction: "to right", stops: [{ color: "#00f260", position: 0 }, { color: "#0575e6", position: 100 }] },
  { label: "Peach", direction: "to right", stops: [{ color: "#ed6ea0", position: 0 }, { color: "#ec8c69", position: 100 }] },
  { label: "Gold", direction: "to right", stops: [{ color: "#f7971e", position: 0 }, { color: "#ffd200", position: 100 }] },
];

const TEXTURE_PRESETS = [
  { label: "Noise", url: "https://www.transparenttextures.com/patterns/noise.png" },
  { label: "Paper", url: "https://www.transparenttextures.com/patterns/paper.png" },
  { label: "Dots", url: "https://www.transparenttextures.com/patterns/dots.png" },
  { label: "Diagonal", url: "https://www.transparenttextures.com/patterns/diagonal-striped-brick.png" },
];

function GradientStopsEditor({
  form,
  basePath,
}: {
  form: DocumentFormReturn;
  basePath: string;
}) {
  const { watch, setValue } = form;
  const stops = watch(`${basePath}.stops` as any) || [];

  return (
    <div className="space-y-2 mt-2">
      <FormLabel className="text-xs text-muted-foreground">Color Stops</FormLabel>
      {stops.map((_: any, index: number) => (
        <div key={index} className="flex gap-2 items-center">
          <FormField
            control={form.control}
            name={`${basePath}.stops.${index}.color` as any}
            render={({ field }) => (
              <Input
                type="color"
                className="w-10 h-8 p-1 cursor-pointer"
                {...field}
              />
            )}
          />
          <FormField
            control={form.control}
            name={`${basePath}.stops.${index}.position` as any}
            render={({ field }) => (
              <Input
                type="number"
                min={0}
                max={100}
                className="w-16 h-8"
                placeholder="%"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
          {stops.length > 2 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                const newStops = stops.filter((_: any, i: number) => i !== index);
                setValue(`${basePath}.stops` as any, newStops);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      {stops.length < 5 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1 h-7 text-xs"
          onClick={() => {
            const lastPos = stops.length > 0 ? stops[stops.length - 1].position : 0;
            setValue(`${basePath}.stops` as any, [
              ...stops,
              { color: "#ffffff", position: Math.min(100, lastPos + 20) },
            ]);
          }}
        >
          <Plus className="h-3 w-3 mr-1" /> Add Stop
        </Button>
      )}
    </div>
  );
}

function TextStyleEditor({
  form,
  label,
  colorPath,
  stylePath,
}: {
  form: DocumentFormReturn;
  label: string;
  colorPath: string;
  stylePath: string;
}) {
  const { watch, setValue } = form;
  const useGradient = watch(`${stylePath}.useGradient` as any);
  const useTexture = watch(`${stylePath}.useTexture` as any);

  return (
    <div className="space-y-3 p-3 border rounded-md">
      <div className="flex items-center justify-between">
        <FormLabel className="font-medium">{label}</FormLabel>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={useGradient ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setValue(`${stylePath}.useGradient` as any, !useGradient);
              if (!useGradient) {
                setValue(`${stylePath}.useTexture` as any, false);
                if (!watch(`${stylePath}.gradient` as any)) {
                  const currentColor = watch(colorPath as any) || "#000000";
                  setValue(`${stylePath}.gradient` as any, {
                    type: "gradient",
                    direction: "to right",
                    stops: [
                      { color: currentColor, position: 0 },
                      { color: "#ffffff", position: 100 },
                    ],
                  });
                }
              }
            }}
          >
            Gradient
          </Button>
          <Button
            type="button"
            variant={useTexture ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setValue(`${stylePath}.useTexture` as any, !useTexture);
              if (!useTexture) {
                setValue(`${stylePath}.useGradient` as any, false);
                if (!watch(`${stylePath}.texture` as any)) {
                  setValue(`${stylePath}.texture` as any, {
                    type: "texture",
                    url: "",
                    opacity: 100,
                    blend: "normal",
                  });
                }
              }
            }}
          >
            Texture
          </Button>
        </div>
      </div>

      {!useGradient && !useTexture && (
        <FormField
          control={form.control}
          name={colorPath as any}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    className="w-10 h-8 p-1 cursor-pointer"
                    {...field}
                  />
                  <Input placeholder="#000000" className="flex-1" {...field} />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {useGradient && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            {GRADIENT_PRESETS.map((preset, i) => {
              const css = `linear-gradient(${preset.direction}, ${preset.stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`;
              return (
                <button
                  key={i}
                  type="button"
                  className="h-8 rounded border border-muted hover:ring-2 hover:ring-ring cursor-pointer"
                  style={{ backgroundImage: css }}
                  onClick={() => {
                    setValue(`${stylePath}.gradient` as any, {
                      type: "gradient",
                      direction: preset.direction,
                      stops: preset.stops,
                    });
                  }}
                />
              );
            })}
          </div>
          <FormField
            control={form.control}
            name={`${stylePath}.gradient.direction` as any}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <select
                    className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    value={field.value || "to right"}
                    onChange={field.onChange}
                  >
                    <option value="to right">→ Left to Right</option>
                    <option value="to bottom">↓ Top to Bottom</option>
                    <option value="to bottom right">↘ Diagonal</option>
                    <option value="135deg">↗ 135°</option>
                    <option value="radial">◎ Radial</option>
                  </select>
                </FormControl>
              </FormItem>
            )}
          />
          <GradientStopsEditor form={form} basePath={`${stylePath}.gradient`} />
        </div>
      )}

      {useTexture && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1">
            {TEXTURE_PRESETS.map((preset, i) => (
              <button
                key={i}
                type="button"
                className="h-8 rounded border border-muted hover:ring-2 hover:ring-ring cursor-pointer bg-cover bg-center"
                style={{ backgroundImage: `url(${preset.url})` }}
                onClick={() => {
                  setValue(`${stylePath}.texture` as any, {
                    type: "texture",
                    url: preset.url,
                    opacity: 100,
                    blend: "normal",
                  });
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name={`${stylePath}.texture.url` as any}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="Texture URL"
                      className="text-xs"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <ImageUploadButton
              onUpload={(dataUrl) => {
                setValue(`${stylePath}.texture.url` as any, dataUrl);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PalletteSelector({ form }: { form: DocumentFormReturn }) {
  const { control, setValue } = form;

  return (
    <FormField
      control={control}
      name="config.theme.pallette"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>Select a pallette</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={(value) => {
                const colors = pallettes[value];
                setValue("config.theme.primary", colors.primary);
                setValue("config.theme.secondary", colors.secondary);
                setValue("config.theme.background", colors.background);
                setValue("config.theme.pallette", value);
                // Reset gradient/texture when switching palette
                setValue("config.theme.primaryStyle", undefined);
                setValue("config.theme.secondaryStyle", undefined);
              }}
              defaultValue={field.value}
              className="grid grid-cols-3 space-y-1"
            >
              {Object.entries(pallettes).map(([palletteName, colors]) => (
                <FormItem
                  className="flex items-center space-x-3 space-y-0"
                  key={palletteName}
                >
                  <FormControl>
                    <CustomIndicatorRadioGroupItem value={palletteName}>
                      <ColorThemeDisplay colors={colors} />
                    </CustomIndicatorRadioGroupItem>
                  </FormControl>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CustomColors({ form }: { form: DocumentFormReturn }) {
  return (
    <>
      <TextStyleEditor
        form={form}
        label="Primary (Title)"
        colorPath="config.theme.primary"
        stylePath="config.theme.primaryStyle"
      />
      <TextStyleEditor
        form={form}
        label="Secondary (Text)"
        colorPath="config.theme.secondary"
        stylePath="config.theme.secondaryStyle"
      />
      <BackgroundLayersEditor />
    </>
  );
}

export function ThemeForm({}: {}) {
  const form: DocumentFormReturn = useFormContext();
  const { watch } = form;
  const isCustom = watch("config.theme.isCustom");
  return (
    <Form {...form}>
      <form className="space-y-6 w-full py-4" onSubmit={(e) => e.preventDefault()}>
        <FormField
          control={form.control}
          name="config.theme.isCustom"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none text-base">
                <FormLabel>Use custom colors</FormLabel>
              </div>
            </FormItem>
          )}
        />
        {isCustom ? (
          <CustomColors form={form} />
        ) : (
          <PalletteSelector form={form} />
        )}
      </form>
    </Form>
  );
}
