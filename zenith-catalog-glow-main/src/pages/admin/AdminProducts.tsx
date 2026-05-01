import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AdminVariantPanel from "@/components/admin/AdminVariantPanel";
import ProductMediaManager from "@/components/admin/ProductMediaManager";
import MediaImage from "@/components/ui/media-image";
import { useAdminData } from "@/contexts/AdminDataContext";
import { getErrorMessage } from "@/lib/api-error";
import { getOfferStatus, getEffectivePrice, type OfferStatus } from "@/lib/pricing";
import { getPrimaryImageUrl, getProductMedia } from "@/lib/catalog-media";
import { getChildSections, getProductCategoryLabel, getTopLevelSections } from "@/lib/category";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const DIRECT_CATEGORY_VALUE = "__DIRECT_CATEGORY__";

const emptyProduct = (sectionId?: number): Partial<Product> => ({
  name: "",
  description: "",
  price: 0,
  stockQuantity: 0,
  sectionId,
  media: [],
  imageUrl: "",
  videoUrl: "",
  galleryImages: [],
  is_new_launch: false,
  is_best_seller: false,
  is_featured: false,
  is_hero_featured: false,
  model_number: "",
  offer: false,
  offerPrice: undefined,
  mrp: undefined,
  createdAt: new Date().toISOString(),
  status: "ACTIVE",
  specifications: {},
});

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

const normalizeSpecificationValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const normalizeSpecifications = (specifications: unknown): Record<string, string> => {
  if (!specifications || typeof specifications !== "object" || Array.isArray(specifications)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(specifications as Record<string, unknown>)
      .map(([key, value]) => [key.trim(), normalizeSpecificationValue(value)] as const)
      .filter(([key]) => key.length > 0)
  );
};

