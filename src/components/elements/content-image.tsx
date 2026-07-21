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

  return (
    <div
      id={"content-image-" + fieldName}
      className={cn(
        "relative flex flex-col h-full w-full outline-transparent rounded-md ring-offset-background",
        currentSelection == fieldName &&
          "outline-input ring-2 ring-offset-2 ring-ring",
        className
      )}
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
      {/* Censor overlays */}
      {censorAreas.map((area: any, i: number) => (
        <div
          key={i}
          className="absolute bg-black pointer-events-none"
          style={{
            left: `${area.x}%`,
            top: `${area.y}%`,
            width: `${area.width}%`,
            height: `${area.height}%`,
          }}
        />
      ))}
    </div>
  );
}
