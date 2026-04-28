import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, Eye, RefreshCw, Trash2, XCircle } from "lucide-react";
import {
  archiveAdminOrder,
  cancelAdminOrder,
  deleteAdminOrder,
  getAdminOrderById,
  getAdminOrders,
  updateAdminOrderDetails,
  updateAdminOrderStatus,
} from "@/api/orderApi";
import type { Order, OrderFilters, Product } from "@/types";
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
import { getApiErrorDetails } from "@/lib/api-error";
import { useAdminData } from "@/contexts/AdminDataContext";
import MediaImage from "@/components/ui/media-image";
import { cn } from "@/lib/utils";
import { scheduleIdleTask } from "@/lib/idle";
import { getProductCategoryLabel } from "@/lib/category";

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
  const metaParts = [product ? getProductCategoryLabel(product) : undefined, product?.model_number].filter(Boolean);
  return metaParts.length ? metaParts.join(" - ") : "Catalog item";
};

const OrderItemThumbnail = ({
  imageUrl,
  alt,
  optimizeWidth,
  sizes,
}: {
  imageUrl?: string;
  alt: string;
  optimizeWidth?: number;
  sizes?: string;
}) =>
  imageUrl ? (
    <MediaImage
      src={imageUrl}
      alt={alt}
      className="h-12 w-12 shrink-0 rounded-xl object-cover bg-muted/40"
      optimizeWidth={optimizeWidth}
      sizes={sizes}
    />
  ) : (
    <div className="h-12 w-12 shrink-0 rounded-xl bg-muted/30" aria-hidden="true" />
  );

const COMPACT_LAYOUT_QUERY = "(max-width: 1023px)";

