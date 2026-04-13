import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/api/productApi";
import { isVideoUrl } from "@/lib/video";
import MediaImage from "@/components/ui/media-image";
import VideoFrame from "@/components/ui/VideoFrame";

interface MediaUploadFieldProps {
  label: string;
  value?: string;
  accept?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

const MediaUploadField = ({
  label,
  value,
  accept = "image/*",
  placeholder,
  onChange,
}: MediaUploadFieldProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadFile(file);
      onChange(url);
      toast.success(`${file.name} uploaded`);
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="font-body">{label}</Label>
      <Input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <label className="flex items-center gap-2 text-sm text-muted-foreground font-body">
        <Upload className="h-4 w-4" />
        <span>{uploading ? "Uploading..." : "Upload file"}</span>
        {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </label>
      {value && (
        isVideoUrl(value) ? (
          <VideoFrame
            src={value}
            title={label}
            className="rounded-lg border border-border bg-card/50"
          />
        ) : (
          <MediaImage src={value} alt={label} className="h-28 w-full rounded-lg object-cover border border-border bg-card/50" />
        )
      )}
    </div>
  );
};

export default MediaUploadField;
