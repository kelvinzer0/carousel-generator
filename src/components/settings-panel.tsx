"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandForm } from "@/components/forms/brand-form";
import { ThemeForm } from "@/components/forms/theme-form";
import {
  VerticalTabs,
  VerticalTabsContent,
  VerticalTabsList,
  VerticalTabsTrigger,
} from "@/components/ui/vertical-tabs";
import { Separator } from "@/components/ui/separator";
import { FontsForm } from "@/components/forms/fonts-form";
import { PageNumberForm } from "./forms/page-number-form";
import { SizeForm } from "./forms/size-form";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import {
  Briefcase,
  Brush,
  FileDigit,
  LucideIcon,
  Maximize2,
  Palette,
  Plus,
  Type,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Drawer } from "vaul";
import { DrawerContent, DrawerTrigger } from "@/components/drawer";
import { ReactNode, useState } from "react";
import { buttonVariants } from "./ui/button";
import { useSelectionContext } from "@/lib/providers/selection-context";
import { StyleMenu } from "@/components/style-menu";
import { useFormContext } from "react-hook-form";
import { DocumentFormReturn } from "@/lib/document-form-types";

type TabInfo = {
  name: string;
  value: string;
  icon: LucideIcon;
};

const ALL_FORMS: Record<string, TabInfo> = {
  brand: {
    name: "Brand",
    value: "brand",
    icon: Briefcase,
  },
  theme: {
    name: "Theme",
    value: "theme",
    icon: Palette,
  },
  fonts: {
    name: "Fonts",
    value: "fonts",
    icon: Type,
  },
  pageNumber: {
    name: "Numbers",
    value: "number",
    icon: FileDigit,
  },
  size: {
    name: "Size",
    value: "size",
    icon: Maximize2,
  },
};

export function SidebarPanel({ className }: { className?: string }) {
  const form: DocumentFormReturn = useFormContext();
  const { currentSelection } = useSelectionContext();

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Mobile: horizontal tab bar at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
        <MobileTabBar />
      </div>

      {/* Desktop: vertical sidebar */}
      <aside className="hidden md:flex h-full">
        <SidebarTabsPanel />
      </aside>

      {/* Mobile floating buttons */}
      <MobileFloatingButtons />
    </div>
  );
}

function MobileTabBar() {
  const form: DocumentFormReturn = useFormContext();
  const { currentSelection } = useSelectionContext();
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);

  return (
    <>
      <div className="flex justify-around items-center h-14 px-2">
        {Object.values(ALL_FORMS).map((tabInfo) => (
          <button
            key={tabInfo.value}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-md text-muted-foreground transition-colors",
              openDrawer === tabInfo.value && "text-primary bg-muted"
            )}
            onClick={() => setOpenDrawer(tabInfo.value)}
          >
            <tabInfo.icon className="h-4 w-4" />
            <span className="text-[10px]">{tabInfo.name}</span>
          </button>
        ))}
      </div>

      <Drawer.Root
        open={openDrawer !== null}
        onOpenChange={(open) => !open && setOpenDrawer(null)}
      >
        <DrawerContent className="max-h-[70vh]">
          <div className="overflow-y-auto p-4">
            {openDrawer && (
              <>
                <h4 className="text-lg font-semibold mb-3">
                  {ALL_FORMS[openDrawer]?.name}
                </h4>
                <Separator className="mb-4" />
                {openDrawer === "brand" && <BrandForm />}
                {openDrawer === "theme" && <ThemeForm />}
                {openDrawer === "fonts" && <FontsForm />}
                {openDrawer === "number" && <PageNumberForm />}
                {openDrawer === "size" && <SizeForm />}
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer.Root>
    </>
  );
}