const AdminOrders = () => {
  const { products, ensureProductsLoaded } = useAdminData();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorRequestId, setErrorRequestId] = useState<string | null>(null);
  const [isPollingPaused, setIsPollingPaused] = useState(false);
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
  const [isCompactLayout, setIsCompactLayout] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(COMPACT_LAYOUT_QUERY).matches
      : false
  );
  const hasLoadedOrdersRef = useRef(false);
  const pollingPausedRef = useRef(false);

  const productLookup = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const syncPollingPaused = useCallback((paused: boolean) => {
    pollingPausedRef.current = paused;
    setIsPollingPaused(paused);
  }, []);

  const describeError = useCallback((value: unknown, fallback: string) => {
    const { message, requestId } = getApiErrorDetails(value, fallback);
    return {
      message,
      requestId,
      description: requestId ? `${message} Reference ID: ${requestId}` : message,
    };
  }, []);

  const serverFilters = useMemo<OrderFilters>(
    () => ({
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      paymentStatus: filters.paymentStatus === "ALL" ? undefined : filters.paymentStatus,
      orderStatus: filters.orderStatus === "ALL" ? undefined : filters.orderStatus,
    }),
    [filters]
  );

  const loadOrders = useCallback(async () => {
    if (hasLoadedOrdersRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setError(null);
      setErrorRequestId(null);
      const data = await getAdminOrders(serverFilters);
      setOrders(data.filter((order) => !order.isDeleted));
      setLastUpdated(new Date());
      hasLoadedOrdersRef.current = true;
      syncPollingPaused(false);
    } catch (loadError) {
      const { message, requestId } = describeError(loadError, "Failed to load orders.");
      setError(message);
      setErrorRequestId(requestId);
      syncPollingPaused(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [describeError, serverFilters, syncPollingPaused]);

  useEffect(() => {
    const cancelProductHydration = scheduleIdleTask(() => {
      void ensureProductsLoaded();
    }, 1200);

    return cancelProductHydration;
  }, [ensureProductsLoaded]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(COMPACT_LAYOUT_QUERY);
    const syncLayout = () => setIsCompactLayout(mediaQuery.matches);
    syncLayout();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncLayout);
      return () => mediaQuery.removeEventListener("change", syncLayout);
    }

    mediaQuery.addListener(syncLayout);
    return () => mediaQuery.removeListener(syncLayout);
  }, []);

  useEffect(() => {
    void loadOrders();

    const refreshWhenVisible = () => {
      if (
        !pollingPausedRef.current &&
        (typeof document === "undefined" || document.visibilityState === "visible")
      ) {
        void loadOrders();
      }
    };

    const intervalId = window.setInterval(() => {
      if (
        !pollingPausedRef.current &&
        (typeof document === "undefined" || document.visibilityState === "visible")
      ) {
        void loadOrders();
      }
    }, AUTO_REFRESH_MS);

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", refreshWhenVisible);
    }

    return () => {
      window.clearInterval(intervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", refreshWhenVisible);
      }
    };
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => tabMatches(order, activeTab));
  }, [activeTab, orders]);

  const summaryCards = useMemo(
    () =>
      (Object.entries(ORDER_VIEW_TONES) as Array<[OrderTab, ViewTone]>).map(([tab, config]) => ({
        id: tab,
        ...config,
        count: tab === "all" ? orders.length : orders.filter((order) => tabMatches(order, tab)).length,
      })),
    [orders]
  );

  const hasActiveFilters =
    Boolean(filters.fromDate) ||
    Boolean(filters.toDate) ||
    filters.paymentStatus !== "ALL" ||
    filters.orderStatus !== "ALL";

  const clearFilters = () =>
    setFilters({
      fromDate: "",
      toDate: "",
      paymentStatus: "ALL",
      orderStatus: "ALL",
    });

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
      const { description } = describeError(viewError, "Please try again.");
      toast({
        title: "Unable to load order details",
        description,
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
      const { description } = describeError(statusError, "Please try again.");
      toast({
        title: "Failed to update status",
        description,
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
      const { description } = describeError(error, "Please try again.");
      toast({
        title: "Failed to update details",
        description,
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
      const { description } = describeError(cancelError, "Please try again.");
      toast({
        title: "Failed to cancel order",
        description,
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
      const { description } = describeError(archiveError, "Please try again.");
      toast({
        title: "Failed to archive order",
        description,
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
      const { description } = describeError(deleteError, "Please try again.");
      toast({
        title: "Failed to delete order",
        description,
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="admin-page-header">
          <div>
            <h1 className="font-heading text-2xl font-bold">Order Management</h1>
            <p className="mt-1 text-sm font-body text-muted-foreground">
              Track payments, manage fulfilment, and handle customer orders from one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs font-body text-muted-foreground">
                {isRefreshing
                  ? "Refreshing snapshot..."
                  : `Last updated: ${lastUpdated.toLocaleTimeString()}`}
              </span>
            )}
            <Button
              variant="outline"
              onClick={() => void loadOrders()}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
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

        <div className="min-w-0 rounded-3xl border border-border/60 bg-card p-5 shadow-premium">
          <div className="min-w-0 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
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

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-body text-muted-foreground">
              <span className="font-semibold text-foreground">
                {filteredOrders.length.toLocaleString()}
              </span>{" "}
              order(s) match the current queue view.
            </p>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 justify-start px-0 text-xs font-semibold text-muted-foreground hover:text-foreground sm:px-3"
              >
                Clear filters
              </Button>
            )}
          </div>

          {error && (
            <div
              className={cn(
                "mt-5 rounded-2xl border px-4 py-4 text-sm shadow-sm",
                orders.length > 0
                  ? "border-amber-200/80 bg-amber-50/80 text-amber-950"
                  : "border-destructive/20 bg-destructive/5 text-destructive"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">
                    {orders.length > 0 ? "Live refresh paused" : "Unable to load orders"}
                  </p>
                  <p className="mt-1 font-body">{error}</p>
                  {errorRequestId && (
                    <p className="mt-1 text-xs font-body text-muted-foreground">
                      Reference ID: {errorRequestId}
                    </p>
                  )}
                  {orders.length > 0 && isPollingPaused && (
                    <p className="mt-1 text-xs font-body text-amber-800/80">
                      Showing the last successful snapshot while the server recovers.
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadOrders()}
                  disabled={isRefreshing}
                  className="w-full shrink-0 sm:w-auto"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          <div className="mt-5 min-w-0 overflow-hidden rounded-3xl border border-border/60">
            {isCompactLayout ? (
              <div className="space-y-4 p-4">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-52 animate-pulse rounded-2xl bg-secondary/35" />
                  ))
                ) : filteredOrders.length ? (
                  filteredOrders.map((order) => {
                    const paymentTone = getPaymentTone(order.paymentStatus);
                    const orderTone = getOrderTone(order.orderStatus);

                    return (
                      <div
                        key={order.id}
                        className="space-y-4 rounded-[28px] border border-border/60 bg-background/90 p-4 shadow-premium"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-mono font-semibold text-foreground">Order #{order.id}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatCreatedAt(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-accent">
                              {formatCurrency(order.totalAmount)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {totalQuantity(order)} item(s)
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-secondary/15 p-3">
                          <p className="font-semibold text-foreground">{order.customerName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{order.phone}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{order.email || "--"}</p>
                        </div>

                        <div className="space-y-2">
                          {order.items.map((item, index) => {
                            const product = productLookup.get(item.productId);
                            return (
                              <div
                                key={`${order.id}-${item.productId}-${index}`}
                                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/85 p-3"
                              >
                                <OrderItemThumbnail
                                  imageUrl={product?.imageUrl}
                                  alt={item.productName}
                                  optimizeWidth={160}
                                  sizes="48px"
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

                        <div className="flex flex-wrap gap-2">
                          <span
                            data-tone={paymentTone.tone}
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              paymentTone.badgeClassName
                            )}
                          >
                            {normalizePaymentStatus(order.paymentStatus)}
                          </span>
                          <span
                            data-tone={orderTone.tone}
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              orderTone.badgeClassName
                            )}
                          >
                            {normalizeOrderStatus(order.orderStatus)}
                          </span>
                        </div>

                        <select
                          value={normalizeOrderStatus(order.orderStatus)}
                          disabled={busyAction === `status-${order.id}`}
                          onChange={(event) => void handleStatusChange(order.id, event.target.value)}
                          className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            title="View order details"
                            onClick={() => void handleViewDetails(order.id)}
                            className="bg-blue-600 text-white hover:bg-blue-700 border-0"
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            title="Cancel this order"
                            disabled={
                              busyAction === `cancel-${order.id}` ||
                              normalizeOrderStatus(order.orderStatus) === "CANCELLED"
                            }
                            onClick={() => void handleCancelOrder(order)}
                            className="bg-rose-600 text-white hover:bg-rose-700 border-0 disabled:opacity-50"
                          >
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            title="Archive this order"
                            disabled={busyAction === `archive-${order.id}`}
                            onClick={() => void handleArchiveOrder(order)}
                            className="bg-amber-500 text-white hover:bg-amber-600 border-0 disabled:opacity-50"
                          >
                            <Archive className="mr-1.5 h-3.5 w-3.5" />
                            Archive
                          </Button>
                          <Button
                            size="sm"
                            title="Permanently delete order"
                            disabled={busyAction === `delete-${order.id}`}
                            onClick={() => void handleDeleteOrder(order)}
                            variant="destructive"
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>

                        {!canDeleteOrder(order) && (
                          <p className="text-xs text-muted-foreground">
                            Successful payments cannot be deleted. Use cancel or archive instead.
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No orders match the current tab and filters.
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto">
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
                                      <OrderItemThumbnail
                                        imageUrl={product?.imageUrl}
                                        alt={item.productName}
                                        optimizeWidth={160}
                                        sizes="48px"
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
                                  size="sm"
                                  title="View order details"
                                  onClick={() => void handleViewDetails(order.id)}
                                  className="bg-blue-600 text-white hover:bg-blue-700 border-0"
                                >
                                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  title="Cancel this order"
                                  disabled={
                                    busyAction === `cancel-${order.id}` ||
                                    normalizeOrderStatus(order.orderStatus) === "CANCELLED"
                                  }
                                  onClick={() => void handleCancelOrder(order)}
                                  className="bg-rose-600 text-white hover:bg-rose-700 border-0 disabled:opacity-50"
                                >
                                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  title="Archive this order"
                                  disabled={busyAction === `archive-${order.id}`}
                                  onClick={() => void handleArchiveOrder(order)}
                                  className="bg-amber-500 text-white hover:bg-amber-600 border-0 disabled:opacity-50"
                                >
                                  <Archive className="mr-1.5 h-3.5 w-3.5" />
                                  Archive
                                </Button>
                                <Button
                                  size="sm"
                                  title="Permanently delete order"
                                  disabled={busyAction === `delete-${order.id}`}
                                  onClick={() => void handleDeleteOrder(order)}
                                  variant="destructive"
                                >
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
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
            )}
          </div>
        </div>
      </div>

      {detailsOpen ? (
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
              <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-bold">Order Details</h3>
                {!editMode ? (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="w-full sm:w-auto">
                    Edit Details
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="ghost" size="sm" onClick={() => setEditMode(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void handleUpdateDetails()}
                      disabled={busyAction === `details-${selectedOrder.id}`}
                      className="w-full sm:w-auto"
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
                          {product?.imageUrl ? (
                            <MediaImage
                              src={product.imageUrl}
                              alt={item.productName}
                              className="h-14 w-14 shrink-0 rounded-xl object-cover bg-muted/40"
                            />
                          ) : (
                            <div className="h-14 w-14 shrink-0 rounded-xl bg-muted/30" aria-hidden="true" />
                          )}
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
      ) : null}
    </>
  );
};

export default AdminOrders;
