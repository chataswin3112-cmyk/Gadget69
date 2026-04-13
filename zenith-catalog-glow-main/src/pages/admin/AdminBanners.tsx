import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Banner } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import MediaUploadField from "@/components/admin/MediaUploadField";
import { getErrorMessage } from "@/lib/api-error";
import MediaImage from "@/components/ui/media-image";

const emptyBanner: Partial<Banner> = {
  title: "",
  desktopImageUrl: "",
  mobileImageUrl: "",
  ctaText: "",
  ctaLink: "",
  displayOrder: 0,
  isActive: true,
};

const AdminBanners = () => {
  const { banners, addBanner, updateBanner, deleteBanner } = useAdminData();
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = [...banners].sort((a, b) => a.displayOrder - b.displayOrder);

  const openNew = () => {
    setEditing({ ...emptyBanner, displayOrder: banners.length });
    setIsNew(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing({ ...banner });
    setIsNew(false);
  };

  const save = async () => {
    if (!editing?.desktopImageUrl) {
      toast.error("Banner image is required");
      return;
    }

    try {
      setSaving(true);
      if (isNew) {
        await addBanner(editing);
        toast.success("Banner added");
      } else if (editing.id) {
        await updateBanner(editing.id, editing);
        toast.success("Banner updated");
      }
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save banner"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;

    try {
      await deleteBanner(deleteId);
      toast.success("Banner deleted");
      setDeleteId(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete banner"));
    }
  };

  const moveOrder = async (id: number, direction: -1 | 1) => {
    const index = sorted.findIndex((banner) => banner.id === id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    try {
      await updateBanner(sorted[index].id, { displayOrder: sorted[swapIndex].displayOrder });
      await updateBanner(sorted[swapIndex].id, { displayOrder: sorted[index].displayOrder });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reorder banners"));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Banners</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">Hero slider banners</p>
          </div>
          <Button onClick={openNew} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" /> Add Banner
          </Button>
        </div>

        <div className="grid gap-4">
          {sorted.map((banner, index) => (
            <div key={banner.id} className="bg-card rounded-xl shadow-premium overflow-hidden flex">
              <MediaImage src={banner.desktopImageUrl} alt={banner.title || "Banner"} className="w-48 h-28 object-cover" />
              <div className="flex-1 p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium font-body">{banner.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {banner.ctaText && `CTA: ${banner.ctaText}`} - Order: {banner.displayOrder}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={banner.isActive} onCheckedChange={(value) => updateBanner(banner.id, { isActive: value })} />
                  <Button variant="ghost" size="sm" onClick={() => moveOrder(banner.id, -1)} disabled={index === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => moveOrder(banner.id, 1)} disabled={index === sorted.length - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(banner)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(banner.id)} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{isNew ? "Add Banner" : "Edit Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-body">Title</Label>
              <Input value={editing?.title || ""} onChange={(event) => setEditing((prev) => prev ? { ...prev, title: event.target.value } : prev)} />
            </div>
            <MediaUploadField
              label="Desktop Banner"
              value={editing?.desktopImageUrl}
              accept="image/*"
              placeholder="Paste image URL or upload one"
              onChange={(value) => setEditing((prev) => prev ? { ...prev, desktopImageUrl: value } : prev)}
            />
            <MediaUploadField
              label="Mobile Banner"
              value={editing?.mobileImageUrl}
              accept="image/*"
              placeholder="Optional mobile image"
              onChange={(value) => setEditing((prev) => prev ? { ...prev, mobileImageUrl: value } : prev)}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body">CTA Text</Label>
                <Input value={editing?.ctaText || ""} onChange={(event) => setEditing((prev) => prev ? { ...prev, ctaText: event.target.value } : prev)} />
              </div>
              <div className="space-y-2">
                <Label className="font-body">CTA Link</Label>
                <Input value={editing?.ctaLink || ""} onChange={(event) => setEditing((prev) => prev ? { ...prev, ctaLink: event.target.value } : prev)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body">Display Order</Label>
                <Input type="number" value={editing?.displayOrder || 0} onChange={(event) => setEditing((prev) => prev ? { ...prev, displayOrder: parseInt(event.target.value, 10) || 0 } : prev)} />
              </div>
              <div className="flex items-end gap-2">
                <Switch checked={editing?.isActive !== false} onCheckedChange={(value) => setEditing((prev) => prev ? { ...prev, isActive: value } : prev)} />
                <Label className="font-body text-sm">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this banner.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminBanners;
