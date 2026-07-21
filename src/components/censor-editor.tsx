"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { CensorArea } from "@/lib/validation/image-schema";
import { Button } from "@/components/ui/button";
import { Trash2, Square, Check } from "lucide-react";
import { applyImageEdits } from "@/lib/apply-image-edits";

interface CensorEditorProps {
  src: string;
  areas: CensorArea[];
  onChange: (areas: CensorArea[]) => void;
  onApply?: (newSrc: string) => void;
}

export function CensorEditor({ src, areas, onChange, onApply }: CensorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [applying, setApplying] = useState(false);

  const getPercent = useCallback(
    (e: React.MouseEvent) => {
      const img = imgRef.current;
      if (!img) return null;
      const rect = img.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const p = getPercent(e);
      if (!p) return;
      setDrawing(true);
      setStart(p);
      setCurrent(p);
    },
    [getPercent]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!drawing) return;
      const p = getPercent(e);
      if (p) setCurrent(p);
    },
    [drawing, getPercent]
  );

  const handleMouseUp = useCallback(() => {
    if (!drawing || !start || !current) return;
    setDrawing(false);

    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const width = Math.abs(current.x - start.x);
    const height = Math.abs(current.y - start.y);

    // Minimum 2% area to avoid accidental clicks
    if (width < 2 || height < 2) return;

    onChange([...areas, { x, y, width, height }]);
    setStart(null);
    setCurrent(null);
  }, [drawing, start, current, areas, onChange]);

  const removeArea = useCallback(
    (index: number) => {
      onChange(areas.filter((_, i) => i !== index));
    },
    [areas, onChange]
  );

  // Preview rectangle while drawing
  const previewRect =
    drawing && start && current
      ? {
          x: Math.min(start.x, current.x),
          y: Math.min(start.y, current.y),
          width: Math.abs(current.x - start.x),
          height: Math.abs(current.y - start.y),
        }
      : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Square className="w-3 h-3" />
        <span>Click & drag on the image to censor an area</span>
      </div>

      {/* Image with overlay */}
      <div
        ref={containerRef}
        className="relative w-full rounded border overflow-hidden select-none"
        style={{ cursor: drawing ? "crosshair" : "crosshair" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imgRef}
          src={src}
          alt="Censor preview"
          className="w-full h-auto block"
          style={{ maxHeight: 200, objectFit: "contain" }}
          onLoad={() => setImgLoaded(true)}
          crossOrigin="anonymous"
          draggable={false}
        />

        {/* Existing censor areas */}
        {imgLoaded &&
          areas.map((area, i) => (
            <div
              key={i}
              className="absolute bg-black/80 backdrop-blur-sm flex items-center justify-center group"
              style={{
                left: `${area.x}%`,
                top: `${area.y}%`,
                width: `${area.width}%`,
                height: `${area.height}%`,
              }}
            >
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-black"
                onClick={(e) => {
                  e.stopPropagation();
                  removeArea(i);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

        {/* Drawing preview */}
        {previewRect && (
          <div
            className="absolute bg-black/50 border-2 border-dashed border-white/60"
            style={{
              left: `${previewRect.x}%`,
              top: `${previewRect.y}%`,
              width: `${previewRect.width}%`,
              height: `${previewRect.height}%`,
            }}
          />
        )}
      </div>

      {/* Area count + actions */}
      {areas.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {areas.length} censored area{areas.length > 1 ? "s" : ""}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs text-destructive"
              onClick={() => onChange([])}
            >
              Clear all
            </Button>
            {onApply && (
              <Button
                size="sm"
                className="h-6 text-xs"
                disabled={applying}
                onClick={async () => {
                  setApplying(true);
                  try {
                    const dataUrl = await applyImageEdits(src, undefined, areas);
                    onApply(dataUrl);
                  } catch (err) {
                    console.error("Apply censor failed:", err);
                  } finally {
                    setApplying(false);
                  }
                }}
              >
                <Check className="w-3 h-3 mr-1" />
                {applying ? "Applying..." : "Apply"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
