import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Eye, RefreshCw, Trash2, XCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  archiveAdminOrder,
  cancelAdminOrder,
  deleteAdminOrder,
  getAdminOrderById,
  getAdminOrders,
  updateAdminOrderDetails,
  updateAdminOrderStatus,
} from "@/api/orderApi";
import type { Order, Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/api-error";
import { useAdminData } from "@/contexts/AdminDataContext";
import MediaImage from "@/components/ui/media-image";
import { cn } from "@/lib/utils";

const AUTO_REFRESH_MS = 30000;
const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;
const PRODUCT_NAME_CLAMP_CLASS =
  "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]";

type OrderTab = "all" | "active" | "delivery" | "failed" | "pending";

type ViewTone = {
  label: string;
  description: string;
  cardClassName: string;
  cardActiveClassName: string;
  tabActiveClassName: string;
};

type StatusTone = {
  tone: string;
  badgeClassName: string;
  surfaceClassName: string;
};

const ORDER_VIEW_TONES: Record<OrderTab, ViewTone> = {
  all: {
    label: "All Orders",
    description: "Complete admin queue",
    cardClassName: "border-neutral-200/80 bg-neutral-50/80 text-neutral-900",
    cardActiveClassName: "ring-2 ring-neutral-300/80",
    tabActiveClassName: "border-neutral-300 bg-neutral-100 text-neutral-900 shadow-sm",
  },
  active: {
    label: "Active Orders",
    description: "Confirmed and processing",
    cardClassName: "border-sky-200/80 bg-sky-50/80 text-sky-950",
    cardActiveClassName: "ring-2 ring-sky-300/70",
    tabActiveClassName: "border-sky-300 bg-sky-100 text-sky-900 shadow-sm",
  },
  delivery: {
    label: "Delivery Orders",
    description: "Shipped to delivered",
    cardClassName: "border-violet-200/80 bg-violet-50/80 text-violet-950",
    cardActiveClassName: "ring-2 ring-violet-300/70",
    tabActiveClassName: "border-violet-300 bg-violet-100 text-violet-900 shadow-sm",
  },
  failed: {
    label: "Failed Orders",
    description: "Payment issues",
    cardClassName: "border-rose-200/80 bg-rose-50/80 text-rose-950",
    cardActiveClassName: "ring-2 ring-rose-300/70",
    tabActiveClassName: "border-rose-300 bg-rose-100 text-rose-900 shadow-sm",
  },
  pending: {
    label: "Pending Orders",
    description: "Awaiting payment",
    cardClassName: "border-amber-200/80 bg-amber-50/80 text-amber-950",
    cardActiveClassName: "ring-2 ring-amber-300/70",
    tabActiveClassName: "border-amber-300 bg-amber-100 text-amber-900 shadow-sm",
  },
};

const PAYMENT_STATUS_TONES: Record<string, StatusTone> = {
  SUCCESS: {
    tone: "success",
    badgeClassName: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80",
    surfaceClassName: "border-emerald-200/80 bg-emerald-50/75",
  },
  PENDING: {
    tone: "pending",
    badgeClassName: "bg-amber-100 text-amber-700 ring-1 ring-amber-200/80",
    surfaceClassName: "border-amber-200/80 bg-amber-50/75",
  },
  FAILED: {
    tone: "failed",
    badgeClassName: "bg-rose-100 text-rose-700 ring-1 ring-rose-200/80",
    surfaceClassName: "border-rose-200/80 bg-rose-50/75",
  },
  REFUNDED: {
    tone: "refunded",
    badgeClassName: "bg-slate-200 text-slate-700 ring-1 ring-slate-300/80",
    surfaceClassName: "border-slate-200/80 bg-slate-50/75",
  },
};

const ORDER_STATUS_TONES: Record<string, StatusTone> = {
  DELIVERED: {
    tone: "delivered",
    badgeClassName: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/80",
    surfaceClassName: "border-emerald-200/80 bg-emerald-50/75",
  },
  PENDING: {
    tone: "pending",
    badgeClassName: "bg-amber-100 text-amber-700 ring-1 ring-amber-200/80",
    surfaceClassName: "border-amber-200/80 bg-amber-50/75",
  },
  CANCELLED: {
    tone: "failed",
    badgeClassName: "bg-rose-100 text-rose-700 ring-1 ring-rose-200/80",
    surfaceClassName: "border-rose-200/80 bg-rose-50/75",
  },
  CONFIRMED: {
    tone: "active",
    badgeClassName: "bg-sky-100 text-sky-700 ring-1 ring-sky-200/80",
    surfaceClassName: "border-sky-200/80 bg-sky-50/75",
  },
  PROCESSING: {
    tone: "active",
    badgeClassName: "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200/80",
    surfaceClassName: "border-cyan-200/80 bg-cyan-50/75",
  },
  SHIPPED: {
    tone: "delivery",
    badgeClassName: "bg-violet-100 text-violet-700 ring-1 ring-violet-200/80",
    surfaceClassName: "border-violet-200/80 bg-violet-50/75",
  },
  OUT_FOR_DELIVERY: {
    tone: "delivery",
    badgeClassName: "bg-fuchsia-100 text-fuchsia-700 ring-1 ring-fuchsia-200/80",
    surfaceClassName: "border-fuchsia-200/80 bg-fuchsia-50/75",
  },
};

const NEUTRAL_SECTION_CLASS = "border-border/60 bg-secondary/20";

const normalizePaymentStatus = (paymentStatus?: string) => {
  const normalized = paymentStatus?.trim().toUpperCase() || "PENDING";
  if (normalized === "PAID") {
    return "SUCCESS";
  }
  if (normalized === "AUTHORIZED") {
    return "PENDING";
  }
  return normalized;
};

const normalizeOrderStatus = (status?: string) => {
  const normalized =
    status?.trim().replace(/-/g, "_").replace(/\s+/g, "_").toUpperCase() || "PENDING";
  if (normalized === "PLACED") {
    return "PENDING";
  }
  return normalized;
};

const getPaymentTone = (paymentStatus?: string) =>
  PAYMENT_STATUS_TONES[normalizePaymentStatus(paymentStatus)] || {
    tone: "neutral",
    badgeClassName: "bg-muted text-muted-foreground ring-1 ring-border/70",
    surfaceClassName: NEUTRAL_SECTION_CLASS,
  };

const getOrderTone = (status?: string) =>
  ORDER_STATUS_TONES[normalizeOrderStatus(status)] || {
    tone: "neutral",
    badgeClassName: "bg-secondary text-foreground ring-1 ring-border/70",
    surfaceClassName: NEUTRAL_SECTION_CLASS,
  };

const formatCreatedAt = (value?: string) => (value ? new Date(value).toLocaleString() : "--");
const formatCurrency = (value?: number) => `Rs. ${(value ?? 0).toLocaleString()}`;
const totalQuantity = (order: Order) =>
  order.items.reduce((sum, item) => sum + item.quantity, 0);
const canDeleteOrder = (order: Order) =>
  ["FAILED", "PENDING"].includes(normalizePaymentStatus(order.paymentStatus));

const tabMatches = (order: Order, tab: OrderTab) => {
  const orderStatus = normalizeOrderStatus(order.orderStatus);
  const paymentStatus = normalizePaymentStatus(order.paymentStatus);

  switch (tab) {
    case "active":
      return orderStatus === "CONFIRMED" || orderStatus === "PROCESSING";
    case "delivery":
      return ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(orderStatus);
    case "failed":
      return paymentStatus === "FAILED";
    case "pending":
      return paymentStatus === "PENDING";
    default:
      return true;
  }
};

const getProductMeta = (product?: Product) => {
  const metaParts = [product?.sectionName, product?.model_number].filter(Boolean);
  return metaParts.length ? metaParts.join(" - ") : "Catalog item";
};

const AdminOrders = () => {
  const { products } = useAdminData();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    paymentStatus: "ALL",
    orderStatus: "ALL",
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Order>>({});

  const productLookup = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await getAdminOrders();
      setOrders(data.filter((order) => !order.isDeleted));
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Failed to load orders."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
    const intervalId = window.setInterval(() => {
      void loadOrders();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => tabMatches(order, activeTab))
      .filter((order) => {
        const paymentStatus = normalizePaymentStatus(order.paymentStatus);
        return filters.paymentStatus === "ALL"
          ? true
          : paymentStatus === filters.paymentStatus;
      })
      .filter((order) => {
        const orderStatus = normalizeOrderStatus(order.orderStatus);
        return filters.orderStatus === "ALL" ? true : orderStatus === filters.orderStatus;
      })
      .filter((order) => {
        if (!filters.fromDate && !filters.toDate) {
          return true;
        }
        if (!order.createdAt) {
          return false;
        }
        const orderDate = new Date(order.createdAt);
        const from = filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`) : null;
        const to = filters.toDate ? new Date(`${filters.toDate}T23:59:59`) : null;
        if (from && orderDate < from) {
          return false;
        }
        if (to && orderDate > to) {
          return false;
        }
        return true;
      });
  }, [activeTab, filters, orders]);

  const summaryCards = useMemo(
    () =>
      (Object.entries(ORDER_VIEW_TONES) as Array<[OrderTab, ViewTone]>).map(([tab, config]) => ({
        id: tab,
        ...config,
        count: tab === "all" ? orders.length : orders.filter((order) => tabMatches(order, tab)).length,
      })),
    [orders]
  );

  const mergeOrder = useCallback((updatedOrder: Order) => {
    setOrders((current) => {
      const next = current.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order
      );
      return updatedOrder.isDeleted
        ? next.filter((order) => order.id !== updatedOrder.id)
        : next;
    });
    setSelectedOrder((current) => (current?.id === updatedOrder.id ? updatedOrder : current));
  }, []);

  const handleViewDetails = async (orderId: number | undefined) => {
    if (!orderId) {
      return;
    }

    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const order = await getAdminOrderById(orderId);
      setSelectedOrder(order);
      setEditForm({
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
        address: order.address,
        pincode: order.pincode,
      });
      setEditMode(false);
    } catch (viewError) {
      toast({
        title: "Unable to load order details",
        description: getErrorMessage(viewError, "Please try again."),
        variant: "destructive",
      });
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number | undefined, nextStatus: string) => {
    if (!orderId) {
      return;
    }

    const actionKey = `status-${orderId}`;
    setBusyAction(actionKey);
    try {
      const updated = await updateAdminOrderStatus(orderId, nextStatus);
      mergeOrder(updated);
      toast({
        title: `Order #${orderId} updated`,
        description: `Status changed to ${normalizeOrderStatus(updated.orderStatus)}.`,
      });
    } catch (statusError) {
      toast({
        title: "Failed to update status",
        description: getErrorMessage(statusError, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleUpdateDetails = async () => {
    if (!selectedOrder?.id) return;
    
    if (!editForm.customerName || !editForm.phone || !editForm.email || !editForm.address || !editForm.pincode) {
      toast({
        title: "Please fill all details",
        description: "All customer and delivery details are mandatory.",
        variant: "destructive",
      });
      return;
    }

    const actionKey = `details-${selectedOrder.id}`;
    setBusyAction(actionKey);
    try {
      const updated = await updateAdminOrderDetails(selectedOrder.id, editForm);
      mergeOrder(updated);
      setSelectedOrder(updated);
      toast({
        title: `Order #${selectedOrder.id} updated`,
        description: "Order details have been successfully updated.",
      });
      setEditMode(false);
    } catch (error) {
      toast({
        title: "Failed to update details",
        description: getErrorMessage(error, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (!order.id) {
      return;
    }

    const actionKey = `cancel-${order.id}`;
    setBusyAction(actionKey);
    try {
      const updated = await cancelAdminOrder(order.id);
      mergeOrder(updated);
      toast({
        title: `Order #${order.id} cancelled`,
        description: "The order status has been set to CANCELLED.",
      });
    } catch (cancelError) {
      toast({
        title: "Failed to cancel order",
        description: getErrorMessage(cancelError, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleArchiveOrder = async (order: Order) => {
    if (!order.id) {
      return;
    }

    const actionKey = `archive-${order.id}`;
    setBusyAction(actionKey);
    try {
      const updated = await archiveAdminOrder(order.id);
      mergeOrder(updated);
      toast({
        title: `Order #${order.id} archived`,
        description: "The order has been removed from the active admin list.",
      });
    } catch (archiveError) {
      toast({
        title: "Failed to archive order",
        description: getErrorMessage(archiveError, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!order.id) {
      return;
    }
    if (!canDeleteOrder(order)) {
      toast({
        title: "Delete not allowed",
        description: "Only orders with PENDING or FAILED payments can be deleted.",
        variant: "destructive",
      });
      return;
    }
    if (!window.confirm(`Delete order #${order.id}? This cannot be undone.`)) {
      return;
    }

    const actionKey = `delete-${order.id}`;
    setBusyAction(actionKey);
    try {
      await deleteAdminOrder(order.id);
      setOrders((current) => current.filter((item) => item.id !== order.id));
      setSelectedOrder((current) => (current?.id === order.id ? null : current));
      toast({
        title: `Order #${order.id} deleted`,
        description: "The order was removed permanently.",
      });
    } catch (deleteError) {
      toast({
        title: "Failed to delete order",
        description: getErrorMessage(deleteError, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Order Management</h1>
            <p className="mt-1 text-sm font-body text-muted-foreground">
              Track payments, manage fulfilment, and handle customer orders from one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs font-body text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              onClick={() => void loadOrders()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <button
              key={card.id}
              type="button"
              data-testid={`order-summary-${card.id}`}
              data-tone={card.id}
              onClick={() => setActiveTab(card.id)}
              className={cn(
                "rounded-3xl border p-5 text-left shadow-premium transition hover:-translate-y-0.5",
                card.cardClassName,
                activeTab === card.id && card.cardActiveClassName
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-bold">{card.count.toLocaleString()}</p>
              <p className="mt-2 text-sm opacity-80">{card.description}</p>
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-premium">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrderTab)}>
              <TabsList className="h-auto flex-wrap justify-start rounded-2xl bg-secondary/40 p-1">
                {(Object.entries(ORDER_VIEW_TONES) as Array<[OrderTab, ViewTone]>).map(
                  ([tab, config]) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      data-tone={tab}
                      className={cn(
                        "rounded-xl border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition",
                        activeTab === tab
                          ? config.tabActiveClassName
                          : "hover:border-border/80 hover:bg-background/80 hover:text-foreground"
                      )}
                    >
                      {config.label}
                    </TabsTrigger>
                  )
                )}
              </TabsList>
            </Tabs>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <input
                type="date"
                value={filters.fromDate}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, fromDate: event.target.value }))
                }
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                aria-label="Filter from date"
              />
              <input
                type="date"
                value={filters.toDate}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, toDate: event.target.value }))
                }
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                aria-label="Filter to date"
              />
              <select
                value={filters.paymentStatus}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    paymentStatus: event.target.value,
                  }))
                }
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                aria-label="Filter payment status"
              >
                <option value="ALL">All Payments</option>
                <option value="PENDING">Pending</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <select
                value={filters.orderStatus}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    orderStatus: event.target.value,
                  }))
                }
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                aria-label="Filter order status"
              >
                <option value="ALL">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-body text-destructive">
              {error}
            </div>
          )}

          <div className="mt-5 overflow-hidden rounded-3xl border border-border/60">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border/60">
                <thead className="bg-secondary/40">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-5 py-4">Order ID</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="min-w-[22rem] px-5 py-4">Product</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm font-body">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td colSpan={7} className="px-5 py-5">
                          <div className="h-14 animate-pulse rounded-2xl bg-secondary/40" />
                        </td>
                      </tr>
                    ))
                  ) : filteredOrders.length ? (
                    filteredOrders.map((order) => {
                      const paymentTone = getPaymentTone(order.paymentStatus);
                      const orderTone = getOrderTone(order.orderStatus);

                      return (
                        <tr key={order.id}>
                          <td className="px-5 py-4 align-top font-mono font-semibold text-foreground">
                            <div>Order #{order.id}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {formatCreatedAt(order.createdAt)}
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="font-semibold text-foreground">
                              {order.customerName}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {order.phone}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {order.email || "--"}
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="space-y-2">
                              {order.items.map((item, index) => {
                                const product = productLookup.get(item.productId);
                                return (
                                  <div
                                    key={`${order.id}-${item.productId}-${index}`}
                                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/80 p-3"
                                  >
                                    <MediaImage
                                      src={product?.imageUrl}
                                      alt={item.productName}
                                      className="h-12 w-12 shrink-0 rounded-xl object-cover bg-muted/40"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p
                                        data-clamp="2"
                                        className={cn(
                                          "text-sm font-semibold text-foreground",
                                          PRODUCT_NAME_CLAMP_CLASS
                                        )}
                                      >
                                        {item.productName}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {getProductMeta(product)}
                                      </p>
                                    </div>
                                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                                      x {item.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="font-semibold text-accent">
                              {formatCurrency(order.totalAmount)}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {totalQuantity(order)} item(s)
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <span
                              data-tone={paymentTone.tone}
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                paymentTone.badgeClassName
                              )}
                            >
                              {normalizePaymentStatus(order.paymentStatus)}
                            </span>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="space-y-2">
                              <span
                                data-tone={orderTone.tone}
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                  orderTone.badgeClassName
                                )}
                              >
                                {normalizeOrderStatus(order.orderStatus)}
                              </span>
                              <select
                                value={normalizeOrderStatus(order.orderStatus)}
                                disabled={busyAction === `status-${order.id}`}
                                onChange={(event) =>
                                  void handleStatusChange(order.id, event.target.value)
                                }
                                className="block min-w-[180px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                              >
                                {STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void handleViewDetails(order.id)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={
                                  busyAction === `cancel-${order.id}` ||
                                  normalizeOrderStatus(order.orderStatus) === "CANCELLED"
                                }
                                onClick={() => void handleCancelOrder(order)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busyAction === `archive-${order.id}`}
                                onClick={() => void handleArchiveOrder(order)}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busyAction === `delete-${order.id}`}
                                onClick={() => void handleDeleteOrder(order)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                            {!canDeleteOrder(order) && (
                              <p className="mt-2 max-w-xs text-xs text-muted-foreground">
                                Successful payments cannot be deleted. Use cancel or archive
                                instead.
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                        No orders match the current tab and filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder?.id ? `Order #${selectedOrder.id}` : "Order details"}
            </DialogTitle>
            <DialogDescription>
              Review customer details, payment state, and delivery progress.
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="space-y-3">
              <div className="h-20 animate-pulse rounded-2xl bg-secondary/40" />
              <div className="h-20 animate-pulse rounded-2xl bg-secondary/40" />
            </div>
          ) : selectedOrder ? (
            <div className="grid gap-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">Order Details</h3>
                {!editMode ? (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    Edit Details
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void handleUpdateDetails()}
                      disabled={busyAction === `details-${selectedOrder.id}`}
                    >
                      {busyAction === `details-${selectedOrder.id}` ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  data-tone="customer"
                  className="rounded-2xl border border-border/60 bg-secondary/20 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">
                    Customer
                  </p>
                  {!editMode ? (
                    <>
                      <p className="mt-2 font-semibold text-foreground">
                        {selectedOrder.customerName}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedOrder.phone}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedOrder.email || "--"}
                      </p>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Name</label>
                        <input
                          type="text"
                          value={editForm.customerName || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, customerName: e.target.value }))}
                          className="w-full rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Phone</label>
                        <input
                          type="tel"
                          value={editForm.phone || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Email</label>
                        <input
                          type="email"
                          value={editForm.email || ""}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div
                  data-tone={getPaymentTone(selectedOrder.paymentStatus).tone}
                  className={cn(
                    "rounded-2xl border p-4",
                    getPaymentTone(selectedOrder.paymentStatus).surfaceClassName
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Payment
                  </p>
                  <p
                    data-tone={getPaymentTone(selectedOrder.paymentStatus).tone}
                    className={cn(
                      "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                      getPaymentTone(selectedOrder.paymentStatus).badgeClassName
                    )}
                  >
                    {normalizePaymentStatus(selectedOrder.paymentStatus)}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Amount: {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Updated: {formatCreatedAt(selectedOrder.updatedAt || selectedOrder.createdAt)}
                  </p>
                </div>
              </div>

              <div
                data-tone={getOrderTone(selectedOrder.orderStatus).tone}
                className={cn(
                  "rounded-2xl border p-4",
                  getOrderTone(selectedOrder.orderStatus).surfaceClassName
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">
                  Delivery
                </p>
                <p
                  data-tone={getOrderTone(selectedOrder.orderStatus).tone}
                  className={cn(
                    "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                    getOrderTone(selectedOrder.orderStatus).badgeClassName
                  )}
                >
                  {normalizeOrderStatus(selectedOrder.orderStatus)}
                </p>
                {!editMode ? (
                  <>
                    <p className="mt-3 text-sm text-muted-foreground">{selectedOrder.address}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pincode: {selectedOrder.pincode}
                    </p>
                  </>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Address</label>
                      <textarea
                        value={editForm.address || ""}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        rows={2}
                        className="w-full resize-none rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Pincode</label>
                      <input
                        type="text"
                        value={editForm.pincode || ""}
                        onChange={(e) => setEditForm(prev => ({ ...prev, pincode: e.target.value }))}
                        className="w-full rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Items
                </p>
                <div className="mt-3 space-y-2">
                  {selectedOrder.items.map((item, index) => {
                    const product = productLookup.get(item.productId);
                    return (
                      <div
                        key={`${selectedOrder.id}-${item.productId}-${index}`}
                        className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-background/85 px-4 py-3"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <MediaImage
                            src={product?.imageUrl}
                            alt={item.productName}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover bg-muted/40"
                          />
                          <div className="min-w-0">
                            <p
                              data-clamp="2"
                              className={cn(
                                "text-sm font-semibold text-foreground",
                                PRODUCT_NAME_CLAMP_CLASS
                              )}
                            >
                              {item.productName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {getProductMeta(product)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Qty {item.quantity}
                          </p>
                          <p className="mt-2 font-semibold text-foreground">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select an order to view its details.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