const AdminProducts = () => {
  const {
    products,
    sections,
    addProduct,
    updateProduct,
    deleteProduct,
    isLoading,
    ensureProductsLoaded,
    ensureSectionsLoaded,
  } = useAdminData();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const topLevelSections = useMemo(() => getTopLevelSections(sections), [sections]);
  const selectedCategorySubcategories = useMemo(
    () => (selectedCategoryId === null ? [] : getChildSections(sections, selectedCategoryId)),
    [sections, selectedCategoryId]
  );
  const subcategorySelectValue = useMemo(() => {
    if (selectedCategoryId === null || !editing?.sectionId) {
      return "";
    }
    return editing.sectionId === selectedCategoryId
      ? DIRECT_CATEGORY_VALUE
      : String(editing.sectionId);
  }, [editing?.sectionId, selectedCategoryId]);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          getProductCategoryLabel(product).toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  useEffect(() => {
    void Promise.all([ensureSectionsLoaded(), ensureProductsLoaded()]);
  }, [ensureProductsLoaded, ensureSectionsLoaded]);

  const openNew = () => {
    if (!topLevelSections.length) {
      toast.error("Add a category before creating products");
      return;
    }

    const firstCategory = topLevelSections[0];

    setSelectedCategoryId(firstCategory.id);
    setEditing(emptyProduct(firstCategory.id));
    setIsNew(true);
  };

  const openEdit = (product: Product) => {
    setSelectedCategoryId(product.parentSectionId ?? product.sectionId ?? null);
    setEditing({
      ...product,
      media: getProductMedia(product),
      specifications: normalizeSpecifications(product.specifications),
      galleryImages: product.galleryImages || [],
    });
    setIsNew(false);
  };

  const saveProduct = async () => {
    if (!editing?.name?.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!editing.description?.trim()) {
      toast.error("Product description is required");
      return;
    }
    if (editing.price === null || editing.price === undefined || Number(editing.price) <= 0) {
      toast.error("Product price is required");
      return;
    }
    if (!editing.sectionId) {
      toast.error("Select a category before saving this product");
      return;
    }

    try {
      setSaving(true);
      const payload: Partial<Product> = {
        ...editing,
        specifications: normalizeSpecifications(editing.specifications),
        media: (editing.media || []).map((item, index) => ({
          ...item,
          displayOrder: index,
        })),
      };

      const saved = isNew
        ? await addProduct(payload)
        : await updateProduct(editing.id!, payload);

      setEditing({
        ...saved,
        media: getProductMedia(saved),
        specifications: normalizeSpecifications(saved.specifications),
      });
      setSelectedCategoryId(saved.parentSectionId ?? saved.sectionId ?? null);
      setIsNew(false);
      toast.success(isNew ? "Product created. You can add variants now." : "Product updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save product"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) {
      return;
    }

    try {
      await deleteProduct(deleteId);
      toast.success("Product deleted");
      setDeleteId(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete product"));
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="admin-page-header">
          <div>
            <h1 className="font-heading text-2xl font-bold">Products</h1>
            <p className="mt-1 text-sm text-muted-foreground font-body">{products.length} products</p>
          </div>
          <div className="admin-page-actions">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full sm:w-52"
            />
            <Button asChild variant="outline" className="admin-action-button">
              <Link to="/admin/offers">Manage Offers</Link>
            </Button>
            <Button onClick={openNew} className="admin-action-button bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-card shadow-premium">
          <div className="admin-table-scroll">
            <table className="min-w-[860px] w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-4 text-xs uppercase text-muted-foreground font-body">Image</th>
                  <th className="p-4 text-xs uppercase text-muted-foreground font-body">Product</th>
                  <th className="p-4 text-xs uppercase text-muted-foreground font-body">Category</th>
                  <th className="p-4 text-xs uppercase text-muted-foreground font-body">Price</th>
                  <th className="p-4 text-xs uppercase text-muted-foreground font-body">Offer</th>
                  <th className="p-4 text-xs uppercase text-muted-foreground font-body">Stock</th>
                  <th className="p-4 text-xs uppercase text-muted-foreground font-body">Variants</th>
                  <th className="p-4 text-xs uppercase text-muted-foreground font-body">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => {
                  const displayImage = getPrimaryImageUrl(getProductMedia(product)) || product.imageUrl;
                  const variantsCount = product.variants?.length || 0;

                  return (
                    <tr key={product.id} className="hover:bg-muted/20">
                      <td className="p-4">
                        <MediaImage
                          src={displayImage}
                          alt={product.name}
                          className="h-12 w-12 rounded-xl bg-secondary/30 object-cover"
                        />
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium font-body">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.model_number || "No model number"}</p>
                      </td>
                      <td className="p-4 text-sm font-body">{getProductCategoryLabel(product)}</td>
                      <td className="p-4 text-sm font-semibold font-body">
                        Rs. {getEffectivePrice(product).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${offerStatusClassName[getOfferStatus(product)]}`}
                        >
                          {offerStatusLabel[getOfferStatus(product)]}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-body">{product.stockQuantity}</td>
                      <td className="p-4 text-sm font-body">{variantsCount}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredProducts.length && !isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground font-body">
                      No products found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => (!open ? setEditing(null) : undefined)}>
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {isNew ? "Create Product" : `Edit ${editing?.name || "Product"}`}
            </DialogTitle>
          </DialogHeader>

          {editing ? (
            <Tabs defaultValue="details" className="space-y-6">
              <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-secondary/40 p-1 scrollbar-hide">
                <TabsTrigger value="details" className="shrink-0">Details</TabsTrigger>
                <TabsTrigger value="media" className="shrink-0">Media</TabsTrigger>
                <TabsTrigger value="variants" className="shrink-0">Variants</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="font-body">Product Name</Label>
                    <Input
                      value={editing.name || ""}
                      onChange={(event) =>
                        setEditing((current) => (current ? { ...current, name: event.target.value } : current))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Model Number</Label>
                    <Input
                      value={editing.model_number || ""}
                      onChange={(event) =>
                        setEditing((current) =>
                          current ? { ...current, model_number: event.target.value } : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Category</Label>
                    <Select
                      value={selectedCategoryId === null ? "" : String(selectedCategoryId)}
                      onValueChange={(value) => {
                        const categoryId = Number.parseInt(value, 10);
                        setSelectedCategoryId(categoryId);
                        setEditing((current) =>
                          current
                            ? {
                                ...current,
                                sectionId: categoryId,
                              }
                            : current
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Main categories</SelectLabel>
                          {topLevelSections.map((section) => (
                            <SelectItem key={section.id} value={String(section.id)}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Subcategory</Label>
                    <Select
                      value={subcategorySelectValue}
                      disabled={selectedCategoryId === null}
                      onValueChange={(value) => {
                        if (value === DIRECT_CATEGORY_VALUE) {
                          setEditing((current) =>
                            current && selectedCategoryId !== null
                              ? { ...current, sectionId: selectedCategoryId }
                              : current
                          );
                          return;
                        }
                        setEditing((current) =>
                          current ? { ...current, sectionId: Number.parseInt(value, 10) } : current
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add directly under category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Placement</SelectLabel>
                          <SelectItem value={DIRECT_CATEGORY_VALUE}>
                            Add directly under category
                          </SelectItem>
                        </SelectGroup>
                        {selectedCategorySubcategories.length ? (
                          <SelectGroup>
                            <SelectLabel>Subcategories</SelectLabel>
                            {selectedCategorySubcategories.map((section) => (
                              <SelectItem key={section.id} value={String(section.id)}>
                                {section.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ) : null}
                      </SelectContent>
                    </Select>
                    {selectedCategorySubcategories.length ? (
                      <p className="text-xs text-muted-foreground">
                        Keep the direct category option selected, or move the product into a subcategory.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No subcategories yet. This product will be placed directly under the category.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Base Price</Label>
                    <Input
                      type="number"
                      value={editing.price || 0}
                      onChange={(event) =>
                        setEditing((current) =>
                          current ? { ...current, price: Number.parseFloat(event.target.value) || 0 } : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">MRP</Label>
                    <Input
                      type="number"
                      value={editing.mrp || ""}
                      onChange={(event) =>
                        setEditing((current) =>
                          current
                            ? {
                                ...current,
                                mrp: event.target.value
                                  ? Number.parseFloat(event.target.value)
                                  : undefined,
                              }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Stock Quantity</Label>
                    <Input
                      type="number"
                      value={editing.stockQuantity || 0}
                      onChange={(event) =>
                        setEditing((current) =>
                          current
                            ? { ...current, stockQuantity: Number.parseInt(event.target.value, 10) || 0 }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Display Order</Label>
                    <Input
                      type="number"
                      value={editing.display_order || 0}
                      onChange={(event) =>
                        setEditing((current) =>
                          current
                            ? { ...current, display_order: Number.parseInt(event.target.value, 10) || 0 }
                            : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body">Status</Label>
                    <Select
                      value={editing.status || "ACTIVE"}
                      onValueChange={(value) =>
                        setEditing((current) => (current ? { ...current, status: value } : current))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="font-body">Description</Label>
                    <Textarea
                      rows={5}
                      value={editing.description || ""}
                      onChange={(event) =>
                        setEditing((current) =>
                          current ? { ...current, description: event.target.value } : current
                        )
                      }
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label className="font-body">Specifications</Label>
                    <div className="space-y-2">
                      {Object.entries(normalizeSpecifications(editing.specifications)).map(([key, specValue], index, entries) => (
                        <div key={`${key}-${index}`} className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={key}
                            placeholder="Key"
                            onChange={(event) => {
                              const nextEntries = [...entries];
                              nextEntries[index] = [event.target.value, specValue];
                              setEditing((current) =>
                                current
                                  ? { ...current, specifications: Object.fromEntries(nextEntries) }
                                  : current
                              );
                            }}
                          />
                          <Input
                            value={specValue}
                            placeholder="Value"
                            onChange={(event) => {
                              const nextEntries = [...entries];
                              nextEntries[index] = [key, event.target.value];
                              setEditing((current) =>
                                current
                                  ? { ...current, specifications: Object.fromEntries(nextEntries) }
                                  : current
                              );
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="self-end text-destructive sm:self-auto"
                            onClick={() => {
                              const nextEntries = entries.filter((_, entryIndex) => entryIndex !== index);
                              setEditing((current) =>
                                current
                                  ? { ...current, specifications: Object.fromEntries(nextEntries) }
                                  : current
                              );
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setEditing((current) =>
                            current
                              ? {
                                  ...current,
                                  specifications: {
                                    ...normalizeSpecifications(current.specifications),
                                    [`Specification ${Object.keys(normalizeSpecifications(current.specifications)).length + 1}`]: "",
                                  },
                                }
                              : current
                          )
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Specification
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(editing.is_new_launch)}
                      onCheckedChange={(value) =>
                        setEditing((current) => (current ? { ...current, is_new_launch: value } : current))
                      }
                    />
                    <Label className="font-body text-sm">New Launch</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(editing.is_best_seller)}
                      onCheckedChange={(value) =>
                        setEditing((current) => (current ? { ...current, is_best_seller: value } : current))
                      }
                    />
                    <Label className="font-body text-sm">Best Seller</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(editing.is_featured)}
                      onCheckedChange={(value) =>
                        setEditing((current) => (current ? { ...current, is_featured: value } : current))
                      }
                    />
                    <Label className="font-body text-sm">Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(editing.is_hero_featured)}
                      onCheckedChange={(value) =>
                        setEditing((current) => (current ? { ...current, is_hero_featured: value } : current))
                      }
                    />
                    <Label className="font-body text-sm">Hero Feature</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media">
                <ProductMediaManager
                  value={editing.media || []}
                  onChange={(media) => setEditing((current) => (current ? { ...current, media } : current))}
                />
              </TabsContent>

              <TabsContent value="variants">
                {editing.id ? (
                  <AdminVariantPanel productId={editing.id} />
                ) : (
                  <div className="rounded-2xl border border-border bg-card/40 p-6 text-sm text-muted-foreground">
                    Save this product first, then add color variants, pricing, stock, and per-variant media here.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Close
            </Button>
            <Button onClick={saveProduct} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {saving ? "Saving..." : isNew ? "Create Product" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the product and its variants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminProducts;
