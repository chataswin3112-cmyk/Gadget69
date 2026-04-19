import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";
import { getEffectivePrice, getOfferStatus, type OfferStatus } from "@/lib/pricing";
import MediaImage from "@/components/ui/media-image";
import { cn } from "@/lib/utils";

type OfferFormState = {
  enabled: boolean;
  offerPrice: string;
  offerStartDate: string;
  offerEndDate: string;
};

const PRODUCT_NAME_CLAMP_CLASS =
  "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]";

const offerStatusLabel: Record<OfferStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  expired: "Expired",
  "no-offer": "No Offer",
};

const offerStatusClassName: Record<OfferStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80",
  upcoming: "bg-sky-100 text-sky-700 ring-1 ring-sky-200/80",
  expired: "bg-rose-100 text-rose-700 ring-1 ring-rose-200/80",
  "no-offer": "bg-muted text-muted-foreground ring-1 ring-border/70",
};

const buildFormState = (product: Product): OfferFormState => ({
  enabled: Boolean(product.offer),
  offerPrice: product.offerPrice?.toString() || "",
  offerStartDate: product.offerStartDate || "",
  offerEndDate: product.offerEndDate || "",
});

const getProductMeta = (product: Product) => {
  const metaParts = [product.sectionName || "Uncategorized", product.model_number].filter(Boolean);
  return metaParts.join(" - ");
};

const AdminOffers = () => {
  const { products, updateProduct, isLoading } = useAdminData();
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<OfferFormState | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.sectionName?.toLowerCase().includes(search.toLowerCase()) ||
          product.model_number?.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const openEditor = (product: Product) => {
    setSelectedProduct(product);
    setForm(buildFormState(product));
  };

  const closeEditor = () => {
    setSelectedProduct(null);
    setForm(null);
  };

  const saveOffer = async () => {
    if (!selectedProduct || !form) {
      return;
    }

    if (form.enabled) {
      if (!form.offerPrice) {
        toast.error("Offer price is required");
        return;
      }
      if (!form.offerStartDate || !form.offerEndDate) {
        toast.error("Offer start and end dates are required");
        return;
      }
      if (form.offerEndDate < form.offerStartDate) {
        toast.error("Offer end date cannot be before offer start date");
        return;
      }
    }

    try {
      setSaving(true);
      await updateProduct(selectedProduct.id, {
        ...selectedProduct,
        offer: form.enabled,
        offerPrice: form.enabled ? Number(form.offerPrice) : undefined,
        offerStartDate: form.enabled ? form.offerStartDate : undefined,
        offerEndDate: form.enabled ? form.offerEndDate : undefined,
      });
      toast.success("Offer updated");
      closeEditor();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update offer"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Offers</h1>
            <p className="mt-1 text-sm font-body text-muted-foreground">
              Schedule product offers with automatic start and end dates.
            </p>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-56"
            />
            <Button asChild variant="outline">
              <Link to="/admin/products">Back to Products</Link>
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/40">
                <tr className="border-b border-border text-left">
                  <th className="min-w-[20rem] p-4 text-xs font-body uppercase text-muted-foreground">
                    Product
                  </th>
                  <th className="p-4 text-xs font-body uppercase text-muted-foreground">
                    Base Price
                  </th>
                  <th className="p-4 text-xs font-body uppercase text-muted-foreground">
                    Offer Price
                  </th>
                  <th className="p-4 text-xs font-body uppercase text-muted-foreground">
                    Schedule
                  </th>
                  <th className="p-4 text-xs font-body uppercase text-muted-foreground">
                    Status
                  </th>
                  <th className="p-4 text-xs font-body uppercase text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => {
                  const offerStatus = getOfferStatus(product);
                  return (
                    <tr key={product.id} className="hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <MediaImage
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-12 w-12 shrink-0 rounded-xl object-cover bg-muted/40"
                          />
                          <div className="min-w-0">
                            <p
                              data-clamp="2"
                              className={cn(
                                "text-sm font-medium font-body text-foreground",
                                PRODUCT_NAME_CLAMP_CLASS
                              )}
                            >
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {getProductMeta(product)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-body">
                        Rs. {product.price.toLocaleString()}
                      </td>
                      <td className="p-4 text-sm font-body">
                        {typeof product.offerPrice === "number"
                          ? `Rs. ${product.offerPrice.toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="p-4 text-sm font-body text-muted-foreground">
                        {product.offerStartDate && product.offerEndDate
                          ? `${product.offerStartDate} to ${product.offerEndDate}`
                          : "-"}
                      </td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            offerStatusClassName[offerStatus]
                          )}
                        >
                          {offerStatusLabel[offerStatus]}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditor(product)}
                          >
                            Edit Offer
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Live price: Rs. {getEffectivePrice(product).toLocaleString()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!filteredProducts.length && !isLoading && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm font-body text-muted-foreground">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(selectedProduct && form)} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {selectedProduct ? `Edit Offer - ${selectedProduct.name}` : "Edit Offer"}
            </DialogTitle>
          </DialogHeader>

          {form && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium font-body">Enable scheduled offer</p>
                  <p className="text-xs text-muted-foreground">
                    Offer stays visible only between the selected dates.
                  </p>
                </div>
                <Switch
                  checked={form.enabled}
                  onCheckedChange={(checked) =>
                    setForm((prev) => (prev ? { ...prev, enabled: checked } : prev))
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-body">Regular Price</Label>
                  <Input value={selectedProduct?.price || 0} disabled />
                </div>
                <div className="space-y-2">
                  <Label className="font-body">Offer Price</Label>
                  <Input
                    type="number"
                    value={form.offerPrice}
                    disabled={!form.enabled}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, offerPrice: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-body">Offer Start Date</Label>
                  <Input
                    type="date"
                    value={form.offerStartDate}
                    disabled={!form.enabled}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, offerStartDate: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-body">Offer End Date</Label>
                  <Input
                    type="date"
                    value={form.offerEndDate}
                    disabled={!form.enabled}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, offerEndDate: event.target.value } : prev
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEditor}>
              Cancel
            </Button>
            <Button
              onClick={saveOffer}
              disabled={saving}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? "Saving..." : "Save Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOffers;
