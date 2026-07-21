/* eslint-disable @next/next/no-img-element */
import React from "react";
import * as z from "zod";
import { cn } from "@/lib/utils";
import {
  ObjectFitType,
  ImageSchema,
  ContentImageSchema,
} from "@/lib/validation/image-schema";
import { useSelectionContext } from "@/lib/providers/selection-context";
import { getSlideNumber } from "@/lib/field-path";
import { usePagerContext } from "@/lib/providers/pager-context";
import { useFormContext } from "react-hook-form";
import {
  DocumentFormReturn,
  ElementFieldPath,
} from "@/lib/document-form-types";

export function ContentImage({
  fieldName,
  className,
}: {
  fieldName: ElementFieldPath;
  className?: string;
}) {
  const form: DocumentFormReturn = useFormContext();
  const { getValues } = form;
  const image = getValues(fieldName) as z.infer<typeof ContentImageSchema>;

  const { setCurrentPage } = usePagerContext();
  const { currentSelection, setCurrentSelection } = useSelectionContext();
  const pageNumber = getSlideNumber(fieldName);
  const source = image?.source?.src || "https://placehold.co/400x200";

  // TODO: Convert to Toggle to make it accessible. Control with selection

  const censorAreas = (image as any)?.censorAreas || [];
  const crop = (image as any)?.crop as { x: number; y: number; width: number; height: number } | undefined;

  // Crop is applied on the container via clip-path so object-fit on <img> works normally
  // inset(top right bottom left)
  const containerClip = crop
    ? `inset(${crop.y}% ${100 - crop.x - crop.width}% ${100 - crop.y - crop.height}% ${crop.x}%)`
    : undefined;

  // Censor areas need to be remapped if crop is active
  // When crop is active, the visible region is [crop.x..crop.x+crop.width] × [crop.y..crop.y+crop.height]
  // Censor coords are in original image % space, so we remap to the cropped container space
  const remapCensor = crop
    ? (area: { x: number; y: number; width: number; height: number }) => ({
        x: ((area.x - crop.x) / crop.width) * 100,
        y: ((area.y - crop.y) / crop.height) * 100,
        width: (area.width / crop.width) * 100,
        height: (area.height / crop.height) * 100,
      })
    : (area: { x: number; y: number; width: number; height: number }) => area;

  return (
    <div
      id={"content-image-" + fieldName}
      className={cn(
        "relative flex flex-col h-full w-full outline-transparent rounded-md ring-offset-background overflow-hidden",
        currentSelection == fieldName &&
          "outline-input ring-2 ring-offset-2 ring-ring",
        className
      )}
      style={{
        clipPath: containerClip,
      }}
    >
      <img
        alt="slide image"
        src={source}
        className={cn(
          "rounded-md overflow-hidden",
          image?.style?.objectFit == ObjectFitType.enum.Cover
            ? "object-cover w-full h-full"
            : image?.style?.objectFit == ObjectFitType.enum.Contain
            ? "object-contain w-fit h-fit"
            : ""
        )}
        style={{
          opacity: (image?.style?.opacity ?? 100) / 100,
        }}
        onClick={(event) => {
          setCurrentPage(pageNumber);
          setCurrentSelection(fieldName, event);
        }}
      />
      {/* Censor overlays — remapped into crop space if crop is active */}
      {censorAreas.map((area: any, i: number) => {
        const r = remapCensor(area);
        return (
          <div
            key={i}
            className="absolute bg-black pointer-events-none"
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: `${r.width}%`,
              height: `${r.height}%`,
            }}
          />
        );
      })}
    </div>
  );
}
