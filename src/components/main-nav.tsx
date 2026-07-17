import * as React from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Button, buttonVariants } from "./ui/button";
import { EditorMenubar } from "./editor-menubar";
import { Download, Loader2Icon, Upload, ChevronDown, FolderOpen } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExportImageFormat } from "@/lib/hooks/use-component-printer";
import { RemixPostUploadResult } from "@/lib/remixpost-upload";

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
  uploadPdf: (folderPath: string) => Promise<RemixPostUploadResult>;
  uploadImages: (format: ExportImageFormat, folderPath: string) => Promise<RemixPostUploadResult[]>;
  isUploading: boolean;
  className?: string;
}

export function MainNav({
  handlePrint,
  isPrinting,
  exportAsImages,
  isExporting,
  uploadPdf,
  uploadImages,
  isUploading,
  className,
}: MainNavProps) {
  const isLoading = isPrinting || isExporting || isUploading;

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [uploadType, setUploadType] = React.useState<"pdf" | "png" | "webp" | "jpeg">("pdf");
  const [folderPath, setFolderPath] = React.useState("carousel-exports");

  const openUploadDialog = (type: "pdf" | "png" | "webp" | "jpeg") => {
    setUploadType(type);
    setUploadDialogOpen(true);
  };

  const handleUploadConfirm = async () => {
    setUploadDialogOpen(false);

    const folder = folderPath.trim() || "carousel-exports";

    if (uploadType === "pdf") {
      const result = await uploadPdf(folder);
      if (result.success) {
        alert("✅ PDF uploaded to RemixPost!");
      } else {
        alert(`❌ Upload failed: ${result.error}`);
      }
    } else {
      const results = await uploadImages(uploadType, folder);
      const succeeded = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success);
      if (failed.length === 0) {
        alert(`✅ ${succeeded} ${uploadType.toUpperCase()} images uploaded!`);
      } else {
        alert(
          `⚠️ ${succeeded} succeeded, ${failed.length} failed.\n${failed.map((r) => r.error).join("\n")}`
        );
      }
    }
  };

  return (
    <div
      className={cn(
        "flex gap-2 md:gap-4 lg:gap-10 justify-between items-center",
        className
      )}
    >
      <div className="flex gap-2 md:gap-4 items-center">
        <Link href="/" className="items-center space-x-2 flex" prefetch={false} scroll={false}>
          <Icons.logo />
          <span className="hidden lg:inline-block font-bold">
            Carousel Generator
          </span>
        </Link>
        <EditorMenubar />
      </div>
      <div className="hidden lg:flex">
        <Pager />
      </div>
      <div className="flex gap-1 md:gap-2 items-center">
        <div className="hidden lg:block">
          <FilenameForm />
        </div>

        {/* ── Download Dropdown ──────────────────────────── */}
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
            <DropdownMenuLabel>Download PDF</DropdownMenuLabel>
            <DropdownMenuItem onClick={handlePrint} disabled={isLoading}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Download Images (ZIP)</DropdownMenuLabel>
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

        {/* ── Upload to RemixPost Dropdown ───────────────── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 px-2">
              {isUploading ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span className="hidden sm:inline text-xs">RemixPost</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Upload PDF</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openUploadDialog("pdf")} disabled={isLoading}>
              <Upload className="w-4 h-4 mr-2" />
              Upload PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Upload Images</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openUploadDialog("png")} disabled={isLoading}>
              <Upload className="w-4 h-4 mr-2" />
              Upload PNGs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openUploadDialog("webp")} disabled={isLoading}>
              <Upload className="w-4 h-4 mr-2" />
              Upload WEBPs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openUploadDialog("jpeg")} disabled={isLoading}>
              <Upload className="w-4 h-4 mr-2" />
              Upload JPEGs
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ── Upload Folder Dialog ───────────────────────── */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Upload {uploadType.toUpperCase()} to RemixPost
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <label className="text-sm font-medium">
                Folder path di RemixPost
              </label>
              <Input
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="carousel-exports"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Contoh: <code>promotions</code>, <code>brand/carousel</code>, <code>2024/jan</code>
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleUploadConfirm} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
      </div>
    </div>
  );
}
