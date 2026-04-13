import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Section } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MediaUploadField from "@/components/admin/MediaUploadField";
import { getErrorMessage } from "@/lib/api-error";
import MediaImage from "@/components/ui/media-image";

const emptySection: Partial<Section> = {
  name: "",
  description: "",
  imageUrl: "",
  is_active: true,
  show_in_explore: true,
  show_in_top_category: false,
  sort_order: 0,
};

const AdminCategories = () => {
  const { sections, addSection, updateSection, deleteSection } = useAdminData();
  const [editing, setEditing] = useState<Partial<Section> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing({ ...emptySection });
    setIsNew(true);
  };

  const openEdit = (section: Section) => {
    setEditing({ ...section });
    setIsNew(false);
  };

  const save = async () => {
    if (!editing?.name) {
      toast.error("Name is required");
      return;
    }

    try {
      setSaving(true);
      if (isNew) {
        await addSection(editing);
        toast.success("Category added");
      } else if (editing.id) {
        await updateSection(editing.id, editing);
        toast.success("Category updated");
      }
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save category"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;

    try {
      await deleteSection(deleteId);
      toast.success("Category deleted");
      setDeleteId(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete category"));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Categories</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">{sections.length} categories</p>
          </div>
          <Button onClick={openNew} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" /> Add Category
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Image</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Name</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Active</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Explore</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Top</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sections.map((section) => (
                  <tr key={section.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <MediaImage src={section.imageUrl} alt={section.name} className="w-10 h-10 rounded-md object-cover bg-secondary/30" />
                    </td>
                    <td className="p-4 font-medium font-body text-sm">{section.name}</td>
                    <td className="p-4">
                      <Switch checked={section.is_active !== false} onCheckedChange={(value) => updateSection(section.id, { is_active: value })} />
                    </td>
                    <td className="p-4">
                      <Switch checked={section.show_in_explore !== false} onCheckedChange={(value) => updateSection(section.id, { show_in_explore: value })} />
                    </td>
                    <td className="p-4">
                      <Switch checked={!!section.show_in_top_category} onCheckedChange={(value) => updateSection(section.id, { show_in_top_category: value })} />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(section)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(section.id)} className="text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{isNew ? "Add Category" : "Edit Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-body">Name</Label>
              <Input value={editing?.name || ""} onChange={(event) => setEditing((prev) => prev ? { ...prev, name: event.target.value } : prev)} />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Description</Label>
              <Input value={editing?.description || ""} onChange={(event) => setEditing((prev) => prev ? { ...prev, description: event.target.value } : prev)} />
            </div>
            <MediaUploadField
              label="Category Image"
              value={editing?.imageUrl}
              accept="image/*"
              placeholder="Paste image URL or upload one"
              onChange={(value) => setEditing((prev) => prev ? { ...prev, imageUrl: value } : prev)}
            />
            <div className="space-y-2">
              <Label className="font-body">Sort Order</Label>
              <Input type="number" value={editing?.sort_order || 0} onChange={(event) => setEditing((prev) => prev ? { ...prev, sort_order: parseInt(event.target.value, 10) || 0 } : prev)} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={editing?.is_active !== false} onCheckedChange={(value) => setEditing((prev) => prev ? { ...prev, is_active: value } : prev)} />
                <Label className="font-body text-sm">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing?.show_in_explore !== false} onCheckedChange={(value) => setEditing((prev) => prev ? { ...prev, show_in_explore: value } : prev)} />
                <Label className="font-body text-sm">Explore</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!editing?.show_in_top_category} onCheckedChange={(value) => setEditing((prev) => prev ? { ...prev, show_in_top_category: value } : prev)} />
                <Label className="font-body text-sm">Top</Label>
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
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the category.</AlertDialogDescription>
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

export default AdminCategories;
