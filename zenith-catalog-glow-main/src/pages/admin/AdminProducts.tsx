import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MediaUploadField from "@/components/admin/MediaUploadField";
import { getErrorMessage } from "@/lib/api-error";
import MediaImage from "@/components/ui/media-image";
import { Link } from "react-router-dom";
import { getOfferStatus, type OfferStatus } from "@/lib/pricing";

const emptyProduct: Partial<Product> = {
  name: "",
  description: "",
  price: 0,
  stockQuantity: 0,
  sectionId: 1,
  imageUrl: "",
  videoUrl: "",
  galleryImages: [],
  is_new_launch: false,
  is_best_seller: false,
  is_featured: false,
  model_number: "",
  offer: false,
  offerPrice: undefined,
  mrp: undefined,
  createdAt: new Date().toISOString(),
  status: "ACTIVE",
};

const offerStatusLabel: Record<OfferStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  expired: "Expired",
  "no-offer": "No Offer",
};

const offerStatusClassName: Record<OfferStatus, string> = {
  active: "bg-accent/20 text-accent",
  upcoming: "bg-secondary text-foreground",
  expired: "bg-muted text-muted-foreground",
  "no-offer": "bg-muted text-muted-foreground",
};

const AdminProducts = () => {
  const { products, sections, addProduct, updateProduct, deleteProduct, isLoading } = useAdminData();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sectionName?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    const firstSectionId = sections[0]?.id ?? 1;
    setEditing({ ...emptyProduct, sectionId: firstSectionId });
    setIsNew(true);
  };

  const openEdit = (product: Product) => {
    setEditing({
      ...product,
      galleryImages: product.galleryImages || [],
    });
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
        await addProduct(editing);
        toast.success("Product added");
      } else if (editing.id) {
        await updateProduct(editing.id, editing);
        toast.success("Product updated");
      }
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save product"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;

    try {
      await deleteProduct(deleteId);
      toast.success("Product deleted");
      setDeleteId(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete product"));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Products</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">{products.length} products</p>
          </div>
          <div className="flex gap-3">
            <Input placeholder="Search..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-48" />
            <Button asChild variant="outline">
              <Link to="/admin/offers">Manage Offers</Link>
            </Button>
            <Button onClick={openNew} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Image</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Name</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Category</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Price</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Offer</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Stock</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Badges</th>
                  <th className="p-4 text-xs text-muted-foreground uppercase font-body">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <MediaImage src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-md object-contain bg-secondary/30" />
                    </td>
                    <td className="p-4">
                      <p className="font-medium font-body text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.model_number}</p>
                    </td>
                    <td className="p-4 text-sm font-body">{product.sectionName}</td>
                    <td className="p-4 text-sm font-bold font-body">Rs. {product.price.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${offerStatusClassName[getOfferStatus(product)]}`}>
                        {offerStatusLabel[getOfferStatus(product)]}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-body">{product.stockQuantity}</td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {product.is_new_launch && <span className="px-2 py-0.5 text-[10px] bg-accent/20 text-accent rounded-full">New</span>}
                        {product.is_best_seller && <span className="px-2 py-0.5 text-[10px] bg-rose/20 text-rose-foreground rounded-full">Best</span>}
                        {product.is_featured && <span className="px-2 py-0.5 text-[10px] bg-secondary text-foreground rounded-full">Featured</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(product.id)} className="text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && !isLoading && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground font-body">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{isNew ? "Add Product" : "Edit Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="font-body">Name</Label>
                <Input value={editing?.name || ""} onChange={(event) => setEditing((prev) => prev ? { ...prev, name: event.target.value } : prev)} />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Model Number</Label>
                <Input value={editing?.model_number || ""} onChange={(event) => setEditing((prev) => prev ? { ...prev, model_number: event.target.value } : prev)} />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Category</Label>
                <Select value={String(editing?.sectionId || sections[0]?.id || 1)} onValueChange={(value) => setEditing((prev) => prev ? { ...prev, sectionId: parseInt(value, 10) } : prev)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={String(section.id)}>{section.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Price</Label>
                <Input type="number" value={editing?.price || 0} onChange={(event) => setEditing((prev) => prev ? { ...prev, price: parseFloat(event.target.value) || 0 } : prev)} />
              </div>
              <div className="space-y-2">
                <Label className="font-body">MRP</Label>
                <Input type="number" value={editing?.mrp || ""} onChange={(event) => setEditing((prev) => prev ? { ...prev, mrp: parseFloat(event.target.value) || undefined } : prev)} />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Stock</Label>
                <Input type="number" value={editing?.stockQuantity || 0} onChange={(event) => setEditing((prev) => prev ? { ...prev, stockQuantity: parseInt(event.target.value, 10) || 0 } : prev)} />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Display Order</Label>
                <Input type="number" value={editing?.display_order || 0} onChange={(event) => setEditing((prev) => prev ? { ...prev, display_order: parseInt(event.target.value, 10) || 0 } : prev)} />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Status</Label>
                <Select value={editing?.status || "ACTIVE"} onValueChange={(value) => setEditing((prev) => prev ? { ...prev, status: value } : prev)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="font-body">Offers</Label>
                <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground font-body">
                  Scheduled offers are managed from the Offers page.
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <MediaUploadField
                  label="Primary Image"
                  value={editing?.imageUrl}
                  accept="image/*"
                  placeholder="Paste image URL or upload one"
                  onChange={(value) => setEditing((prev) => prev ? { ...prev, imageUrl: value } : prev)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <MediaUploadField
                  label="Product Video"
                  value={editing?.videoUrl}
                  accept="video/*"
                  placeholder="Paste video URL or upload one"
                  onChange={(value) => setEditing((prev) => prev ? { ...prev, videoUrl: value } : prev)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="font-body">Gallery Images</Label>
                <Textarea
                  rows={4}
                  value={(editing?.galleryImages || []).join("\n")}
                  onChange={(event) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            galleryImages: event.target.value
                              .split("\n")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          }
                        : prev
                    )
                  }
                  placeholder="One image URL per line"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="font-body">Description</Label>
                <Textarea value={editing?.description || ""} onChange={(event) => setEditing((prev) => prev ? { ...prev, description: event.target.value } : prev)} rows={4} />
              </div>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch checked={!!editing?.is_new_launch} onCheckedChange={(value) => setEditing((prev) => prev ? { ...prev, is_new_launch: value } : prev)} />
                <Label className="font-body text-sm">New Launch</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!editing?.is_best_seller} onCheckedChange={(value) => setEditing((prev) => prev ? { ...prev, is_best_seller: value } : prev)} />
                <Label className="font-body text-sm">Bestseller</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!editing?.is_featured} onCheckedChange={(value) => setEditing((prev) => prev ? { ...prev, is_featured: value } : prev)} />
                <Label className="font-body text-sm">Featured</Label>
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
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this product.</AlertDialogDescription>
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

export default AdminProducts;
