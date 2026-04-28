import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Section } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MediaUploadField from "@/components/admin/MediaUploadField";
import { getErrorMessage } from "@/lib/api-error";
import MediaImage from "@/components/ui/media-image";
import { getChildSections, getTopLevelSections, isSubcategory } from "@/lib/category";
import { uploadCatalogMediaFile } from "@/api/productApi";

const emptySection: Partial<Section> = {
  name: "",
  description: "",
  imageUrl: "",
  is_active: true,
  show_in_explore: true,
  show_in_top_category: false,
  sort_order: 0,
  parentSectionId: null,
};

const uploadCategoryImage = async (file: File) => {
  const uploaded = await uploadCatalogMediaFile(file, "CATEGORY");
  return uploaded.secureUrl;
};

const AdminCategories = () => {
  const { sections, addSection, updateSection, deleteSection, ensureSectionsLoaded } = useAdminData();
  const [editing, setEditing] = useState<Partial<Section> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [subcategoryPanelParentId, setSubcategoryPanelParentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void ensureSectionsLoaded();
  }, [ensureSectionsLoaded]);

  const topLevelSections = useMemo(() => getTopLevelSections(sections), [sections]);
  const categoryRows = topLevelSections;
  const childCountByParent = useMemo(() => {
    const counts = new Map<number, number>();
    sections.forEach((section) => {
      if (section.parentSectionId !== null && section.parentSectionId !== undefined) {
        counts.set(section.parentSectionId, (counts.get(section.parentSectionId) || 0) + 1);
      }
    });
    return counts;
  }, [sections]);
  const subcategoryPanelParent = useMemo(
    () =>
      subcategoryPanelParentId
        ? topLevelSections.find((section) => section.id === subcategoryPanelParentId) || null
        : null,
    [subcategoryPanelParentId, topLevelSections]
  );
  const subcategoryPanelChildren = useMemo(
    () =>
      subcategoryPanelParent
        ? getChildSections(sections, subcategoryPanelParent.id)
        : [],
    [sections, subcategoryPanelParent]
  );
  const editingParentName = editing?.parentSectionId
    ? topLevelSections.find((section) => section.id === editing.parentSectionId)?.name
    : null;
  const dialogTitle = isNew
    ? editingParentName
      ? `Add Subcategory under ${editingParentName}`
      : "Add Main Category"
    : isSubcategory(editing)
      ? "Edit Subcategory"
      : "Edit Main Category";

  const openNew = (parentSectionId: number | null = null) => {
    if (parentSectionId !== null) {
      setSubcategoryPanelParentId(null);
      window.setTimeout(() => {
        setEditing({ ...emptySection, parentSectionId });
        setIsNew(true);
      }, 0);
      return;
    }
    setEditing({ ...emptySection, parentSectionId });
    setIsNew(true);
  };

  const openEdit = (section: Section) => {
    if (subcategoryPanelParentId !== null) {
      setSubcategoryPanelParentId(null);
      window.setTimeout(() => {
        setEditing({ ...section });
        setIsNew(false);
      }, 0);
      return;
    }
    setEditing({ ...section });
    setIsNew(false);
  };

  const openSubcategories = (section: Section) => {
    setSubcategoryPanelParentId(section.id);
  };

  const save = async () => {
    if (!editing?.name) {
      toast.error("Name is required");
      return;
    }

    try {
      setSaving(true);
      const parentSectionId = editing.parentSectionId ?? null;

      if (isNew) {
        await addSection(editing);
        toast.success(editing.parentSectionId ? "Subcategory added" : "Category added");
      } else if (editing.id) {
        await updateSection(editing.id, editing);
        toast.success(editing.parentSectionId ? "Subcategory updated" : "Category updated");
      }
      setEditing(null);
      if (parentSectionId !== null) {
        setSubcategoryPanelParentId(parentSectionId);
      }
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

  const updateExistingSection = (section: Section, patch: Partial<Section>) =>
    updateSection(section.id, { ...section, ...patch });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="admin-page-header">
          <div>
            <h1 className="font-heading text-2xl font-bold">Categories</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">
              {topLevelSections.length} categories, {sections.length - topLevelSections.length} subcategories
            </p>
          </div>
          <Button onClick={() => openNew()} className="admin-action-button bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" /> Add Main Category
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-premium overflow-hidden">
          <div className="admin-table-scroll">
            <table className="min-w-[980px] w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Image</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Name</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Parent</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Active</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Explore</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Top</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categoryRows.map((section) => {
                  const childCount = childCountByParent.get(section.id) || 0;
                  const childCountLabel = `${childCount} ${childCount === 1 ? "subcategory" : "subcategories"}`;
                  return (
                    <tr key={section.id} className="hover:bg-muted/30">
                      <td className="p-4">
                        <MediaImage src={section.imageUrl} alt={section.name} className="w-10 h-10 rounded-md object-cover bg-secondary/30" />
                      </td>
                      <td className="p-4 font-medium font-body text-sm">
                        <div className="flex items-center gap-2">
                          <span>{section.name}</span>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                            Category
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground font-body">
                        {childCountLabel}
                      </td>
                      <td className="p-4">
                        <Switch checked={section.is_active !== false} onCheckedChange={(value) => updateExistingSection(section, { is_active: value })} />
                      </td>
                      <td className="p-4">
                        <Switch checked={section.show_in_explore !== false} onCheckedChange={(value) => updateExistingSection(section, { show_in_explore: value })} />
                      </td>
                      <td className="p-4">
                        <Switch checked={!!section.show_in_top_category} onCheckedChange={(value) => updateExistingSection(section, { show_in_top_category: value })} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSubcategories(section)}
                            aria-label={`View subcategories for ${section.name}, ${childCountLabel}`}
                            title={`View subcategories for ${section.name}`}
                            className="h-8 min-w-14 gap-1.5 px-2.5 tabular-nums"
                          >
                            <FolderTree className="h-3.5 w-3.5" />
                            {childCount}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(section)} className="h-8 w-8 px-0">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(section.id)} className="h-8 w-8 px-0 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(subcategoryPanelParent)} onOpenChange={(open) => !open && setSubcategoryPanelParentId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {subcategoryPanelParent ? `Subcategories - ${subcategoryPanelParent.name}` : "Subcategories"}
            </DialogTitle>
          </DialogHeader>
          {subcategoryPanelParent ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs uppercase text-muted-foreground font-body">Main Category</p>
                <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">{subcategoryPanelParent.name}</h2>
                    <p className="text-sm text-muted-foreground font-body">
                      {subcategoryPanelChildren.length} subcategories
                    </p>
                  </div>
                  <Button
                    onClick={() => openNew(subcategoryPanelParent.id)}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subcategory
                  </Button>
                </div>
              </div>

              {subcategoryPanelChildren.length ? (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {subcategoryPanelChildren.map((child) => (
                    <div key={child.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <MediaImage
                          src={child.imageUrl}
                          alt={child.name}
                          className="h-10 w-10 rounded-md bg-secondary/30 object-cover"
                        />
                        <div>
                          <p className="font-body text-sm font-medium">{child.name}</p>
                          <p className="text-xs text-muted-foreground font-body">Subcategory</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(child)}>
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(child.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <p className="font-body text-sm text-muted-foreground">
                    No subcategories yet. Add one before creating new products under this category.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-body">Name</Label>
              <Input value={editing?.name || ""} onChange={(event) => setEditing((prev) => prev ? { ...prev, name: event.target.value } : prev)} />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Parent Category</Label>
              <select
                value={editing?.parentSectionId ? String(editing.parentSectionId) : "none"}
                disabled={Boolean(editing?.id && childCountByParent.get(editing.id))}
                onChange={(event) =>
                  setEditing((prev) =>
                    prev
                      ? {
                          ...prev,
                          parentSectionId:
                            event.target.value === "none" ? null : Number.parseInt(event.target.value, 10),
                        }
                      : prev
                  )
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="none">Main category</option>
                {topLevelSections
                  .filter((section) => section.id !== editing?.id)
                  .map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
              </select>
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
              uploadFile={uploadCategoryImage}
              onChange={(value) => setEditing((prev) => prev ? { ...prev, imageUrl: value } : prev)}
            />
            <div className="space-y-2">
              <Label className="font-body">Sort Order</Label>
              <Input type="number" value={editing?.sort_order || 0} onChange={(event) => setEditing((prev) => prev ? { ...prev, sort_order: parseInt(event.target.value, 10) || 0 } : prev)} />
            </div>
            <div className="admin-inline-switches">
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
