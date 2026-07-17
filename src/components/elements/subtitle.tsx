import { cn } from "@/lib/utils";
import { useGoogleFont } from "@/lib/hooks/use-google-font";
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

export function Subtitle({
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
  const secondaryStyle = config.theme.secondaryStyle;
  const hasGradientTexture = secondaryStyle?.useGradient || secondaryStyle?.useTexture;

  return (
    <TextAreaFormField
      fieldName={textFieldName}
      form={form}
      label={""}
      placeholder={"Your subtitle here"}
      className={cn(
        `font-bold`,
        textStyleToClasses({
          style: style,
          sizes: ["text-3xl", "text-2xl", "text-xl"],
        }),
        className
      )}
      style={{
        fontFamily,
        ...(hasGradientTexture
          ? getTextStyleCSS(secondaryStyle)
          : { color: config.theme.secondary }),
      }}
    />
  );
}