function MobileFloatingButtons() {
  const form: DocumentFormReturn = useFormContext();
  const { currentSelection } = useSelectionContext();

  if (!currentSelection) return null;

  return (
    <Drawer.Root modal={true}>
      <DrawerTrigger asChild>
        <button
          className={cn(
            buttonVariants({ variant: "default", size: "icon" }),
            "fixed bottom-20 right-4 rounded-full w-12 h-12 z-50 shadow-lg md:hidden"
          )}
        >
          <Brush className="w-4 h-4" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[50vh]">
        <div className="overflow-y-auto p-4">
          <StyleMenu form={form} />
        </div>
      </DrawerContent>
    </Drawer.Root>
  );
}

function VerticalTabTriggerButton({ tabInfo }: { tabInfo: TabInfo }) {
  const { setCurrentSelection } = useSelectionContext();
  return (
    <VerticalTabsTrigger
      value={tabInfo.value}
      className="h-16 flex flex-col gap-2 items-center py-2 justify-center"
      onFocus={() => setCurrentSelection("", null)}
    >
      <tabInfo.icon className="h-4 w-4" />
      <span className="sr-only">{tabInfo.name}</span>
      <p className="text-xs">{tabInfo.name}</p>
    </VerticalTabsTrigger>
  );
}

export function SidebarTabsPanel() {
  const { currentSelection } = useSelectionContext();
  const [tab, setTab] = useState(ALL_FORMS.brand.value);
  const form: DocumentFormReturn = useFormContext();

  return (
    <VerticalTabs
      value={currentSelection ? "" : tab}
      onValueChange={(val) => {
        if (val) {
          setTab(val);
        }
      }}
      className="flex-1 h-full p-0"
    >
      <div className="flex flex-row h-full w-full">
        <ScrollArea className="border-r h-full bg-muted shrink-0">
          <VerticalTabsList className="grid grid-cols-1 gap-1 w-16 lg:w-20 rounded-none">
            <VerticalTabTriggerButton tabInfo={ALL_FORMS.brand} />
            <VerticalTabTriggerButton tabInfo={ALL_FORMS.theme} />
            <VerticalTabTriggerButton tabInfo={ALL_FORMS.fonts} />
            <VerticalTabTriggerButton tabInfo={ALL_FORMS.pageNumber} />
            <VerticalTabTriggerButton tabInfo={ALL_FORMS.size} />
          </VerticalTabsList>
        </ScrollArea>
        <div className="flex-1 overflow-y-auto">
          {currentSelection ? (
            <StyleMenu form={form} className="m-4" />
          ) : null}
          <VerticalTabsContent
            value={ALL_FORMS.brand.value}
            className="mt-0 border-0 p-0 m-4"
          >
            <h4 className="text-lg font-semibold">{ALL_FORMS.brand.name}</h4>
            <Separator className="mt-2 mb-4" />
            <BrandForm />
          </VerticalTabsContent>
          <VerticalTabsContent
            value={ALL_FORMS.theme.value}
            className="mt-0 border-0 p-0 m-4"
          >
            <h4 className="text-lg font-semibold">{ALL_FORMS.theme.name}</h4>
            <Separator className="mt-2 mb-4" />
            <ThemeForm />
          </VerticalTabsContent>
          <VerticalTabsContent
            value={ALL_FORMS.fonts.value}
            className="mt-0 border-0 p-0 m-4"
          >
            <h4 className="text-lg font-semibold">{ALL_FORMS.fonts.name}</h4>
            <Separator className="mt-2 mb-4" />
            <FontsForm />
          </VerticalTabsContent>
          <VerticalTabsContent
            value={ALL_FORMS.pageNumber.value}
            className="mt-0 border-0 p-0 m-4"
          >
            <h4 className="text-lg font-semibold">
              {ALL_FORMS.pageNumber.name}
            </h4>
            <Separator className="mt-2 mb-4" />
            <PageNumberForm />
          </VerticalTabsContent>
          <VerticalTabsContent
            value={ALL_FORMS.size.value}
            className="mt-0 border-0 p-0 m-4"
          >
            <h4 className="text-lg font-semibold">{ALL_FORMS.size.name}</h4>
            <Separator className="mt-2 mb-4" />
            <SizeForm />
          </VerticalTabsContent>
        </div>
      </div>
    </VerticalTabs>
  );
}
