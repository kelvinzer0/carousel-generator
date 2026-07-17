import * as React from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Button, buttonVariants } from "./ui/button";
import { EditorMenubar } from "./editor-menubar";
import { Download, Loader2Icon, Settings, ChevronDown } from "lucide-react";
import Pager from "./pager";
import { FilenameForm } from "./forms/filename-form";
import { BringYourKeysDialog } from "@/components/api-keys-dialog";
import { StarOnGithub } from "@/components/star-on-github";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ExportImageFormat } from "@/lib/hooks/use-component-printer";

export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
};

export type MainNavItem = NavItem;

interface MainNavProps {
  handlePrint: () => void | Promise<void>;
  isPrinting: boolean;
  exportAsImages: (format: ExportImageFormat, quality?: number) => Promise<void>;
  isExporting: boolean;
  className?: string;
}

export function MainNav({ handlePrint, isPrinting, exportAsImages, isExporting, className }: MainNavProps) {
  const isLoading = isPrinting || isExporting;

  return (
    <div
      className={cn(
        "flex gap-4 md:gap-10 justify-between items-center",
        className
      )}
    >
      <div className="flex gap-4">
        <Link href="/" className="items-center space-x-2 flex">
          <Icons.logo />
          <span className="hidden font-bold md:inline-block">
            Carousel Generator
          </span>
        </Link>
        <EditorMenubar />
      </div>
      <div className="hidden lg:block">
        <Pager />
      </div>
      <div className="flex gap-2 items-center">
        <div className="hidden md:block">
          <FilenameForm />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 px-2">
              {isLoading ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export as PDF</DropdownMenuLabel>
            <DropdownMenuItem onClick={handlePrint} disabled={isLoading}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Export as Images (ZIP)</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => exportAsImages("png")}
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              PNG images
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => exportAsImages("webp")}
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              WEBP images
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => exportAsImages("jpeg")}
              disabled={isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              JPEG images
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <StarOnGithub />
        <Link
          className="block lg:hidden"
          href={"https://github.com/FranciscoMoretti/carousel-generator"}
          target="_blank"
          rel="noreferrer"
        >
          <div
            className={cn(
              buttonVariants({
                variant: "ghost",
              }),
              "w-9 px-0"
            )}
          >
            <Icons.gitHub className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </div>
        </Link>
        {/* // TODO: Re-enable your own keys system  */}
        {/* <BringYourKeysDialog
          triggerButton={
            <Button variant="ghost" size={"icon"}>
              <div className="flex flex-row gap-1 items-center">
                <Settings />
              </div>
            </Button>
          }
        /> */}
      </div>
    </div>
  );
}
