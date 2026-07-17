"use client";

import { SidebarPanel } from "@/components/settings-panel";
import { SlidesEditor } from "@/components/slides-editor";
import React from "react";
import { useComponentPrinter } from "@/lib/hooks/use-component-printer";

import { RefProvider } from "@/lib/providers/reference-context";
import { MainNav } from "./main-nav";

export default function Editor({}: {}) {
  const { componentRef, handlePrint, isPrinting, exportAsImages, isExporting } = useComponentPrinter();

  return (
    <RefProvider myRef={componentRef}>
      <div className="flex-1 flex flex-col min-h-0">
        <MainNav
          className="h-14 border-b px-4 md:px-6 shrink-0"
          handlePrint={handlePrint}
          isPrinting={isPrinting}
          exportAsImages={exportAsImages}
          isExporting={isExporting}
        />
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Sidebar: hidden on mobile, shown on md+ */}
          <aside className="hidden md:block md:w-[320px] lg:w-[360px] shrink-0 border-r overflow-hidden">
            <SidebarPanel />
          </aside>
          {/* Editor area */}
          <div className="flex-1 min-w-0 min-h-0">
            <SlidesEditor />
          </div>
        </div>
      </div>
    </RefProvider>
  );
}
