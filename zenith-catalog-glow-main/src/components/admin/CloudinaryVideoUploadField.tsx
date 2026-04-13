import { useRef, useState } from "react";
import { Loader2, RefreshCw, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { uploadCommunityVideo } from "@/api/communityApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import MediaImage from "@/components/ui/media-image";
import VideoFrame from "@/components/ui/VideoFrame";
import { getErrorMessage } from "@/lib/api-error";
import { readVideoMetadata } from "@/lib/cloudinary";
import { CommunityMedia } from "@/types";

interface CloudinaryVideoUploadFieldProps {
  value: Partial<CommunityMedia>;
  onChange: (patch: Partial<CommunityMedia>) => void;
}

const clearVideoPatch: Partial<CommunityMedia> = {
  videoUrl: "",
  thumbnailUrl: "",
  videoPublicId: undefined,
  videoWidth: undefined,
  videoHeight: undefined,
  videoDuration: undefined,
};

const formatDuration = (duration?: number) => {
  if (!duration || duration <= 0) {
    return "Duration pending";
  }

  const totalSeconds = Math.round(duration);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (!minutes) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

const formatDimensions = (width?: number, height?: number) => {
  if (!width || !height) {
    return "Any orientation";
  }
  return `${width} x ${height}`;
};

const CloudinaryVideoUploadField = ({ value, onChange }: CloudinaryVideoUploadFieldProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const localMetadata = await readVideoMetadata(file);
      const uploaded = await uploadCommunityVideo(file, (nextProgress) => setProgress(nextProgress));
      const nextValue: Partial<CommunityMedia> = {
        imageUrl: "",
        videoUrl: uploaded.videoUrl,
        thumbnailUrl: uploaded.thumbnailUrl,
        videoPublicId: uploaded.videoPublicId,
        videoWidth: uploaded.videoWidth ?? localMetadata.width,
        videoHeight: uploaded.videoHeight ?? localMetadata.height,
        videoDuration: uploaded.videoDuration ?? localMetadata.duration,
      };

      onChange(nextValue);
      toast.success(`${file.name} uploaded to Cloudinary`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Cloudinary video upload failed"));
    } finally {
      setUploading(false);
      setProgress(0);
      event.target.value = "";
    }
  };

  const previewPoster = value.thumbnailUrl || value.imageUrl || "/placeholder.svg";
  const hasVideo = Boolean(value.videoUrl);
  const handleVideoUrlChange = (nextVideoUrl: string) => {
    onChange({
      imageUrl: "",
      videoUrl: nextVideoUrl,
      thumbnailUrl: "",
      videoPublicId: undefined,
      videoWidth: undefined,
      videoHeight: undefined,
      videoDuration: undefined,
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/50 p-4">
      <div className="space-y-1">
        <Label className="font-body">Community Video</Label>
        <p className="text-sm text-muted-foreground">
          Paste a Cloudinary, YouTube, or Instagram link, or upload any MP4, MOV, or WebM file. Every source is shown inside a landscape frame on the storefront.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="aspect-video bg-secondary/30">
          {hasVideo ? (
            <VideoFrame
              src={value.videoUrl}
              title={value.title || value.caption || "Community video preview"}
              videoPublicId={value.videoPublicId}
              poster={previewPoster}
              className="rounded-none border-0"
            />
          ) : (
            <MediaImage
              src={previewPoster}
              alt={value.title || value.caption || "Community video preview"}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Video className="h-4 w-4 text-accent" />
              <span>{hasVideo ? "Video ready" : "No video uploaded yet"}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDuration(value.videoDuration)} - {formatDimensions(value.videoWidth, value.videoHeight)}
            </p>
            <Input
              value={value.videoUrl || ""}
              onChange={(event) => handleVideoUrlChange(event.target.value)}
              placeholder="Paste a Cloudinary, YouTube, or Instagram video URL"
              className="bg-background/80"
            />
            {value.videoPublicId ? (
              <Input
                value={value.videoPublicId}
                readOnly
                placeholder="Cloudinary public ID"
                className="bg-background/80"
              />
            ) : null}
          </div>
          <div className="flex flex-col gap-2 md:min-w-40">
            <Button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : hasVideo ? (
                <RefreshCw className="mr-2 h-4 w-4" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {hasVideo ? "Replace Video" : "Upload Video"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={uploading || !hasVideo}
              onClick={() => onChange(clearVideoPatch)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              aria-label="Upload community video"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </div>
        </div>
      </div>

      {uploading ? (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">{Math.round(progress)}% uploaded to Cloudinary</p>
        </div>
      ) : null}
    </div>
  );
};

export default CloudinaryVideoUploadField;
