"use client";

import { SidebarPanel } from "@/components/settings-panel";
import { SlidesEditor } from "@/components/slides-editor";
import React from "react";
import { useComponentPrinter } from "@/lib/hooks/use-component-printer";

import { RefProvider } from "@/lib/providers/reference-context";
import { MainNav } from "./main-nav";

export default function Editor({}: {}) {
  const {
    componentRef,
    handlePrint,
    isPrinting,
    exportAsImages,
    isExporting,
    uploadPdf,
    uploadImages,
    isUploading,
  } = useComponentPrinter();

  return (
    <RefProvider myRef={componentRef}>
      <div className="flex-1 flex flex-col min-h-0">
        <MainNav
          className="h-14 border-b px-4 md:px-6 shrink-0"
          handlePrint={handlePrint}
          isPrinting={isPrinting}
          exportAsImages={exportAsImages}
          isExporting={isExporting}
          uploadPdf={uploadPdf}
          uploadImages={uploadImages}
          isUploading={isUploading}
        />
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          <aside className="hidden md:block md:w-[320px] lg:w-[360px] shrink-0 border-r overflow-hidden">
            <SidebarPanel />
          </aside>
          <div className="flex-1 min-w-0 min-h-0">
            <SlidesEditor />
          </div>
        </div>
      </div>
    </RefProvider>
  );
}
