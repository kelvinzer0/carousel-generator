"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { DocumentFormReturn } from "@/lib/document-form-types";
import { BackgroundLayerItemType, PatternType } from "@/lib/validation/theme-schema";
import { BackgroundLayerRenderer } from "@/components/elements/background-layer-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Eye,
  EyeOff,
  Plus,
  GripVertical,
  Paintbrush,
  Layers,
  Image as ImageIcon,
  Sparkles,
  Palette,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PixabaySearch } from "@/components/pixabay-search";
import { convertFileToDataUrl } from "@/lib/convert-file";
import imageCompression from "browser-image-compression";
import {
  extractEmoji,
  mapEmojiToFontAwesome,
  EmojiMapping,
  generatePatternDataUrlAsync,
  hasEmoji,
} from "@/lib/emoji-fontawesome-map";

// ── Gradient Directions ─────────────────────────────────────────

const GRADIENT_DIRECTIONS = [
  { label: "→ Right", value: "to right" },
  { label: "← Left", value: "to left" },
  { label: "↓ Bottom", value: "to bottom" },
  { label: "↑ Top", value: "to top" },
  { label: "↘ Diagonal", value: "to bottom right" },
  { label: "↗ Diagonal", value: "to top right" },
  { label: "◎ Radial", value: "radial" },
];

// ── Emoji Pattern Generator ────────────────────────────────────

