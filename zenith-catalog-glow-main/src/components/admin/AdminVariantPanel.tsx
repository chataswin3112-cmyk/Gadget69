/**
 * AdminVariantPanel — Manages product variants and their media.
 * Embedded inside the Admin product editor drawer.
 * Supports: Add/Edit/Delete variants, Add/Delete images+videos per variant.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Star,
  Upload,
  Video,
  Image,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ProductVariant, VariantMedia } from "@/types";
import {
  getProductVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  addVariantMedia,
  deleteVariantMedia,
  setVariantMediaPrimary,
  uploadFile,
} from "@/api/productApi";

interface AdminVariantPanelProps {
  productId: number;
}

interface VariantForm {
  colorName: string;
  hexCode: string;
  size: string;
  price: string;
  stock: string;
  sku: string;
  isDefault: boolean;
}

type VariantMutationPayload = Pick<
  ProductVariant,
  | "colorName"
  | "hexCode"
  | "size"
  | "price"
  | "priceAdjustment"
  | "stock"
  | "sku"
  | "isDefault"
  | "displayOrder"
>;

const emptyForm = (): VariantForm => ({
  colorName: "",
  hexCode: "#000000",
  size: "",
  price: "",
  stock: "0",
  sku: "",
  isDefault: false,
});

const AdminVariantPanel = ({ productId }: AdminVariantPanelProps) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<VariantForm>(emptyForm());
  const [savingVariant, setSavingVariant] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [uploadingMedia, setUploadingMedia] = useState<number | null>(null);
  const [addingMediaToId, setAddingMediaToId] = useState<number | null>(null);

  const loadVariants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProductVariants(productId);
      setVariants(data);
    } catch {
      toast({ title: "Failed to load variants", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadVariants();
  }, [loadVariants]);

  const handleSaveVariant = async () => {
    if (!form.colorName.trim()) {
      toast({ title: "Color name is required", variant: "destructive" });
      return;
    }
    setSavingVariant(true);
    try {
      const payload: VariantMutationPayload = {
        colorName: form.colorName.trim(),
        hexCode: form.hexCode || "#000000",
        size: form.size.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        priceAdjustment: 0,
        stock: Number(form.stock) || 0,
        sku: form.sku.trim() || undefined,
        isDefault: form.isDefault,
        displayOrder: 0,
      };

      if (editingId) {
        await updateVariant(editingId, payload);
        toast({ title: "Variant updated" });
      } else {
        await createVariant(productId, payload);
        toast({ title: "Variant added" });
      }
      await loadVariants();
      setShowAddForm(false);
      setEditingId(null);
      setForm(emptyForm());
    } catch {
      toast({ title: "Failed to save variant", variant: "destructive" });
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
      stock: variant.stock.toString(),
      sku: variant.sku || "",
      isDefault: variant.isDefault,
    });
    setShowAddForm(true);
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!window.confirm("Delete this variant and all its media?")) return;
    setDeletingId(variantId);
    try {
      await deleteVariant(variantId);
      toast({ title: "Variant deleted" });
      await loadVariants();
    } catch {
      toast({ title: "Failed to delete variant", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileUpload = async (variantId: number, file: File) => {
    setUploadingMedia(variantId);
    try {
      const url = await uploadFile(file);
      const type = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";
      await addVariantMedia(variantId, {
        mediaUrl: url,
        mediaType: type,
        displayOrder: 0,
        isPrimary: false,
      });
      toast({ title: `${type === "VIDEO" ? "Video" : "Image"} added` });
      await loadVariants();
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingMedia(null);
    }
  };

  const handleAddMediaByUrl = async (variantId: number) => {
    if (!mediaUrl.trim()) {
      toast({ title: "Media URL is required", variant: "destructive" });
      return;
    }
    setAddingMediaToId(variantId);
    try {
      await addVariantMedia(variantId, {
        mediaUrl: mediaUrl.trim(),
        mediaType: mediaType,
        displayOrder: 0,
        isPrimary: false,
      });
      toast({ title: "Media added" });
      setMediaUrl("");
      await loadVariants();
    } catch {
      toast({ title: "Failed to add media", variant: "destructive" });
    } finally {
      setAddingMediaToId(null);
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    try {
      await deleteVariantMedia(mediaId);
      toast({ title: "Media removed" });
      await loadVariants();
    } catch {
      toast({ title: "Failed to delete media", variant: "destructive" });
    }
  };

  const handleSetPrimary = async (mediaId: number) => {
    try {
      await setVariantMediaPrimary(mediaId);
      toast({ title: "Primary image set" });
      await loadVariants();
    } catch {
      toast({ title: "Failed to set primary", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Product Variants
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
            setForm(emptyForm());
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Variant
        </Button>
      </div>

      {/* Add / Edit form */}
      {showAddForm && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-4">
          <h4 className="text-sm font-semibold">
            {editingId ? "Edit Variant" : "New Variant"}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label className="text-xs">Color Name *</Label>
              <Input
                value={form.colorName}
                onChange={(e) => setForm((f) => ({ ...f, colorName: e.target.value }))}
                placeholder="e.g. Midnight Black"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Hex Color</Label>
              <div className="flex gap-2 mt-1 items-center">
                <input
                  type="color"
                  value={form.hexCode}
                  onChange={(e) => setForm((f) => ({ ...f, hexCode: e.target.value }))}
                  className="h-9 w-12 rounded cursor-pointer border border-input"
                />
                <Input
                  value={form.hexCode}
                  onChange={(e) => setForm((f) => ({ ...f, hexCode: e.target.value }))}
                  placeholder="#000000"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Size (optional)</Label>
              <Input
                value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                placeholder="S / M / L / 42"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Price (₹)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="Leave blank to use product price"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Stock</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">SKU</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="Optional"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="variant-is-default"
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="h-4 w-4 rounded accent-[hsl(var(--accent))]"
            />
            <label htmlFor="variant-is-default" className="text-sm cursor-pointer">
              Set as default variant
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => void handleSaveVariant()}
              disabled={savingVariant}
              className="flex items-center gap-1.5"
            >
              {savingVariant ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              {editingId ? "Update" : "Save Variant"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Variant list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : variants.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No variants yet — add the first variant above.
        </p>
      ) : (
        <div className="space-y-3">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Variant header row */}
              <div className="flex items-center gap-3 p-3">
                {/* Color swatch */}
                <div
                  className="h-8 w-8 rounded-full border border-border flex-shrink-0"
                  style={{ backgroundColor: variant.hexCode || "#ccc" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{variant.colorName}</span>
                    {variant.size && (
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                        {variant.size}
                      </span>
                    )}
                    {variant.isDefault && (
                      <span className="text-xs text-accent flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-accent" /> Default
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        variant.stock > 0
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {variant.price
                      ? `₹${Number(variant.price).toLocaleString()}`
                      : "Uses base price"}
                    {variant.sku && ` · ${variant.sku}`}
                    {` · ${variant.media?.length || 0} media`}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(variant)}
                    className="h-7 px-2 text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void handleDeleteVariant(variant.id)}
                    disabled={deletingId === variant.id}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                  >
                    {deletingId === variant.id ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === variant.id ? null : variant.id)
                    }
                    className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expandedId === variant.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Media section — expanded */}
              {expandedId === variant.id && (
                <div className="border-t border-border p-3 bg-muted/20 space-y-3">
                  {/* Existing media grid */}
                  {variant.media && variant.media.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {variant.media.map((item: VariantMedia) => (
                        <div
                          key={item.id}
                          className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border bg-card flex-shrink-0"
                        >
                          {item.mediaType === "VIDEO" ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-muted gap-1">
                              <Video className="h-6 w-6 text-muted-foreground" />
                              <span className="text-[9px] text-muted-foreground">VIDEO</span>
                            </div>
                          ) : (
                            <img
                              src={item.mediaUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}

                          {item.isPrimary && (
                            <div className="absolute top-1 left-1 bg-accent rounded-full p-0.5">
                              <Star className="h-2 w-2 text-accent-foreground fill-accent-foreground" />
                            </div>
                          )}

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                            {!item.isPrimary && item.mediaType === "IMAGE" && (
                              <button
                                onClick={() => void handleSetPrimary(item.id)}
                                className="text-[9px] text-white font-medium bg-accent/80 px-1.5 py-0.5 rounded"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              onClick={() => void handleDeleteMedia(item.id)}
                              className="text-[9px] text-white font-medium bg-destructive/80 px-1.5 py-0.5 rounded"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No media uploaded yet.</p>
                  )}

                  {/* Upload file */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`upload-${variant.id}`}
                      className="flex items-center gap-1.5 text-xs bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      {uploadingMedia === variant.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      Upload Image / Video
                    </label>
                    <input
                      id={`upload-${variant.id}`}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleFileUpload(variant.id, file);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  {/* Or add by URL */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Or add by URL:
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Input
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://... (image or video URL)"
                        className="flex-1 min-w-[200px] text-xs h-8"
                      />
                      <select
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value as "IMAGE" | "VIDEO")}
                        className="h-8 text-xs bg-background border border-input rounded-md px-2 cursor-pointer"
                      >
                        <option value="IMAGE">📷 Image</option>
                        <option value="VIDEO">🎬 Video</option>
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleAddMediaByUrl(variant.id)}
                        disabled={addingMediaToId === variant.id}
                        className="h-8 text-xs gap-1.5"
                      >
                        {addingMediaToId === variant.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : mediaType === "VIDEO" ? (
                          <Video className="h-3 w-3" />
                        ) : (
                          <Image className="h-3 w-3" />
                        )}
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVariantPanel;
