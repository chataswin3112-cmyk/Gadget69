import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImageIcon, Loader2, Upload, Video, X } from "lucide-react";
import { ProductMedia } from "@/types";
import { uploadCatalogMediaFile } from "@/api/productApi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import MediaImage from "@/components/ui/media-image";
import { toast } from "sonner";

interface ProductMediaManagerProps {
  value: ProductMedia[];
  onChange: (media: ProductMedia[]) => void;
}

const mediaRoles: ProductMedia["mediaRole"][] = ["MAIN", "SIDE", "BACK", "ADDITIONAL"];

const isVideoUrl = (url: string) => {
  const lower = url.toLowerCase();
  return (
    lower.includes(".mp4") ||
    lower.includes(".mov") ||
    lower.includes(".webm") ||
    lower.includes("/video/") ||
    lower.includes("video")
  );
};

const ProductMediaManager = ({ value, onChange }: ProductMediaManagerProps) => {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlRole, setUrlRole] = useState<ProductMedia["mediaRole"]>("ADDITIONAL");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const normalizedMedia = value.map((item, index) => ({
    ...item,
    displayOrder: index,
  }));

  const handleFiles = async (files: FileList | File[]) => {
    const selectedFiles = Array.from(files);
    if (!selectedFiles.length) {
      return;
    }

    setUploading(true);
    try {
      const nextMedia = [...normalizedMedia];
      for (const file of selectedFiles) {
        const uploaded = await uploadCatalogMediaFile(file, "PRODUCT");
        const hasPrimaryImage = nextMedia.some((media) => media.mediaType === "IMAGE" && media.isPrimary);
        nextMedia.push({
          mediaUrl: uploaded.secureUrl,
          mediaType: uploaded.mediaType,
          mediaRole: uploaded.mediaType === "IMAGE" && nextMedia.length === 0 ? "MAIN" : "ADDITIONAL",
          displayOrder: nextMedia.length,
          isPrimary: uploaded.mediaType === "IMAGE" && !hasPrimaryImage,
        });
      }
      onChange(nextMedia);
      toast.success(`${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} uploaded`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const moveMedia = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= normalizedMedia.length) {
      return;
    }

    const nextMedia = [...normalizedMedia];
    const current = nextMedia[index];
    nextMedia[index] = nextMedia[nextIndex];
    nextMedia[nextIndex] = current;
    onChange(nextMedia.map((item, itemIndex) => ({ ...item, displayOrder: itemIndex })));
  };

  const updateMedia = (index: number, patch: Partial<ProductMedia>) => {
    const nextMedia = normalizedMedia.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item
    );
    onChange(nextMedia);
  };

  const setPrimary = (index: number) => {
    onChange(
      normalizedMedia.map((item, itemIndex) => ({
        ...item,
        isPrimary: item.mediaType === "IMAGE" && itemIndex === index,
      }))
    );
  };

  const removeMedia = (index: number) => {
    const nextMedia = normalizedMedia.filter((_, itemIndex) => itemIndex !== index);
    if (nextMedia.length > 0 && !nextMedia.some((item) => item.mediaType === "IMAGE" && item.isPrimary)) {
      const firstImageIndex = nextMedia.findIndex((item) => item.mediaType === "IMAGE");
      if (firstImageIndex >= 0) {
        nextMedia[firstImageIndex] = { ...nextMedia[firstImageIndex], isPrimary: true };
      }
    }
    onChange(nextMedia.map((item, itemIndex) => ({ ...item, displayOrder: itemIndex })));
  };

  const addByUrl = () => {
    if (!urlInput.trim()) {
      toast.error("Enter an image or video URL");
      return;
    }
    const isVideo = isVideoUrl(urlInput);
    const hasPrimaryImage = normalizedMedia.some((item) => item.mediaType === "IMAGE" && item.isPrimary);
    onChange([
      ...normalizedMedia,
      {
        mediaUrl: urlInput.trim(),
        mediaType: isVideo ? "VIDEO" : "IMAGE",
        mediaRole: isVideo ? "ADDITIONAL" : urlRole,
        displayOrder: normalizedMedia.length,
        isPrimary: !isVideo && !hasPrimaryImage,
      },
    ]);
    setUrlInput("");
    setUrlRole("ADDITIONAL");
  };

  return (
    <div className="space-y-5">
      {/* ── Upload Drop Zone ─────────────────────────────── */}
      <div className="space-y-2">
        <Label className="font-body">Product Media</Label>
        <div
          className="rounded-2xl border-2 border-dashed border-border bg-secondary/20 p-6 text-center transition-colors hover:border-accent/50 hover:bg-accent/5"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(event) => {
            event.preventDefault();
            void handleFiles(event.dataTransfer.files);
          }}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </div>
          <p className="font-body text-sm font-semibold text-foreground">
            {uploading ? "Uploading…" : "Drop images or videos here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Supports JPG, PNG, WEBP, MP4, MOV, WebM · Files upload to Cloudinary
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Choose Files"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files) {
                void handleFiles(event.target.files);
              }
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {/* ── Add by URL ───────────────────────────────────── */}
      <div className="grid gap-3 rounded-2xl border border-border bg-card/50 p-4 md:grid-cols-[minmax(0,1fr)_160px_120px]">
        <div className="space-y-1">
          <Label className="font-body text-xs text-muted-foreground">Add by URL</Label>
          <Input
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="https://… image or video URL"
          />
        </div>
        <div className="space-y-1">
          <Label className="font-body text-xs text-muted-foreground">Role</Label>
          <select
            value={urlRole}
            onChange={(event) => setUrlRole(event.target.value as ProductMedia["mediaRole"])}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {mediaRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="button" className="w-full" variant="outline" onClick={addByUrl}>
            Add URL
          </Button>
        </div>
      </div>

      {/* ── Media Grid ───────────────────────────────────── */}
      {normalizedMedia.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {normalizedMedia.map((media, index) => (
            <div
              key={`${media.id ?? "draft"}-${media.mediaUrl}-${index}`}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              {/* Type badge */}
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    media.mediaType === "VIDEO"
                      ? "bg-violet-100 text-violet-700 ring-1 ring-violet-200"
                      : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                  }`}
                >
                  {media.mediaType === "VIDEO" ? (
                    <Video className="h-3 w-3" />
                  ) : (
                    <ImageIcon className="h-3 w-3" />
                  )}
                  {media.mediaType}
                </span>
                <span className="text-xs text-muted-foreground">#{index + 1}</span>
              </div>

              {/* Preview */}
              <div className="mb-3 overflow-hidden rounded-xl border border-border bg-secondary/20">
                {media.mediaType === "VIDEO" ? (
                  <video
                    src={media.mediaUrl}
                    controls
                    preload="metadata"
                    className="aspect-video w-full rounded-xl object-cover bg-black"
                    style={{ maxHeight: "160px" }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <MediaImage
                    src={media.mediaUrl}
                    alt={`Product media ${index + 1}`}
                    className="aspect-video w-full object-cover"
                  />
                )}
              </div>

              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <div className="space-y-1">
                    <Label className="font-body text-xs text-muted-foreground">Role</Label>
                    <select
                      value={media.mediaRole}
                      onChange={(event) =>
                        updateMedia(index, { mediaRole: event.target.value as ProductMedia["mediaRole"] })
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {mediaRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  {media.mediaType === "IMAGE" ? (
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant={media.isPrimary ? "default" : "outline"}
                        size="sm"
                        className="w-full md:w-auto whitespace-nowrap"
                        onClick={() => setPrimary(index)}
                      >
                        {media.isPrimary ? "✓ Primary" : "Set Primary"}
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="icon" onClick={() => moveMedia(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => moveMedia(index, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removeMedia(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
          Upload a main image, side/back views, extra photos, or a product video.
        </div>
      )}
    </div>
  );
};

export default ProductMediaManager;
