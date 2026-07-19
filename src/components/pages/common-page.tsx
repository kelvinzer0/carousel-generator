import React, { useState } from "react";
import * as z from "zod";
import { ConfigSchema } from "@/lib/validation/document-schema";
import Footer from "../elements/footer";
import { cn } from "@/lib/utils";
import { CommonSlideSchema } from "@/lib/validation/slide-schema";
import { BackgroundLayer } from "@/components/elements/background-layer";
import { BackgroundImageLayer } from "@/components/elements/background-image-layer";
import { BackgroundLayerRenderer } from "@/components/elements/background-layer-renderer";
import { PageBase } from "@/components/pages/page-base";
import { Title } from "@/components/elements/title";
import { Subtitle } from "@/components/elements/subtitle";
import { Description } from "@/components/elements/description";
import {
  ElementArrayFieldPath,
  ElementFieldPath,
  SlideFieldPath,
  TextFieldPath,
} from "@/lib/document-form-types";
import { PageFrame } from "@/components/pages/page-frame";
import { PageLayout } from "@/components/pages/page-layout";
import { AddElement } from "@/components/pages/add-element";
import { ElementType } from "@/lib/validation/element-type";
import { ContentImage } from "@/components/elements/content-image";
import { DecorativeEmojis } from "@/components/elements/decorative-emojis";
import ElementMenubarWrapper from "@/components/element-menubar-wrapper";
import { useElementSize } from "usehooks-ts";

export function CommonPage({
  index,
  config,
  slide,
  size,
  fieldName,
  className,
}: {
  index: number;
  config: z.infer<typeof ConfigSchema>;
  slide: z.infer<typeof CommonSlideSchema>;
  size: { width: number; height: number };
  fieldName: SlideFieldPath;
  className?: string;
}) {
  const LAYOUT_GAP = 8;
  const FRAME_PADDING = 40;
  const backgroundImageField = fieldName + ".backgroundImage";
  const [elementsHeight, setElementsHeight] = useState<number | null>(null);
  const [footerRef, footerDimensions] = useElementSize();
  const inputRefs = React.useRef<HTMLDivElement[]>([]);
  const offsetHeights = inputRefs.current.map((ref) => ref.offsetHeight);

  React.useEffect(
    () => {
      const elementsHeights = inputRefs.current
        .filter((ref) => ref)
        .map((ref) => ref.offsetHeight);
      // Gap between existent elements + 1 for the element to be introduced by add button
      const gapHeights = elementsHeights.length * LAYOUT_GAP;
      setElementsHeight(
        elementsHeights.reduce((acc, el) => acc + el, 0) + gapHeights
      );
    },
    [offsetHeights]
    // TODO ADD dependencies
  );
  const remainingHeight = elementsHeight
    ? size.height - FRAME_PADDING * 2 - footerDimensions.height - elementsHeight
    : 0;

  return (
    <PageBase size={size} fieldName={backgroundImageField}>
      {/* Background layers container */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        {/* Global background layers (theme-level) */}
        {config.theme.backgroundLayers && config.theme.backgroundLayers.length > 0 ? (
          config.theme.backgroundLayers.map((layer, i) => (
            <BackgroundLayerRenderer
              key={layer.id}
              layer={layer}
              style={{ zIndex: i }}
            />
          ))
        ) : (
          /* Legacy background color fallback — only when no layers */
          <BackgroundLayer background={config.theme.background} />
        )}
        {/* Slide-level background layers (overrides global) */}
        {slide.backgroundLayers && slide.backgroundLayers.length > 0 && (
          slide.backgroundLayers.map((layer, i) => (
            <BackgroundLayerRenderer
              key={layer.id}
              layer={layer}
              style={{ zIndex: 100 + i }}
            />
          ))
        )}
      </div>

      {/* Legacy slide background image */}
      {slide.backgroundImage?.source.src ? (
        <BackgroundImageLayer image={slide.backgroundImage} className="z-[1]" />
      ) : null}

      {/* Decorative emojis from AI */}
      {slide.decorativeEmojis && slide.decorativeEmojis.length > 0 ? (
        <DecorativeEmojis emojis={slide.decorativeEmojis} />
      ) : null}
      <PageFrame
        fieldName={backgroundImageField}
        className={cn("p-10", className)}
      >
        <PageLayout fieldName={backgroundImageField} className={"gap-2"}>
          {slide.elements.map((element, index) => {
            const currentField = (fieldName +
              ".elements." +
              index) as ElementFieldPath;
            return element.type == ElementType.enum.Title ? (
              <ElementMenubarWrapper
                key={currentField}
                fieldName={currentField}
                ref={(el) => {
                  el ? (inputRefs.current[index] = el) : null;
                }}
              >
                <Title fieldName={currentField as TextFieldPath} />
              </ElementMenubarWrapper>
            ) : element.type == ElementType.enum.Subtitle ? (
              <ElementMenubarWrapper
                key={currentField}
                fieldName={currentField}
                ref={(el) => {
                  el ? (inputRefs.current[index] = el) : null;
                }}
              >
                <Subtitle fieldName={currentField as TextFieldPath} />
              </ElementMenubarWrapper>
            ) : element.type == ElementType.enum.Description ? (
              <ElementMenubarWrapper
                key={currentField}
                fieldName={currentField}
                ref={(el) => {
                  el ? (inputRefs.current[index] = el) : null;
                }}
              >
                <Description fieldName={currentField as TextFieldPath} />
              </ElementMenubarWrapper>
            ) : element.type == ElementType.enum.ContentImage ? (
              <ElementMenubarWrapper
                key={currentField}
                fieldName={currentField}
                ref={(el) => {
                  el ? (inputRefs.current[index] = el) : null;
                }}
              >
                <ContentImage
                  fieldName={currentField as ElementFieldPath}
                  className="h-auto"
                />
              </ElementMenubarWrapper>
            ) : null;
          })}
          {/* // TODO Replace 50 by the element size of element to introduce or minimum of all elements */}
          {remainingHeight && remainingHeight >= 50 ? (
            <AddElement
              fieldName={(fieldName + ".elements") as ElementArrayFieldPath}
            />
          ) : null}
        </PageLayout>
        <Footer number={index + 1} config={config} ref={footerRef} />
      </PageFrame>
    </PageBase>
  );
}
