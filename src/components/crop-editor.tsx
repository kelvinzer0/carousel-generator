"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { CropArea } from "@/lib/validation/image-schema";
import { Button } from "@/components/ui/button";
import { Crop, RotateCcw, Check } from "lucide-react";
import { applyImageEdits } from "@/lib/apply-image-edits";

interface CropEditorProps {
  src: string;
  crop: CropArea | undefined;
  onChange: (crop: CropArea | undefined) => void;
  onApply?: (newSrc: string) => void;
}

type Handle = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

const MIN_SIZE = 5; // minimum 5%

export function CropEditor({ src, crop, onChange, onApply }: CropEditorProps) {
  const [applying, setApplying] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<Handle | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [startCrop, setStartCrop] = useState<CropArea | null>(null);

  // Default crop = full image
  const current: CropArea = crop || { x: 0, y: 0, width: 100, height: 100 };

  const getPercent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const img = imgRef.current;
      if (!img) return null;
      const rect = img.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
        y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: Handle) => {
      e.preventDefault();
      e.stopPropagation();
      const p = getPercent(e);
      if (!p) return;
      setDragging(true);
      setActiveHandle(handle);
      setStartPos(p);
      setStartCrop({ ...current });
    },
    [getPercent, current]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !startPos || !startCrop || !activeHandle) return;
      const p = getPercent(e);
      if (!p) return;

      const dx = p.x - startPos.x;
      const dy = p.y - startPos.y;

      let { x, y, width, height } = startCrop;

      if (activeHandle === "move") {
        x = Math.max(0, Math.min(100 - width, startCrop.x + dx));
        y = Math.max(0, Math.min(100 - height, startCrop.y + dy));
      } else {
        // Resize handles
        if (activeHandle.includes("w")) {
          const newX = Math.max(0, Math.min(startCrop.x + startCrop.width - MIN_SIZE, startCrop.x + dx));
          width = startCrop.x + startCrop.width - newX;
          x = newX;
        }
        if (activeHandle.includes("e")) {
          width = Math.max(MIN_SIZE, Math.min(100 - startCrop.x, startCrop.width + dx));
        }
        if (activeHandle.includes("n")) {
          const newY = Math.max(0, Math.min(startCrop.y + startCrop.height - MIN_SIZE, startCrop.y + dy));
          height = startCrop.y + startCrop.height - newY;
          y = newY;
        }
        if (activeHandle.includes("s")) {
          height = Math.max(MIN_SIZE, Math.min(100 - startCrop.y, startCrop.height + dy));
        }
      }

      onChange({ x, y, width, height });
    },
    [dragging, startPos, startCrop, activeHandle, getPercent, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setActiveHandle(null);
    setStartPos(null);
    setStartCrop(null);
  }, []);

  const resetCrop = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  // Dark overlay outside crop area using clip-path
  const overlayStyle = {
    clipPath: `polygon(
      0% 0%, 100% 0%, 100% 100%, 0% 100%,
      0% ${current.y}%,
      ${current.x}% ${current.y}%,
      ${current.x}% ${current.y + current.height}%,
      ${current.x + current.width}% ${current.y + current.height}%,
      ${current.x + current.width}% ${current.y}%,
      0% ${current.y}%
    )`,
  };

  const handleSize = 10; // px

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Crop className="w-3 h-3" />
        <span>Drag handles to crop. Inner area = visible.</span>
      </div>

      {/* Image with crop overlay */}
      <div
        className="relative w-full rounded border overflow-hidden select-none"
        style={{ cursor: dragging ? "grabbing" : "default" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imgRef}
          src={src}
          alt="Crop preview"
          className="w-full h-auto block"
          style={{ maxHeight: 200, objectFit: "contain" }}
          crossOrigin="anonymous"
          draggable={false}
        />

        {/* Dark overlay outside crop */}
        <div
          className="absolute inset-0 bg-black/50 pointer-events-none"
          style={overlayStyle}
        />

        {/* Crop area border */}
        <div
          className="absolute border-2 border-white pointer-events-none"
          style={{
            left: `${current.x}%`,
            top: `${current.y}%`,
            width: `${current.width}%`,
            height: `${current.height}%`,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          }}
        >
          {/* Grid lines (rule of thirds) */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
          </div>
        </div>

        {/* Move area (inside crop) */}
        <div
          className="absolute cursor-move"
          style={{
            left: `${current.x}%`,
            top: `${current.y}%`,
            width: `${current.width}%`,
            height: `${current.height}%`,
          }}
          onMouseDown={(e) => handleMouseDown(e, "move")}
        />

        {/* Corner handles */}
        {(["nw", "ne", "sw", "se"] as const).map((pos) => {
          const posMap = {
            nw: { left: `${current.x}%`, top: `${current.y}%` },
            ne: { left: `${current.x + current.width}%`, top: `${current.y}%` },
            sw: { left: `${current.x}%`, top: `${current.y + current.height}%` },
            se: { left: `${current.x + current.width}%`, top: `${current.y + current.height}%` },
          };
          const cursorMap = { nw: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", se: "nwse-resize" };
          return (
            <div
              key={pos}
              className="absolute bg-white border border-gray-400 rounded-sm"
              style={{
                ...posMap[pos],
                width: handleSize,
                height: handleSize,
                marginLeft: -handleSize / 2,
                marginTop: -handleSize / 2,
                cursor: cursorMap[pos],
                zIndex: 10,
              }}
              onMouseDown={(e) => handleMouseDown(e, pos)}
            />
          );
        })}

        {/* Edge handles */}
        {(["n", "s", "e", "w"] as const).map((pos) => {
          const styleMap: Record<string, React.CSSProperties> = {
            n: {
              left: `${current.x}%`, top: `${current.y}%`,
              width: `${current.width}%`, height: 4,
              marginLeft: 0, marginTop: -2,
              cursor: "ns-resize",
            },
            s: {
              left: `${current.x}%`, top: `${current.y + current.height}%`,
              width: `${current.width}%`, height: 4,
              marginLeft: 0, marginTop: -2,
              cursor: "ns-resize",
            },
            e: {
              left: `${current.x + current.width}%`, top: `${current.y}%`,
              width: 4, height: `${current.height}%`,
              marginLeft: -2, marginTop: 0,
              cursor: "ew-resize",
            },
            w: {
              left: `${current.x}%`, top: `${current.y}%`,
              width: 4, height: `${current.height}%`,
              marginLeft: -2, marginTop: 0,
              cursor: "ew-resize",
            },
          };
          return (
            <div
              key={pos}
              className="absolute"
              style={{ ...styleMap[pos], zIndex: 10 }}
              onMouseDown={(e) => handleMouseDown(e, pos)}
            />
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {crop ? `${Math.round(crop.width)}% × ${Math.round(crop.height)}%` : "Full image"}
        </span>
        <div className="flex gap-1">
          {crop && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={resetCrop}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
          {crop && onApply && (
            <Button
              size="sm"
              className="h-6 text-xs"
              disabled={applying}
              onClick={async () => {
                setApplying(true);
                try {
                  const dataUrl = await applyImageEdits(src, crop);
                  onApply(dataUrl);
                } catch (err) {
                  console.error("Apply crop failed:", err);
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
    </div>
  );
}
