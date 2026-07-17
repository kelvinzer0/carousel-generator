import React from "react";
import * as z from "zod";
import { ConfigSchema } from "@/lib/validation/document-schema";
import { cn } from "@/lib/utils";
import { useGoogleFont } from "@/lib/hooks/use-google-font";
import { TitleSchema } from "@/lib/validation/text-schema";
import { textStyleToClasses } from "@/lib/text-style-to-classes";
import { useFormContext } from "react-hook-form";
import {
  DocumentFormReturn,
  TextFieldPath,
  TextFieldStyle,
  StyleFieldPath,
  TextTextFieldPath,
} from "@/lib/document-form-types";
import { TextAreaFormField } from "@/components/forms/fields/text-area-form-field";
import { getTextStyleCSS } from "@/lib/text-style-css";

export function Title({
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

  const fontFamily = useGoogleFont(config.fonts.font1);
  const primaryStyle = config.theme.primaryStyle;
  const hasGradientTexture = primaryStyle?.useGradient || primaryStyle?.useTexture;

  const plainStyle: React.CSSProperties = {
    fontFamily,
    ...(hasGradientTexture ? {} : { color: config.theme.primary }),
  };

  const gradientStyle: React.CSSProperties | undefined = hasGradientTexture
    ? { ...getTextStyleCSS(primaryStyle), fontFamily }
    : undefined;

  return (
    <TextAreaFormField
      fieldName={textFieldName}
      form={form}
      label={""}
      placeholder={"Your title here"}
      className={cn(
        `font-black`,
        textStyleToClasses({
          style: style,
          sizes: ["text-7xl", "text-5xl", "text-3xl"],
        }),
        className
      )}
      style={plainStyle}
      gradientStyle={gradientStyle}
    />
  );
}
