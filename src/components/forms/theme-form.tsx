import { useFormContext, useFieldArray } from "react-hook-form";
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

const GRADIENT_PRESETS = [
  { label: "Sunset", direction: "to right", stops: [{ color: "#ff7e5f", position: 0 }, { color: "#feb47b", position: 100 }] },
  { label: "Ocean", direction: "to bottom", stops: [{ color: "#2193b0", position: 0 }, { color: "#6dd5ed", position: 100 }] },
  { label: "Purple Haze", direction: "to right", stops: [{ color: "#7b4397", position: 0 }, { color: "#dc2430", position: 100 }] },
  { label: "Forest", direction: "to bottom", stops: [{ color: "#134e5e", position: 0 }, { color: "#71b280", position: 100 }] },
  { label: "Midnight", direction: "to bottom right", stops: [{ color: "#232526", position: 0 }, { color: "#414345", position: 100 }] },
  { label: "Peach", direction: "to right", stops: [{ color: "#ed6ea0", position: 0 }, { color: "#ec8c69", position: 100 }] },
];

const BLEND_MODES = ["normal", "multiply", "overlay", "soft-light", "hard-light"] as const;

function GradientEditor({ form }: { form: DocumentFormReturn }) {
  const { control, watch, setValue } = form;
  const gradient = watch("config.theme.gradient");

  return (
    <div className="space-y-4">
      <FormLabel>Gradient Presets</FormLabel>
      <div className="grid grid-cols-3 gap-2">
        {GRADIENT_PRESETS.map((preset, i) => {
          const css = `linear-gradient(${preset.direction}, ${preset.stops.map((s) => `${s.color} ${s.position}%`).join(", ")})`;
          return (
            <button
              key={i}
              type="button"
              className="h-10 rounded border border-muted hover:ring-2 hover:ring-ring cursor-pointer"
              style={{ backgroundImage: css }}
              onClick={() => {
                setValue("config.theme.gradient", {
                  type: "gradient" as const,
                  direction: preset.direction,
                  stops: preset.stops,
                });
                setValue("config.theme.backgroundType", "gradient");
              }}
            />
          );
        })}
      </div>

      <Separator />

      <FormLabel>Custom Gradient</FormLabel>
      <FormField
        control={control}
        name="config.theme.gradient.direction"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs text-muted-foreground">Direction</FormLabel>
            <FormControl>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={field.value || "to bottom"}
                onChange={field.onChange}
              >
                <option value="to bottom">↓ Top to Bottom</option>
                <option value="to right">→ Left to Right</option>
                <option value="to bottom right">↘ Diagonal</option>
                <option value="to top">↑ Bottom to Top</option>
                <option value="to left">← Right to Left</option>
                <option value="135deg">↗ 135°</option>
                <option value="45deg">↘ 45°</option>
                <option value="radial">◎ Radial</option>
              </select>
            </FormControl>
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <FormLabel className="text-xs text-muted-foreground">Color Stops</FormLabel>
        {gradient?.stops?.map((_, index) => (
          <div key={index} className="flex gap-2 items-center">
            <FormField
              control={control}
              name={`config.theme.gradient.stops.${index}.color`}
              render={({ field }) => (
                <Input
                  type="color"
                  className="w-12 h-9 p-1 cursor-pointer"
                  {...field}
                />
              )}
            />
            <FormField
              control={control}
              name={`config.theme.gradient.stops.${index}.position`}
              render={({ field }) => (
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="w-20 h-9"
                  placeholder="%"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
            {gradient.stops.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  const stops = gradient.stops.filter((_, i) => i !== index);
                  setValue("config.theme.gradient.stops", stops);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {(!gradient?.stops || gradient.stops.length < 5) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              const current = gradient?.stops || [];
              const lastPos = current.length > 0 ? current[current.length - 1].position : 0;
              setValue("config.theme.gradient.stops", [
                ...current,
                { color: "#ffffff", position: Math.min(100, lastPos + 20) },
              ]);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Stop
          </Button>
        )}
      </div>
    </div>
  );
}

function TextureEditor({ form }: { form: DocumentFormReturn }) {
  const { control, watch, setValue } = form;

  const TEXTURE_PRESETS = [
    { label: "Paper", url: "https://www.transparenttextures.com/patterns/paper.png" },
    { label: "Noise", url: "https://www.transparenttextures.com/patterns/noise.png" },
    { label: "Canvas", url: "https://www.transparenttextures.com/patterns/canvas.png" },
    { label: "Concrete", url: "https://www.transparenttextures.com/patterns/concrete-wall.png" },
    { label: "Fabric", url: "https://www.transparenttextures.com/patterns/fabric.png" },
    { label: "Wood", url: "https://www.transparenttextures.com/patterns/wood.png" },
    { label: "Dots", url: "https://www.transparenttextures.com/patterns/dots.png" },
    { label: "Diagonal", url: "https://www.transparenttextures.com/patterns/diagonal-striped-brick.png" },
  ];

  return (
    <div className="space-y-4">
      <FormLabel>Texture Presets</FormLabel>
      <div className="grid grid-cols-4 gap-2">
        {TEXTURE_PRESETS.map((preset, i) => (
          <button
            key={i}
            type="button"
            className="h-10 rounded border border-muted hover:ring-2 hover:ring-ring cursor-pointer bg-cover bg-center"
            style={{ backgroundImage: `url(${preset.url})` }}
            onClick={() => {
              setValue("config.theme.texture", {
                type: "texture" as const,
                url: preset.url,
                opacity: 100,
                blend: "normal",
              });
              setValue("config.theme.backgroundType", "texture");
            }}
          />
        ))}
      </div>

      <Separator />

      <FormLabel className="text-xs text-muted-foreground">Custom Texture URL</FormLabel>
      <FormField
        control={control}
        name="config.theme.texture.url"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                placeholder="https://example.com/texture.png"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  if (e.target.value) {
                    setValue("config.theme.backgroundType", "texture");
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="config.theme.texture.opacity"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs text-muted-foreground">Opacity ({field.value || 100}%)</FormLabel>
            <FormControl>
              <input
                type="range"
                min={0}
                max={100}
                className="w-full cursor-pointer"
                value={field.value || 100}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="config.theme.texture.blend"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs text-muted-foreground">Blend Mode</FormLabel>
            <FormControl>
              <select
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                value={field.value || "normal"}
                onChange={field.onChange}
              >
                {BLEND_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </option>
                ))}
              </select>
            </FormControl>
          </FormItem>
        )}
      />
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
      <FormField
        control={form.control}
        name="config.theme.primary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary</FormLabel>
            <FormControl>
              <Input placeholder="Primary color" className="" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.theme.secondary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Secondary</FormLabel>
            <FormControl>
              <Input placeholder="Secondary color" className="" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.theme.background"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Background</FormLabel>
            <FormControl>
              <Input placeholder="Background color" className="" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

export function ThemeForm({}: {}) {
  const form: DocumentFormReturn = useFormContext();
  const { watch, setValue } = form;
  const isCustom = watch("config.theme.isCustom");
  const backgroundType = watch("config.theme.backgroundType") || "color";

  return (
    <Form {...form}>
      <form className="space-y-6 w-full py-4">
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

        <Separator />

        <div className="space-y-3">
          <FormLabel>Background Style</FormLabel>
          <div className="flex gap-2">
            {(["color", "gradient", "texture"] as const).map((type) => (
              <Button
                key={type}
                type="button"
                variant={backgroundType === type ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setValue("config.theme.backgroundType", type);
                  if (type === "gradient" && !watch("config.theme.gradient")) {
                    setValue("config.theme.gradient", {
                      type: "gradient",
                      direction: "to bottom",
                      stops: [
                        { color: watch("config.theme.background") || "#000000", position: 0 },
                        { color: watch("config.theme.primary") || "#ffffff", position: 100 },
                      ],
                    });
                  }
                  if (type === "texture" && !watch("config.theme.texture")) {
                    setValue("config.theme.texture", {
                      type: "texture",
                      url: "",
                      opacity: 100,
                      blend: "normal",
                    });
                  }
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {backgroundType === "gradient" && <GradientEditor form={form} />}
        {backgroundType === "texture" && <TextureEditor form={form} />}
      </form>
    </Form>
  );
}
