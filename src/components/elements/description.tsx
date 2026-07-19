import React from "react";
import { cn } from "@/lib/utils";
import { useGoogleFont } from "@/lib/hooks/use-google-font";
import { textStyleToClasses } from "@/lib/text-style-to-classes";
import { useFormContext } from "react-hook-form";
import { TextAreaFormField } from "@/components/forms/fields/text-area-form-field";
import {
  DocumentFormReturn,
  TextFieldPath,
  TextFieldStyle,
  StyleFieldPath,
  TextTextFieldPath,
} from "@/lib/document-form-types";
import { getTextStyleCSS } from "@/lib/text-style-css";

export function Description({
  fieldName,
  className = "",
}: {
  fieldName: TextFieldPath;
  className?: string;
}) {
  const form: DocumentFormReturn = useFormContext();
  const { getValues } = form;
  const config = getValues("config");
  const style = getValues(
    `${fieldName}.style` as StyleFieldPath
  ) as TextFieldStyle;
  const textFieldName = (fieldName + ".text") as TextTextFieldPath;

  const fontFamily = useGoogleFont(config.fonts.font2);
  const secondaryStyle = config.theme.secondaryStyle;
  const hasGradientTexture = secondaryStyle?.useGradient || secondaryStyle?.useTexture;

  const plainStyle: React.CSSProperties = {
    fontFamily,
    whiteSpace: "pre-wrap",
    ...(hasGradientTexture ? {} : { color: config.theme.secondary }),
  };

  const gradientStyle: React.CSSProperties | undefined = hasGradientTexture
    ? { ...getTextStyleCSS(secondaryStyle), fontFamily }
    : undefined;

  return (
    <TextAreaFormField
      fieldName={textFieldName}
      form={form}
      label={""}
      placeholder={"Your description here"}
      className={cn(
        `font-medium`,
        textStyleToClasses({
          style: style,
          sizes: ["text-xl", "text-lg", "text-base"],
        }),
        className
      )}
      style={plainStyle}
      gradientStyle={gradientStyle}
    />
  );
}
