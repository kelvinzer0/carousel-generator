import React, { useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import imageCompression from "browser-image-compression";
import { convertFileToDataUrl } from "@/lib/convert-file";

const MAX_IMAGE_SIZE_MB = 1;
const MAX_IMAGE_WIDTH = 1920;

interface ImageUploadButtonProps {
  onUpload: (dataUrl: string) => void;
  className?: string;
  children?: React.ReactNode;
  variant?: "button" | "dropzone";
}

export function ImageUploadButton({
  onUpload,
  className,
  children,
  variant = "button",
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: MAX_IMAGE_SIZE_MB,
        maxWidthOrHeight: MAX_IMAGE_WIDTH,
      });
      const dataUrl = await convertFileToDataUrl(compressedFile);
      onUpload(dataUrl);
    } catch (err) {
      console.error("Image upload failed:", err);
      // Fallback: try without compression
      try {
        const dataUrl = await convertFileToDataUrl(file);
        onUpload(dataUrl);
      } catch (err2) {
        console.error("Image read failed:", err2);
      }
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
    // Reset input so same file can be re-selected
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  if (variant === "dropzone") {
    return (
      <div
        className={cn(
          "border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors",
          className
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith("image/")) {
            await handleFile(file);
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
        {children || (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-6 w-6" />
            <span className="text-sm">Click or drag image here</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded border border-input hover:bg-muted transition-colors",
          className
        )}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-3 w-3" />
        Upload
      </button>
    </>
  );
}
