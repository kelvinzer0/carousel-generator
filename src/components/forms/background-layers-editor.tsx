import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Trash2, Plus, Palette, Image as ImageIcon, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { DocumentFormReturn } from "@/lib/document-form-types";
import { BackgroundLayerItemType } from "@/lib/validation/theme-schema";

const LAYER_COLORS = [
  "#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3",
  "#54a0ff", "#5f27cd", "#01a3a4", "#f368e0",
];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function SortableLayerItem({
  layer,
  index,
  onUpdate,
  onRemove,
}: {
  layer: BackgroundLayerItemType;
  index: number;
  onUpdate: (index: number, updates: Partial<BackgroundLayerItemType>) => void;
  onRemove: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-md p-3 bg-background space-y-2"
    >
      {/* Header: drag handle + type + controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <LayerTypeIcon type={layer.type} />

        <span className="text-sm font-medium flex-1 capitalize">
          Layer {index + 1} · {layer.type}
        </span>

        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => onUpdate(index, { visible: !layer.visible })}
        >
          {layer.visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Opacity slider */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-14">Opacity</span>
        <Slider
          value={[layer.opacity]}
          onValueChange={([val]) => onUpdate(index, { opacity: val })}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">
          {layer.opacity}%
        </span>
      </div>

      {/* Type-specific editor */}
      {layer.type === "color" && (
        <ColorLayerEditor layer={layer} index={index} onUpdate={onUpdate} />
      )}
      {layer.type === "gradient" && (
        <GradientLayerEditor layer={layer} index={index} onUpdate={onUpdate} />
      )}
      {layer.type === "image" && (
        <ImageLayerEditor layer={layer} index={index} onUpdate={onUpdate} />
      )}
    </div>
  );
}

function LayerTypeIcon({ type }: { type: string }) {
  if (type === "color") return <Palette className="h-4 w-4 text-blue-500" />;
  if (type === "gradient") return <Layers className="h-4 w-4 text-purple-500" />;
  if (type === "image") return <ImageIcon className="h-4 w-4 text-green-500" />;
  return null;
}

function ColorLayerEditor({
  layer,
  index,
  onUpdate,
}: {
  layer: BackgroundLayerItemType;
  index: number;
  onUpdate: (index: number, updates: Partial<BackgroundLayerItemType>) => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <input
        type="color"
        value={layer.color || "#000000"}
        onChange={(e) => onUpdate(index, { color: e.target.value })}
        className="w-10 h-8 p-1 cursor-pointer rounded border"
      />
      <Input
        value={layer.color || "#000000"}
        onChange={(e) => onUpdate(index, { color: e.target.value })}
        placeholder="#000000"
        className="flex-1 h-8 text-xs"
      />
    </div>
  );
}

const GRADIENT_DIRECTIONS = [
  { value: "to right", label: "→ Right" },
  { value: "to left", label: "← Left" },
  { value: "to bottom", label: "↓ Down" },
  { value: "to top", label: "↑ Up" },
  { value: "to bottom right", label: "↘ Diagonal" },
  { value: "to bottom left", label: "↙ Diagonal" },
  { value: "135deg", label: "↗ 135°" },
  { value: "radial", label: "◎ Radial" },
];

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
      { color: "#ff6b6b", position: 0, opacity: 100 },
      { color: "#48dbfb", position: 100, opacity: 100 },
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

  // Build preview CSS
  const previewStops = gradient.stops
    .map((s) => {
      const r = parseInt(s.color.slice(1, 3), 16);
      const g = parseInt(s.color.slice(3, 5), 16);
      const b = parseInt(s.color.slice(5, 7), 16);
      const a = (s.opacity ?? 100) / 100;
      return `rgba(${r}, ${g}, ${b}, ${a}) ${s.position}%`;
    })
    .join(", ");
  const previewCss =
    gradient.direction === "radial"
      ? `radial-gradient(circle, ${previewStops})`
      : `linear-gradient(${gradient.direction}, ${previewStops})`;

  return (
    <div className="space-y-2">
      {/* Preview bar */}
      <div className="h-6 rounded border" style={{ backgroundImage: previewCss }} />

      {/* Direction */}
      <select
        value={gradient.direction}
        onChange={(e) => updateGradient({ direction: e.target.value })}
        className="w-full h-8 rounded-md border border-input bg-transparent px-2 text-xs"
      >
        {GRADIENT_DIRECTIONS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>

      {/* Stops */}
      {gradient.stops.map((stop, stopIndex) => (
        <div key={stopIndex} className="flex gap-2 items-center">
          <input
            type="color"
            value={stop.color}
            onChange={(e) => updateStop(stopIndex, { color: e.target.value })}
            className="w-8 h-7 p-1 cursor-pointer rounded border"
          />
          <Input
            type="number"
            min={0}
            max={100}
            value={stop.position}
            onChange={(e) => updateStop(stopIndex, { position: Number(e.target.value) })}
            className="w-14 h-7 text-xs"
            placeholder="%"
          />
          <div className="flex items-center gap-1 flex-1">
            <span className="text-[10px] text-muted-foreground">A</span>
            <Slider
              value={[stop.opacity ?? 100]}
              onValueChange={([val]) => updateStop(stopIndex, { opacity: val })}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground w-6 text-right">
              {stop.opacity ?? 100}%
            </span>
          </div>
          {gradient.stops.length > 2 && (
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => removeStop(stopIndex)}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {gradient.stops.length < 5 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs w-full"
          onClick={addStop}
        >
          <Plus className="h-3 w-3 mr-1" /> Add Color Stop
        </Button>
      )}
    </div>
  );
}

function ImageLayerEditor({
  layer,
  index,
  onUpdate,
}: {
  layer: BackgroundLayerItemType;
  index: number;
  onUpdate: (index: number, updates: Partial<BackgroundLayerItemType>) => void;
}) {
  const image = layer.image || { src: "", fit: "cover" as const };

  return (
    <div className="space-y-2">
      <Input
        value={image.src}
        onChange={(e) =>
          onUpdate(index, { image: { ...image, src: e.target.value } })
        }
        placeholder="Image URL"
        className="h-8 text-xs"
      />
      <div className="flex gap-2">
        <select
          value={image.fit}
          onChange={(e) =>
            onUpdate(index, {
              image: { ...image, fit: e.target.value as "cover" | "contain" },
            })
          }
          className="flex-1 h-8 rounded-md border border-input bg-transparent px-2 text-xs"
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
        </select>
      </div>
      {image.src && (
        <div className="h-16 rounded border overflow-hidden">
          <img
            alt=""
            src={image.src}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

export function BackgroundLayersEditor() {
  const form: DocumentFormReturn = useFormContext();
  const { watch, setValue } = form;
  const layers = watch("config.theme.backgroundLayers") || [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = layers.findIndex((l) => l.id === active.id);
    const newIndex = layers.findIndex((l) => l.id === over.id);
    const newLayers = arrayMove(layers, oldIndex, newIndex);
    setValue("config.theme.backgroundLayers", newLayers);
  };

  const addLayer = (type: "color" | "gradient" | "image") => {
    const newLayer: BackgroundLayerItemType = {
      id: generateId(),
      type,
      opacity: 100,
      visible: true,
      ...(type === "color" ? { color: LAYER_COLORS[layers.length % LAYER_COLORS.length] } : {}),
      ...(type === "gradient"
        ? {
            gradient: {
              type: "gradient",
              direction: "to right",
              stops: [
                { color: "#ff6b6b", position: 0, opacity: 100 },
                { color: "#48dbfb", position: 100, opacity: 100 },
              ],
            },
          }
        : {}),
      ...(type === "image" ? { image: { src: "", fit: "cover" as const } } : {}),
    };
    setValue("config.theme.backgroundLayers", [...layers, newLayer]);
  };

  const updateLayer = (index: number, updates: Partial<BackgroundLayerItemType>) => {
    const newLayers = layers.map((layer, i) =>
      i === index ? { ...layer, ...updates } : layer
    );
    setValue("config.theme.backgroundLayers", newLayers);
  };

  const removeLayer = (index: number) => {
    setValue(
      "config.theme.backgroundLayers",
      layers.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-3">
      <FormLabel className="text-base font-medium">Background Layers</FormLabel>
      <p className="text-xs text-muted-foreground">
        Stack layers to create complex backgrounds. Drag to reorder.
      </p>

      {layers.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={layers.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {layers.map((layer, index) => (
                <SortableLayerItem
                  key={layer.id}
                  layer={layer}
                  index={index}
                  onUpdate={updateLayer}
                  onRemove={removeLayer}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {layers.length === 0 && (
        <div className="border border-dashed rounded-md p-4 text-center text-sm text-muted-foreground">
          No layers. Add a layer below to get started.
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={() => addLayer("color")}
        >
          <Palette className="h-3 w-3 mr-1" /> Color
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={() => addLayer("gradient")}
        >
          <Layers className="h-3 w-3 mr-1" /> Gradient
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={() => addLayer("image")}
        >
          <ImageIcon className="h-3 w-3 mr-1" /> Image
        </Button>
      </div>
    </div>
  );
}
