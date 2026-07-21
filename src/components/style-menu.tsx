import { useSelectionContext } from "@/lib/providers/selection-context";
import { getStyleSibling } from "../lib/field-path";
import { EnumRadioGroupField } from "@/components/forms/fields/enum-radio-group-field";
import {
  DocumentFormReturn,
  ElementFieldPath,
  ImageSourceFieldPath,
  ImageSourceSrcFieldPath,
  ImageStyleObjectFitFieldPath,
  ImageStyleOpacityFieldPath,
  StyleFieldPath,
  TextStyleAlignFieldPath,
  TextStyleFontSizeFieldPath,
} from "@/lib/document-form-types";
import { cn } from "@/lib/utils";
import React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Maximize2,
  Minimize2,
  Type,
} from "lucide-react";
import { FontSizeType, TextALignType } from "@/lib/validation/text-schema";
import { OpacityFormField } from "@/components/forms/fields/opacity-form-field";
import { ImageSourceFormField } from "@/components/forms/fields/image-source-form-field";
import { ObjectFitType, CensorArea, CropArea } from "@/lib/validation/image-schema";
import { CensorEditor } from "@/components/censor-editor";
import { CropEditor } from "@/components/crop-editor";
import { ElementType } from "@/lib/validation/element-type";
import {
  TypographyFieldName,
  TypographyH3,
  TypographyH4,
  TypographyLarge,
} from "@/components/typography";
import { Separator } from "@/components/ui/separator";

const fontSizeMap: Record<FontSizeType, React.ReactElement> = {
  [FontSizeType.enum.Small]: <Type className="h-2 w-2" />,
  [FontSizeType.enum.Medium]: <Type className="h-3 w-3" />,
  [FontSizeType.enum.Large]: <Type className="h-4 w-4" />,
};

const textAlignMap: Record<TextALignType, React.ReactElement> = {
  [TextALignType.enum.Left]: <AlignLeft className="h-4 w-4" />,
  [TextALignType.enum.Center]: <AlignCenter className="h-4 w-4" />,
  [TextALignType.enum.Right]: <AlignRight className="h-4 w-4" />,
};

const objectFitMap: Record<ObjectFitType, React.ReactElement> = {
  [ObjectFitType.enum.Contain]: <Minimize2 className="h-4 w-4" />,
  [ObjectFitType.enum.Cover]: <Maximize2 className="h-4 w-4" />,
};

export function StyleMenu({
  form,
  className = "",
}: {
  form: DocumentFormReturn;
  className?: string;
}) {
  const { currentSelection: elementPath } = useSelectionContext();
  const stylePath = elementPath ? elementPath + ".style" : "";
  if (!stylePath) {
    return <></>;
  }
  const values = form.getValues(elementPath as ElementFieldPath);
  const style = values.style;
  const type = values.type;
  return (
    <div
      className={cn("grid gap-4", className)}
      onClick={
        // Don't propagate click to background
        (event) => event.stopPropagation()
      }
      key={elementPath}
    >
      <div className="space-y-2">
        <TypographyH3>Style</TypographyH3>
        <p className="text-sm text-muted-foreground">
          Set the selected element style.
        </p>
      </div>
      <Separator orientation="horizontal"></Separator>
      <div className="flex flex-col gap-6 items-start">
        {style && Object.hasOwn(style, "fontSize") ? (
          <EnumRadioGroupField
            name="Font Size"
            form={form}
            fieldName={`${stylePath}.fontSize` as TextStyleFontSizeFieldPath}
            enumValueElements={fontSizeMap}
            groupClassName="grid grid-cols-3 gap-1"
            itemClassName="h-10 w-10"
          />
        ) : null}
        {style && Object.hasOwn(style, "align") ? (
          <EnumRadioGroupField
            name="Alignment"
            form={form}
            fieldName={`${stylePath}.align` as TextStyleAlignFieldPath}
            enumValueElements={textAlignMap}
            groupClassName="grid grid-cols-3 gap-1"
            itemClassName="h-10 w-10"
          />
        ) : null}
        {style && Object.hasOwn(style, "objectFit") ? (
          <EnumRadioGroupField
            name={"Object Fit"}
            form={form}
            fieldName={`${stylePath}.objectFit` as ImageStyleObjectFitFieldPath}
            enumValueElements={objectFitMap}
            groupClassName="grid grid-cols-3  gap-1"
            itemClassName="h-10 w-10"
          />
        ) : null}
        {type == ElementType.enum.Image ||
        type == ElementType.enum.ContentImage ? (
          <>
            <div className="w-full flex flex-col gap-3">
              <h4 className="text-base font-semibold">Image</h4>
              <TypographyFieldName>Source</TypographyFieldName>
              <ImageSourceFormField
                fieldName={`${elementPath}.source` as ImageSourceFieldPath}
                form={form}
              />
            </div>
          </>
        ) : null}
        {type == ElementType.enum.ContentImage ? (
          <div className="w-full flex flex-col gap-3">
            <h4 className="text-base font-semibold">Crop</h4>
            <CropEditor
              src={form.getValues(`${elementPath}.source.src` as ImageSourceSrcFieldPath) || "https://placehold.co/400x200"}
              crop={(form.getValues(elementPath as any)?.crop || undefined) as CropArea | undefined}
              onChange={(crop: CropArea | undefined) => {
                form.setValue(`${elementPath}.crop` as any, crop, { shouldDirty: true });
              }}
              onApply={(newSrc: string) => {
                form.setValue(`${elementPath}.source.src` as any, newSrc, { shouldDirty: true });
                form.setValue(`${elementPath}.source.type` as any, "UPLOAD", { shouldDirty: true });
                form.setValue(`${elementPath}.crop` as any, undefined, { shouldDirty: true });
              }}
            />
          </div>
        ) : null}
        {type == ElementType.enum.ContentImage ? (
          <div className="w-full flex flex-col gap-3">
            <h4 className="text-base font-semibold">Censor</h4>
            <CensorEditor
              src={form.getValues(`${elementPath}.source.src` as ImageSourceSrcFieldPath) || "https://placehold.co/400x200"}
              areas={(form.getValues(elementPath as any)?.censorAreas || []) as CensorArea[]}
              onChange={(areas: CensorArea[]) => {
                form.setValue(`${elementPath}.censorAreas` as any, areas, { shouldDirty: true });
              }}
              onApply={(newSrc: string) => {
                form.setValue(`${elementPath}.source.src` as any, newSrc, { shouldDirty: true });
                form.setValue(`${elementPath}.source.type` as any, "UPLOAD", { shouldDirty: true });
                form.setValue(`${elementPath}.censorAreas` as any, [], { shouldDirty: true });
              }}
            />
          </div>
        ) : null}
        {style && Object.hasOwn(style, "opacity") ? (
          <>
            <OpacityFormField
              fieldName={`${stylePath}.opacity` as ImageStyleOpacityFieldPath}
              form={form}
              label={"Opacity"}
              className="w-full"
              disabled={
                form.getValues(
                  `${elementPath}.source.src` as ImageSourceSrcFieldPath
                ) == ""
              }
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
