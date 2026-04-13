import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import CloudinaryVideoUploadField from "@/components/admin/CloudinaryVideoUploadField";
import MediaUploadField from "@/components/admin/MediaUploadField";
import { useAdminData } from "@/contexts/AdminDataContext";
import { CommunityMedia } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getErrorMessage } from "@/lib/api-error";
import MediaImage from "@/components/ui/media-image";

const emptyMedia: Partial<CommunityMedia> = {
  title: "",
  caption: "",
  mediaType: "IMAGE",
  imageUrl: "",
  videoUrl: "",
  thumbnailUrl: "",
  videoPublicId: undefined,
  videoWidth: undefined,
  videoHeight: undefined,
  videoDuration: undefined,
  actionLink: "",
  displayOrder: 0,
  isActive: true,
};

const clearVideoFields = (): Partial<CommunityMedia> => ({
  videoUrl: "",
  thumbnailUrl: "",
  videoPublicId: undefined,
  videoWidth: undefined,
  videoHeight: undefined,
  videoDuration: undefined,
});

const formatVideoMeta = (item: Partial<CommunityMedia>) => {
  const parts: string[] = [];

  if (item.videoDuration && item.videoDuration > 0) {
    const rounded = Math.round(item.videoDuration);
    const minutes = Math.floor(rounded / 60);
    const seconds = rounded % 60;
    parts.push(minutes ? `${minutes}m ${seconds.toString().padStart(2, "0")}s` : `${seconds}s`);
  }

  if (item.videoWidth && item.videoHeight) {
    parts.push(`${item.videoWidth} x ${item.videoHeight}`);
  }

  return parts.join(" - ");
};

const AdminMedia = () => {
  const { communityMedia, addCommunityMedia, updateCommunityMedia, deleteCommunityMedia } = useAdminData();
  const [editing, setEditing] = useState<Partial<CommunityMedia> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing({ ...emptyMedia, displayOrder: communityMedia.length });
    setIsNew(true);
  };

  const openEdit = (item: CommunityMedia) => {
    setEditing({ ...item });
    setIsNew(false);
  };

  const save = async () => {
    if (!editing) return;

    if (editing.mediaType === "VIDEO" && !editing.videoUrl) {
      toast.error("Add a community video before saving");
      return;
    }

    try {
      setSaving(true);
      if (isNew) {
        await addCommunityMedia(editing);
        toast.success("Media item created");
      } else if (editing.id) {
        await updateCommunityMedia(editing.id, editing);
        toast.success("Media item updated");
      }
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save media item"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteCommunityMedia(deleteId);
      toast.success("Media item deleted");
      setDeleteId(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete media item"));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Community Media</h1>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              Manage homepage reels, images, and videos.
            </p>
          </div>
          <Button onClick={openNew} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" /> Add Media
          </Button>
        </div>

        <div className="grid gap-4">
          {communityMedia.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-premium">
              <div className={`${item.mediaType === "VIDEO" ? "aspect-video w-40" : "h-28 w-24"} shrink-0 overflow-hidden rounded-xl bg-secondary/30`}>
                <MediaImage
                  src={item.thumbnailUrl || item.imageUrl || "/placeholder.svg"}
                  alt={item.title || item.caption || "Media item"}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body font-medium">{item.title || item.caption || "Untitled media"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.mediaType} - Order {item.displayOrder}
                </p>
                {item.mediaType === "VIDEO" ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatVideoMeta(item) || "Community video"}
                  </p>
                ) : null}
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.caption}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.isActive}
                  onCheckedChange={(value) => updateCommunityMedia(item.id, { isActive: value })}
                />
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(item.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{isNew ? "Add Media Item" : "Edit Media Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label className="font-body">Title</Label>
                <Input
                  value={editing?.title || ""}
                  onChange={(event) =>
                    setEditing((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="font-body">Caption</Label>
                <Textarea
                  rows={3}
                  value={editing?.caption || ""}
                  onChange={(event) =>
                    setEditing((prev) => (prev ? { ...prev, caption: event.target.value } : prev))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Media Type</Label>
                <Select
                  value={editing?.mediaType || "IMAGE"}
                  onValueChange={(value) =>
                    setEditing((prev) => {
                      if (!prev) {
                        return prev;
                      }
                      if (value === "IMAGE") {
                        return {
                          ...prev,
                          mediaType: value,
                          ...clearVideoFields(),
                        };
                      }
                      return { ...prev, mediaType: value };
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Display Order</Label>
                <Input
                  type="number"
                  value={editing?.displayOrder || 0}
                  onChange={(event) =>
                    setEditing((prev) =>
                      prev
                        ? { ...prev, displayOrder: parseInt(event.target.value, 10) || 0 }
                        : prev
                    )
                  }
                />
              </div>
              {editing?.mediaType === "VIDEO" ? (
                <div className="col-span-2">
                  <CloudinaryVideoUploadField
                    value={editing}
                    onChange={(patch) => setEditing((prev) => (prev ? { ...prev, ...patch } : prev))}
                  />
                </div>
              ) : (
                <>
                  <div className="col-span-2">
                    <MediaUploadField
                      label="Image"
                      value={editing?.imageUrl}
                      accept="image/*"
                      placeholder="Paste image URL or upload one"
                      onChange={(value) =>
                        setEditing((prev) => (prev ? { ...prev, imageUrl: value } : prev))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <MediaUploadField
                      label="Thumbnail"
                      value={editing?.thumbnailUrl}
                      accept="image/*"
                      placeholder="Paste thumbnail URL or upload one"
                      onChange={(value) =>
                        setEditing((prev) => (prev ? { ...prev, thumbnailUrl: value } : prev))
                      }
                    />
                  </div>
                </>
              )}
              <div className="col-span-2 space-y-2">
                <Label className="font-body">Action Link</Label>
                <Input
                  value={editing?.actionLink || ""}
                  onChange={(event) =>
                    setEditing((prev) => (prev ? { ...prev, actionLink: event.target.value } : prev))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editing?.isActive !== false}
                  onCheckedChange={(value) =>
                    setEditing((prev) => (prev ? { ...prev, isActive: value } : prev))
                  }
                />
                <Label className="font-body text-sm">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media Item</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this media item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminMedia;
