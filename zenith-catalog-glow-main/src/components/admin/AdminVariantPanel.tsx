import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Image,
  Loader2,
  Plus,
  Star,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MediaImage from "@/components/ui/media-image";
import {
  addVariantMedia,
  createVariant,
  deleteVariant,
  deleteVariantMedia,
  getProductVariants,
  setVariantMediaPrimary,
  updateVariant,
  uploadCatalogMediaFile,
} from "@/api/productApi";
import { ProductVariant, VariantMedia } from "@/types";

interface AdminVariantPanelProps {
  productId: number;
}

type VariantForm = {
  colorName: string;
  hexCode: string;
  size: string;
  price: string;
  stock: string;
  sku: string;
  isDefault: boolean;
};

const emptyForm = (): VariantForm => ({
  colorName: "",
  hexCode: "#000000",
  size: "",
  price: "",
  stock: "0",
  sku: "",
  isDefault: false,
});

const mediaRoles: VariantMedia["mediaRole"][] = ["MAIN", "SIDE", "BACK", "ADDITIONAL"];

const AdminVariantPanel = ({ productId }: AdminVariantPanelProps) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<VariantForm>(emptyForm());
  const [savingVariant, setSavingVariant] = useState(false);
  const [uploadingToId, setUploadingToId] = useState<number | null>(null);
  const [addingToId, setAddingToId] = useState<number | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<VariantMedia["mediaType"]>("IMAGE");
  const [mediaRole, setMediaRole] = useState<VariantMedia["mediaRole"]>("ADDITIONAL");

  const loadVariants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProductVariants(productId);
      setVariants(data);
      setExpandedId((current) => current ?? data[0]?.id ?? null);
    } catch {
      toast.error("Failed to load variants");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadVariants();
  }, [loadVariants]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const handleSaveVariant = async () => {
    if (!form.colorName.trim()) {
      toast.error("Color name is required");
      return;
    }

    setSavingVariant(true);
    try {
      const payload = {
        colorName: form.colorName.trim(),
        hexCode: form.hexCode || "#000000",
        size: form.size.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        priceAdjustment: 0,
        stock: Number(form.stock) || 0,
        sku: form.sku.trim() || undefined,
        isDefault: form.isDefault,
        displayOrder: editingId
          ? variants.find((variant) => variant.id === editingId)?.displayOrder || 0
          : variants.length,
      };

      if (editingId) {
        await updateVariant(editingId, payload);
        toast.success("Variant updated");
      } else {
        await createVariant(productId, payload);
        toast.success("Variant added");
      }

      await loadVariants();
      resetForm();
    } catch {
      toast.error("Failed to save variant");
    } finally {
      setSavingVariant(false);
    }
  };

  const startEdit = (variant: ProductVariant) => {
    setEditingId(variant.id);
    setForm({
      colorName: variant.colorName,
      hexCode: variant.hexCode || "#000000",
      size: variant.size || "",
      price: variant.price?.toString() || "",
      stock: String(variant.stock || 0),
      sku: variant.sku || "",
      isDefault: variant.isDefault,
    });
    setShowForm(true);
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!window.confirm("Delete this variant and all of its media?")) {
      return;
    }

    try {
      await deleteVariant(variantId);
      toast.success("Variant deleted");
      await loadVariants();
    } catch {
      toast.error("Failed to delete variant");
    }
  };

  const handleFileUpload = async (variantId: number, files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setUploadingToId(variantId);
    try {
      let nextDisplayOrder = variants.find((variant) => variant.id === variantId)?.media.length || 0;
      for (const file of Array.from(files)) {
        const uploaded = await uploadCatalogMediaFile(file, "VARIANT");
        await addVariantMedia(variantId, {
          mediaUrl: uploaded.secureUrl,
          mediaType: uploaded.mediaType,
          mediaRole: uploaded.mediaType === "VIDEO" ? "ADDITIONAL" : mediaRole,
          displayOrder: nextDisplayOrder++,
          isPrimary: false,
        });
      }
      toast.success("Variant media uploaded");
      await loadVariants();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploadingToId(null);
    }
  };

  const handleAddMediaByUrl = async (variantId: number) => {
    if (!mediaUrl.trim()) {
      toast.error("Enter a media URL first");
      return;
    }

    setAddingToId(variantId);
    try {
      await addVariantMedia(variantId, {
        mediaUrl: mediaUrl.trim(),
        mediaType,
        mediaRole: mediaType === "VIDEO" ? "ADDITIONAL" : mediaRole,
        displayOrder: variants.find((variant) => variant.id === variantId)?.media.length || 0,
        isPrimary: false,
      });
      toast.success("Variant media added");
      setMediaUrl("");
      await loadVariants();
    } catch {
      toast.error("Failed to add variant media");
    } finally {
      setAddingToId(null);
    }
  };

  const handleSetPrimary = async (mediaId: number) => {
    try {
      await setVariantMediaPrimary(mediaId);
      toast.success("Primary image updated");
      await loadVariants();
    } catch {
      toast.error("Failed to update primary image");
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    try {
      await deleteVariantMedia(mediaId);
      toast.success("Variant media removed");
      await loadVariants();
    } catch {
      toast.error("Failed to delete media");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold">Variants</h3>
          <p className="text-sm text-muted-foreground font-body">
            Add colors, pricing, stock, and media for each variant.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowForm((current) => !current);
            setEditingId(null);
            setForm(emptyForm());
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Variant
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-body">Color Name</Label>
              <Input
                value={form.colorName}
                onChange={(event) => setForm((current) => ({ ...current, colorName: event.target.value }))}
                placeholder="Red"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Hex Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.hexCode}
                  onChange={(event) => setForm((current) => ({ ...current, hexCode: event.target.value }))}
                  className="h-10 w-14 rounded-md border border-input bg-background"
                />
                <Input
                  value={form.hexCode}
                  onChange={(event) => setForm((current) => ({ ...current, hexCode: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-body">Variant Price</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                placeholder="Leave blank to use base price"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Stock</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">SKU</Label>
              <Input
                value={form.sku}
                onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Size</Label>
              <Input
                value={form.size}
                onChange={(event) => setForm((current) => ({ ...current, size: event.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-body">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.checked }))}
            />
            Set as default variant
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={handleSaveVariant} disabled={savingVariant} className="w-full sm:w-auto">
              {savingVariant ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId ? "Update Variant" : "Save Variant"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm} className="w-full sm:w-auto">
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : variants.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/40 p-6 text-sm text-muted-foreground">
          No variants yet. Add the first color option above.
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant) => (
            <div key={variant.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div
                  className="h-10 w-10 rounded-full border border-border"
                  style={{ backgroundColor: variant.hexCode || "#000000" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium font-body">{variant.colorName}</p>
                    {variant.size ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {variant.size}
                      </span>
                    ) : null}
                    {variant.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                        <Star className="h-3 w-3 fill-current" />
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground font-body">
                    {variant.price ? `Rs. ${Number(variant.price).toLocaleString()}` : "Uses base price"}
                    {"  "}
                    Stock: {variant.stock}
                    {variant.sku ? `  SKU: ${variant.sku}` : ""}
                  </p>
                </div>
                <div className="admin-actions-row sm:justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(variant)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => void handleDeleteVariant(variant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedId((current) => (current === variant.id ? null : variant.id))}
                  >
                    {expandedId === variant.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {expandedId === variant.id ? (
                <div className="space-y-4 border-t border-border bg-muted/20 p-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {variant.media.map((media) => (
                      <div key={media.id} className="rounded-2xl border border-border bg-card p-3">
                        <div className="mb-3 overflow-hidden rounded-xl border border-border bg-secondary/20">
                          {media.mediaType === "VIDEO" ? (
                            <div className="flex aspect-video items-center justify-center gap-2 bg-black/90 text-white">
                              <Video className="h-5 w-5" />
                              <span className="text-xs font-medium">Video</span>
                            </div>
                          ) : (
                            <MediaImage
                              src={media.mediaUrl}
                              alt={`${variant.colorName} media`}
                              className="aspect-video w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{media.mediaRole}</p>
                            <p className="text-xs text-muted-foreground">{media.mediaType}</p>
                          </div>
                          <div className="admin-actions-row">
                            {media.mediaType === "IMAGE" ? (
                              <Button
                                type="button"
                                variant={media.isPrimary ? "default" : "outline"}
                                size="sm"
                                onClick={() => void handleSetPrimary(media.id)}
                              >
                                {media.isPrimary ? "Primary" : "Make Primary"}
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => void handleDeleteMedia(media.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-dashed border-border bg-card/50 p-4">
                    <div className="grid gap-4 md:grid-cols-[1fr_160px_160px_auto]">
                      <div className="space-y-2">
                        <Label className="font-body text-xs text-muted-foreground">Add media by URL</Label>
                        <Input
                          value={mediaUrl}
                          onChange={(event) => setMediaUrl(event.target.value)}
                          placeholder="https://... or Cloudinary video URL"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-body text-xs text-muted-foreground">Type</Label>
                        <select
                          value={mediaType}
                          onChange={(event) => setMediaType(event.target.value as VariantMedia["mediaType"])}
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="IMAGE">IMAGE</option>
                          <option value="VIDEO">VIDEO</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-body text-xs text-muted-foreground">Role</Label>
                        <select
                          value={mediaRole}
                          onChange={(event) => setMediaRole(event.target.value as VariantMedia["mediaRole"])}
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
                        <Button type="button" variant="outline" onClick={() => void handleAddMediaByUrl(variant.id)} disabled={addingToId === variant.id}>
                          {addingToId === variant.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Add URL
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-body hover:bg-secondary/40">
                        {uploadingToId === variant.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Upload images or videos
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.mp4,.mov,.webm"
                          multiple
                          className="hidden"
                          onChange={(event) => {
                            void handleFileUpload(variant.id, event.target.files);
                            event.target.value = "";
                          }}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Images and videos upload to Cloudinary when configured, otherwise secure local storage.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVariantPanel;