function EmojiPatternGenerator({
  onGenerate,
}: {
  onGenerate: (icons: EmojiMapping[]) => void;
}) {
  const [inputText, setInputText] = useState("");

  const detected = useMemo(() => {
    if (!inputText.trim()) return [];
    const emojiList = extractEmoji(inputText);
    return emojiList
      .map(mapEmojiToFontAwesome)
      .filter((m): m is EmojiMapping => m !== null);
  }, [inputText]);

  return (
    <div className="space-y-2 p-2 border rounded-md bg-muted/30">
      <Label className="text-xs font-medium">
        <i className="fa-solid fa-wand-magic-sparkles mr-1"></i>
        Auto-detect Emoji → FA Icons
      </Label>
      <Input
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste text with emoji here... 🎯🔥⭐"
        className="h-8 text-xs"
      />
      {detected.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {detected.map((icon, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs"
              >
                <i className={`${icon.faClass} text-sm`}></i>
                <span className="text-muted-foreground">{icon.name}</span>
              </span>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs"
            onClick={() => onGenerate(detected)}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Generate Pattern from {detected.length} Icon{detected.length > 1 ? "s" : ""}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Pattern Preview (canvas-based) ──────────────────────────────

function PatternPreview({
  icons,
  color,
  opacity,
  iconSize,
  patternSize,
  fill,
}: {
  icons: EmojiMapping[];
  color: string;
  opacity: number;
  iconSize: number;
  patternSize: number;
  fill: "solid" | "outline";
}) {
  const [patternUrl, setPatternUrl] = useState<string>("");

  useEffect(() => {
    if (icons.length === 0) {
      setPatternUrl("");
      return;
    }
    generatePatternDataUrlAsync(icons, patternSize, iconSize, color, opacity / 100, fill)
      .then(setPatternUrl)
      .catch(() => setPatternUrl(""));
  }, [icons, patternSize, iconSize, color, opacity, fill]);

  if (!patternUrl || icons.length === 0) return null;

  return (
    <div
      className="w-full h-16 rounded border"
      style={{
        backgroundImage: `url("${patternUrl}")`,
        backgroundRepeat: "repeat",
        backgroundSize: `${patternSize}px ${patternSize}px`,
      }}
    />
  );
}

// ── Pattern Layer Editor ────────────────────────────────────────

function PatternLayerEditor({
  layer,
  index,
  onUpdate,
}: {
  layer: BackgroundLayerItemType;
  index: number;
  onUpdate: (index: number, updates: Partial<BackgroundLayerItemType>) => void;
}) {
  const pattern = layer.pattern || {
    type: "pattern" as const,
    icons: [],
    color: "#ffffff",
    opacity: 15,
    iconSize: 28,
    patternSize: 80,
    fill: "solid" as const,
  };

  const updatePattern = (updates: Partial<PatternType>) => {
    onUpdate(index, { pattern: { ...pattern, ...updates } as PatternType });
  };

  return (
    <div className="space-y-3 mt-2">
      {/* Emoji auto-detect */}
      <EmojiPatternGenerator
        onGenerate={(icons) => updatePattern({ icons })}
      />

      {/* Manual icon list */}
      {pattern.icons.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">
            <i className="fa-solid fa-icons mr-1"></i>
            Icons ({pattern.icons.length})
          </Label>
          <div className="flex flex-wrap gap-1">
            {pattern.icons.map((icon, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-xs"
              >
                <i className={`${icon.faClass} text-sm`}></i>
                <button
                  className="text-muted-foreground hover:text-destructive ml-1"
                  onClick={() => {
                    const newIcons = pattern.icons.filter((_, j) => j !== i);
                    updatePattern({ icons: newIcons });
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Color */}
      <div className="flex items-center gap-2">
        <Label className="text-xs w-16">Color</Label>
        <div className="flex items-center gap-1 flex-1">
          <input
            type="color"
            value={pattern.color}
            onChange={(e) => updatePattern({ color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <Input
            value={pattern.color}
            onChange={(e) => updatePattern({ color: e.target.value })}
            className="h-8 text-xs flex-1"
          />
        </div>
      </div>

      {/* Fill mode */}
      <div className="flex items-center gap-2">
        <Label className="text-xs w-16">Style</Label>
        <div className="flex gap-1 flex-1">
          <Button
            size="sm"
            variant={pattern.fill === "solid" ? "default" : "outline"}
            className="h-7 flex-1 text-xs"
            onClick={() => updatePattern({ fill: "solid" })}
          >
            <Paintbrush className="w-3 h-3 mr-1" />
            Solid
          </Button>
          <Button
            size="sm"
            variant={pattern.fill === "outline" ? "default" : "outline"}
            className="h-7 flex-1 text-xs"
            onClick={() => updatePattern({ fill: "outline" })}
          >
            <Palette className="w-3 h-3 mr-1" />
            Outline
          </Button>
        </div>
      </div>

      {/* Opacity */}
      <div className="flex items-center gap-2">
        <Label className="text-xs w-16">Opacity</Label>
        <Slider
          value={[pattern.opacity]}
          onValueChange={([v]) => updatePattern({ opacity: v })}
          min={1}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-xs w-8 text-right">{pattern.opacity}%</span>
      </div>

      {/* Icon size */}
      <div className="flex items-center gap-2">
        <Label className="text-xs w-16">Icon Size</Label>
        <Slider
          value={[pattern.iconSize]}
          onValueChange={([v]) => updatePattern({ iconSize: v })}
          min={8}
          max={120}
          step={2}
          className="flex-1"
        />
        <span className="text-xs w-8 text-right">{pattern.iconSize}px</span>
      </div>

      {/* Pattern density */}
      <div className="flex items-center gap-2">
        <Label className="text-xs w-16">Density</Label>
        <Slider
          value={[pattern.patternSize]}
          onValueChange={([v]) => updatePattern({ patternSize: v })}
          min={30}
          max={200}
          step={5}
          className="flex-1"
        />
        <span className="text-xs w-8 text-right">{pattern.patternSize}px</span>
      </div>

      {/* Preview */}
      <PatternPreview
        icons={pattern.icons}
        color={pattern.color}
        opacity={pattern.opacity}
        iconSize={pattern.iconSize}
        patternSize={pattern.patternSize}
        fill={pattern.fill}
      />
    </div>
  );
}

// ── Gradient Layer Editor ───────────────────────────────────────

function GradientLayerEditor({
  layer,
  index,
  onUpdate,
}: {
  layer: BackgroundLayerItemType;
  index: number;
  onUpdate: (index: number, updates: Partial<BackgroundLayerItemType>) => void;
}) {
  const gradient = layer.gradient || {
    type: "gradient" as const,
    direction: "to right",
    stops: [
      { color: "#ff0000", position: 0, opacity: 100 },
      { color: "#0000ff", position: 100, opacity: 100 },
    ],
  };

  const updateGradient = (updates: Partial<typeof gradient>) => {
    onUpdate(index, { gradient: { ...gradient, ...updates } });
  };

  const updateStop = (stopIndex: number, updates: Partial<typeof gradient.stops[0]>) => {
    const newStops = gradient.stops.map((stop, i) =>
      i === stopIndex ? { ...stop, ...updates } : stop
    );
    updateGradient({ stops: newStops });
  };

  const addStop = () => {
    if (gradient.stops.length >= 5) return;
    const lastPos = gradient.stops[gradient.stops.length - 1]?.position || 0;
    updateGradient({
      stops: [...gradient.stops, { color: "#ffffff", position: Math.min(100, lastPos + 20), opacity: 100 }],
    });
  };

  const removeStop = (stopIndex: number) => {
    if (gradient.stops.length <= 2) return;
    updateGradient({
      stops: gradient.stops.filter((_, i) => i !== stopIndex),
    });
  };

  const previewStops = gradient.stops
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.color} ${s.position}%`)
    .join(", ");

  const previewCss =
    gradient.direction === "radial"
      ? `radial-gradient(circle, ${previewStops})`
      : `linear-gradient(${gradient.direction}, ${previewStops})`;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <Label className="text-xs w-16">Direction</Label>
        <Select
          value={gradient.direction}
          onValueChange={(e) => updateGradient({ direction: e.target.value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRADIENT_DIRECTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {gradient.stops.map((stop, stopIndex) => (
        <div key={stopIndex} className="flex items-center gap-1">
          <input
            type="color"
            value={stop.color}
            onChange={(e) => updateStop(stopIndex, { color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <Input
            value={stop.color}
            onChange={(e) => updateStop(stopIndex, { color: e.target.value })}
            className="h-8 text-xs flex-1"
          />
          <Input
            type="number"
            value={stop.position}
            onChange={(e) => updateStop(stopIndex, { position: parseInt(e.target.value) || 0 })}
            className="h-8 text-xs w-16"
            min={0}
            max={100}
          />
          {gradient.stops.length > 2 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => removeStop(stopIndex)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}

      {gradient.stops.length < 5 && (
        <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={addStop}>
          <Plus className="w-3 h-3 mr-1" /> Add Stop
        </Button>
      )}

      <div className="w-full h-8 rounded border" style={{ background: previewCss }} />
    </div>
  );
}

// ── Auto-Pattern from Slide Text ────────────────────────────────

/**
 * Scan all slide texts for emoji and auto-create GLOBAL pattern layer.
 */
export function useAutoPattern() {
  const form: DocumentFormReturn = useFormContext();

  const generateAutoPattern = async () => {
    const slides = form.getValues("slides") || [];
    const currentLayers = form.getValues("config.theme.backgroundLayers") || [];

    let allEmoji: string[] = [];
    slides.forEach((slide: any) => {
      if (slide.elements) {
        slide.elements.forEach((el: any) => {
          if (el.text) {
            allEmoji = [...allEmoji, ...extractEmoji(el.text)];
          }
        });
      }
    });

    const uniqueEmoji = [...new Set(allEmoji)];
    if (uniqueEmoji.length === 0) return;

    const icons = uniqueEmoji
      .map(mapEmojiToFontAwesome)
      .filter((m): m is EmojiMapping => m !== null);

    if (icons.length === 0) return;

    const existingPattern = currentLayers.find(
      (l: any) => l.type === "pattern"
    );

    const newPattern: BackgroundLayerItemType = {
      id: existingPattern?.id || `pattern-global-${Date.now()}`,
      type: "pattern",
      opacity: 15,
      visible: true,
      pattern: {
        type: "pattern",
        icons: icons.slice(0, 8),
        color: "#ffffff",
        opacity: 15,
        iconSize: 28,
        patternSize: 80,
        fill: "solid",
      },
    };

    if (existingPattern) {
      const updated = currentLayers.map((l: any) =>
        l.id === existingPattern.id ? newPattern : l
      );
      form.setValue("config.theme.backgroundLayers", updated, { shouldDirty: true });
    } else {
      form.setValue(
        "config.theme.backgroundLayers",
        [...currentLayers, newPattern],
        { shouldDirty: true }
      );
    }
  };

  return { generateAutoPattern };
}

/**
 * Scan emoji from a SINGLE slide and create per-slide pattern layer.
 */
export function useAutoPatternPerSlide(slideIndex: number) {
  const form: DocumentFormReturn = useFormContext();

  const generatePatternForSlide = async () => {
    const slide = form.getValues(`slides.${slideIndex}`);
    const elements = slide?.elements || [];
    const currentLayers = slide?.backgroundLayers || [];

    let slideEmoji: string[] = [];
    elements.forEach((el: any) => {
      if (el.text) {
        slideEmoji = [...slideEmoji, ...extractEmoji(el.text)];
      }
    });

    const uniqueEmoji = [...new Set(slideEmoji)];
    if (uniqueEmoji.length === 0) return;

    const icons = uniqueEmoji
      .map(mapEmojiToFontAwesome)
      .filter((m): m is EmojiMapping => m !== null);

    if (icons.length === 0) return;

    const existingPattern = currentLayers.find(
      (l: any) => l.type === "pattern"
    );

    const newPattern: BackgroundLayerItemType = {
      id: existingPattern?.id || `pattern-slide-${slideIndex}-${Date.now()}`,
      type: "pattern",
      opacity: 15,
      visible: true,
      pattern: {
        type: "pattern",
        icons: icons.slice(0, 8),
        color: "#ffffff",
        opacity: 15,
        iconSize: 28,
        patternSize: 80,
        fill: "solid",
      },
    };

    if (existingPattern) {
      const updated = currentLayers.map((l: any) =>
        l.id === existingPattern.id ? newPattern : l
      );
      form.setValue(`slides.${slideIndex}.backgroundLayers`, updated, { shouldDirty: true });
    } else {
      form.setValue(
        `slides.${slideIndex}.backgroundLayers`,
        [...currentLayers, newPattern],
        { shouldDirty: true }
      );
    }
  };

  const clearPatternForSlide = () => {
    form.setValue(`slides.${slideIndex}.backgroundLayers`, [], { shouldDirty: true });
  };

  return { generatePatternForSlide, clearPatternForSlide };
}

// ── Per-Slide Pattern Button ────────────────────────────────────

export function SlidePatternButton({ slideIndex }: { slideIndex: number }) {
  const { generatePatternForSlide, clearPatternForSlide } = useAutoPatternPerSlide(slideIndex);
  const form: DocumentFormReturn = useFormContext();
  const slideLayers = form.watch(`slides.${slideIndex}.backgroundLayers`) || [];
  const hasPattern = slideLayers.some((l: any) => l.type === "pattern");

  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant={hasPattern ? "default" : "outline"}
        className="h-7 text-xs flex-1"
        onClick={generatePatternForSlide}
      >
        <Wand2 className="w-3 h-3 mr-1" />
        {hasPattern ? "Update" : "Auto"} Pattern
      </Button>
      {hasPattern && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs px-2"
          onClick={clearPatternForSlide}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

// ── Image Layer Editor ──────────────────────────────────────────

function ImageLayerEditor({
  layer,
  index,
  onUpdate,
}: {
  layer: BackgroundLayerItemType;
  index: number;
  onUpdate: (index: number, updates: Partial<BackgroundLayerItemType>) => void;
}) {
  const [tab, setTab] = useState<"url" | "upload" | "pixabay">("url");
  const image = layer.image || { src: "", fit: "cover" as const };

  const updateImage = (updates: Partial<{ src: string; fit: "cover" | "contain" }>) => {
    onUpdate(index, { image: { ...image, ...updates } });
  };

  return (
    <div className="space-y-2 mt-2">
      {/* Tab buttons */}
      <div className="flex gap-1">
        <Button size="sm" variant={tab === "url" ? "default" : "outline"} className="h-7 flex-1 text-xs" onClick={() => setTab("url")}>URL</Button>
        <Button size="sm" variant={tab === "upload" ? "default" : "outline"} className="h-7 flex-1 text-xs" onClick={() => setTab("upload")}>Upload</Button>
        <Button size="sm" variant={tab === "pixabay" ? "default" : "outline"} className="h-7 flex-1 text-xs" onClick={() => setTab("pixabay")}>Pixabay</Button>
      </div>

      {/* URL input */}
      {tab === "url" && (
        <div className="flex gap-1">
          <Input
            placeholder="Image URL"
            className="h-8 text-xs flex-1"
            value={image.src}
            onChange={(e) => updateImage({ src: e.target.value })}
          />
        </div>
      )}

      {/* Upload */}
      {tab === "upload" && (
        <Input
          accept=".jpg, .jpeg, .png, .svg, .webp"
          type="file"
          className="h-8 text-xs"
          onChange={async (e) => {
            const file = e.target?.files ? e.target?.files[0] : null;
            if (file) {
              const compressedFile = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 800 });
              const dataUrl = await convertFileToDataUrl(compressedFile);
              updateImage({ src: dataUrl });
            }
          }}
        />
      )}

      {/* Pixabay */}
      {tab === "pixabay" && (
        <PixabaySearch onSelect={(url) => updateImage({ src: url })} />
      )}

      {/* Fit mode */}
      {image.src && (
        <div className="flex gap-1">
          <Button size="sm" variant={image.fit === "cover" ? "default" : "outline"} className="h-7 flex-1 text-xs" onClick={() => updateImage({ fit: "cover" })}>Cover</Button>
          <Button size="sm" variant={image.fit === "contain" ? "default" : "outline"} className="h-7 flex-1 text-xs" onClick={() => updateImage({ fit: "contain" })}>Contain</Button>
        </div>
      )}

      {/* Preview */}
      {image.src && (
        <div className="w-full h-16 rounded border overflow-hidden">
          <img src={image.src} alt="" className="w-full h-full" style={{ objectFit: image.fit || "cover" }} />
        </div>
      )}
    </div>
  );
}

// ── Main Background Layers Editor ───────────────────────────────

export function BackgroundLayersEditor() {
  const form: DocumentFormReturn = useFormContext();
  const layers = form.watch("config.theme.backgroundLayers") || [];
  const { generateAutoPattern } = useAutoPattern();

  const updateLayer = (index: number, updates: Partial<BackgroundLayerItemType>) => {
    const currentLayers = form.getValues("config.theme.backgroundLayers") || [];
    const newLayers = currentLayers.map((layer, i) =>
      i === index ? { ...layer, ...updates } : layer
    );
    form.setValue("config.theme.backgroundLayers", newLayers, { shouldDirty: true });
  };

  const removeLayer = (index: number) => {
    const currentLayers = form.getValues("config.theme.backgroundLayers") || [];
    form.setValue(
      "config.theme.backgroundLayers",
      currentLayers.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  };

  const toggleVisibility = (index: number) => {
    const currentLayers = form.getValues("config.theme.backgroundLayers") || [];
    updateLayer(index, { visible: !currentLayers[index].visible });
  };

  const moveLayer = (index: number, direction: "up" | "down") => {
    const currentLayers = form.getValues("config.theme.backgroundLayers") || [];
    const newLayers = [...currentLayers];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLayers.length) return;
    [newLayers[index], newLayers[targetIndex]] = [newLayers[targetIndex], newLayers[index]];
    form.setValue("config.theme.backgroundLayers", newLayers, { shouldDirty: true });
  };

  const addLayer = (type: "color" | "gradient" | "image" | "pattern") => {
    const id = `layer-${Date.now()}`;
    const currentLayers = form.getValues("config.theme.backgroundLayers") || [];
    const newLayer: BackgroundLayerItemType = {
      id,
      type,
      opacity: 100,
      visible: true,
      ...(type === "color" ? { color: "#000000" } : {}),
      ...(type === "gradient"
        ? {
            gradient: {
              type: "gradient",
              direction: "to right",
              stops: [
                { color: "#ff0000", position: 0, opacity: 100 },
                { color: "#0000ff", position: 100, opacity: 100 },
              ],
            },
          }
        : {}),
      ...(type === "pattern"
        ? {
            pattern: {
              type: "pattern",
              icons: [],
              color: "#ffffff",
              opacity: 15,
              iconSize: 28,
              patternSize: 80,
              fill: "solid" as const,
            },
          }
        : {}),
    };
    form.setValue("config.theme.backgroundLayers", [...currentLayers, newLayer], {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Background Layers</Label>
      </div>

      {/* Auto-pattern button */}
      <Button
        size="sm"
        variant="secondary"
        className="w-full h-8 text-xs"
        onClick={generateAutoPattern}
      >
        <Wand2 className="w-3 h-3 mr-1" />
        <i className="fa-solid fa-wand-magic-sparkles mr-1"></i>
        Auto Pattern from Slide Emoji
      </Button>

      {/* Layer list */}
      <div className="space-y-2">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className="border rounded-md p-2 space-y-2 bg-card"
          >
            {/* Layer header */}
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />

              {layer.type === "color" && <Paintbrush className="w-4 h-4 text-blue-500" />}
              {layer.type === "gradient" && <Layers className="w-4 h-4 text-purple-500" />}
              {layer.type === "image" && <ImageIcon className="w-4 h-4 text-green-500" />}
              {layer.type === "pattern" && <Sparkles className="w-4 h-4 text-amber-500" />}

              <span className="text-xs font-medium capitalize flex-1">
                {layer.type}
                {layer.type === "pattern" && layer.pattern?.icons?.length
                  ? ` (${layer.pattern.icons.length} icons)`
                  : ""}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => moveLayer(index, "up")}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => moveLayer(index, "down")}
                  disabled={index === layers.length - 1}
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => toggleVisibility(index)}
                >
                  {layer.visible ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={() => removeLayer(index)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Layer opacity */}
            <div className="flex items-center gap-2">
              <Label className="text-xs w-16">Opacity</Label>
              <Slider
                value={[layer.opacity]}
                onValueChange={([v]) => updateLayer(index, { opacity: v })}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs w-8 text-right">{layer.opacity}%</span>
            </div>

            {/* Type-specific editor */}
            {layer.type === "color" && (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={layer.color || "#000000"}
                  onChange={(e) => updateLayer(index, { color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <Input
                  value={layer.color || "#000000"}
                  onChange={(e) => updateLayer(index, { color: e.target.value })}
                  className="h-8 text-xs flex-1"
                />
              </div>
            )}

            {layer.type === "gradient" && (
              <GradientLayerEditor layer={layer} index={index} onUpdate={updateLayer} />
            )}

            {layer.type === "pattern" && (
              <PatternLayerEditor layer={layer} index={index} onUpdate={updateLayer} />
            )}

            {layer.type === "image" && (
              <ImageLayerEditor layer={layer} index={index} onUpdate={updateLayer} />
            )}
          </div>
        ))}
      </div>

      {/* Add layer buttons */}
      <div className="grid grid-cols-2 gap-1">
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addLayer("color")}>
          <Paintbrush className="w-3 h-3 mr-1" /> Color
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addLayer("gradient")}>
          <Layers className="w-3 h-3 mr-1" /> Gradient
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addLayer("pattern")}>
          <Sparkles className="w-3 h-3 mr-1" /> Pattern
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addLayer("image")}>
          <ImageIcon className="w-3 h-3 mr-1" /> Image
        </Button>
      </div>
    </div>
  );
}
