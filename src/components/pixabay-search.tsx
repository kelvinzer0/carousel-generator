"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface PixabayImage {
  id: number;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  tags: string;
  user: string;
  width: number;
  height: number;
}

interface PixabaySearchProps {
  onSelect: (imageUrl: string) => void;
  className?: string;
}

export function PixabaySearch({ onSelect, className }: PixabaySearchProps) {
  const [query, setQuery] = useState("");
  const [images, setImages] = useState<PixabayImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalHits, setTotalHits] = useState(0);

  const searchImages = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: pageNum.toString(),
        per_page: "20",
        orientation: "horizontal",
        image_type: "photo",
      });

      const response = await fetch(`/api/pixabay?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to search images");
      }

      const data = await response.json();
      
      if (pageNum === 1) {
        setImages(data.images);
      } else {
        setImages(prev => [...prev, ...data.images]);
      }
      
      setTotalHits(data.totalHits);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search images");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchImages(query, 1);
    }
  }, [query, searchImages]);

  const loadMore = useCallback(() => {
    if (images.length < totalHits && !loading) {
      searchImages(query, page + 1);
    }
  }, [images.length, totalHits, loading, query, page, searchImages]);

  const handleSelect = useCallback((image: PixabayImage) => {
    onSelect(image.largeImageURL || image.webformatURL);
  }, [onSelect]);

  return (
    <div className={cn("space-y-3", className)}>
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Search Pixabay images..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </form>

      {error && (
        <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            {totalHits.toLocaleString()} images found
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => handleSelect(image)}
                className="group relative aspect-video overflow-hidden rounded border hover:border-primary transition-colors cursor-pointer"
              >
                <img
                  src={image.previewURL}
                  alt={image.tags}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Select
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                  <span className="text-white text-[10px] truncate block">
                    {image.user}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {images.length < totalHits && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Load More
            </Button>
          )}

          <div className="text-[10px] text-muted-foreground text-center">
            Images from{" "}
            <a
              href="https://pixabay.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Pixabay
            </a>{" "}
            • Free for commercial use
          </div>
        </div>
      )}

      {!loading && images.length === 0 && query && !error && (
        <div className="text-sm text-muted-foreground text-center py-4">
          No images found. Try a different search term.
        </div>
      )}
    </div>
  );
}
