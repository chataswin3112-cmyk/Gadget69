import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getOrders, updateOrderStatus } from "@/api/orderApi";
import { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Package,
  Truck,
  MapPin,
  RefreshCw,
} from "lucide-react";

const AUTO_REFRESH_MS = 30000;

const paymentStatusClassName = (paymentStatus: string) => {
  switch (paymentStatus.toUpperCase()) {
    case "PAID":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "AUTHORIZED":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "PENDING":
      return "bg-secondary text-foreground";
    case "FAILED":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "REFUNDED":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const orderStatusConfig: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  PLACED: {
    label: "Placed",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    icon: <Package className="h-3 w-3" />,
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  SHIPPED: {
    label: "Shipped",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    icon: <Truck className="h-3 w-3" />,
  },
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: <MapPin className="h-3 w-3" />,
  },
};

const STATUS_FLOW: Record<string, string | null> = {
  PLACED: "CONFIRMED",
  CONFIRMED: "SHIPPED",
  SHIPPED: "DELIVERED",
  DELIVERED: null,
};

const STATUS_BUTTON_LABELS: Record<string, string> = {
  CONFIRMED: "Confirm Order",
  SHIPPED: "Mark Shipped",
  DELIVERED: "Mark Delivered",
};

const formatCreatedAt = (value?: string) =>
  value ? new Date(value).toLocaleString() : "-";

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await getOrders();
      setOrders(data);
      setLastUpdated(new Date());
    } catch {
      setError("Failed to load orders.");
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

  const handleStatusAdvance = async (order: Order) => {
    if (!order.id) return;
    const current = (order.orderStatus ?? "PLACED").toUpperCase();
    const next = STATUS_FLOW[current];
    if (!next) return;

    setUpdatingOrderId(order.id);
    try {
      const updated = await updateOrderStatus(order.id, next);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, orderStatus: updated.orderStatus } : o))
      );
      toast({
        title: `Order #${order.id} → ${next}`,
        description: `Order status updated successfully.`,
      });
    } catch {
      toast({
        title: "Failed to update status",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Orders</h1>
            <p className="mt-1 text-sm font-body text-muted-foreground">
              Customer orders — auto-refreshes every 30 seconds.
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

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-body text-destructive">
            {error}
          </div>
        )}

        {/* Order Status Legend */}
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-body text-muted-foreground uppercase tracking-wider">Order Status:</span>
          {Object.entries(orderStatusConfig).map(([key, cfg]) => (
            <span
              key={key}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.className}`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-xl bg-card shadow-premium" />
            ))
          ) : orders.length ? (
            orders.map((order) => {
              const orderStatus = (order.orderStatus ?? "PLACED").toUpperCase();
              const statusCfg = orderStatusConfig[orderStatus] ?? orderStatusConfig.PLACED;
              const nextStatus = STATUS_FLOW[orderStatus];
              const isUpdating = updatingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-xl bg-card border border-border/50 shadow-premium overflow-hidden transition-all hover:shadow-lg"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 p-5 border-b border-border">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="font-heading text-lg font-semibold">Order #{order.id}</h2>
                        {/* Payment Status */}
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${paymentStatusClassName(order.paymentStatus)}`}
                        >
                          {order.paymentStatus}
                        </span>
                        {/* Order Status */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusCfg.className}`}
                        >
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-sm font-body text-muted-foreground truncate">
                        {order.customerName} · {order.phone}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {order.address}, {order.pincode}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold font-heading text-accent">
                        ₹{order.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCreatedAt(order.createdAt)}
                      </p>
                      {order.razorpayOrderId && (
                        <p className="mt-1 text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">
                          {order.razorpayOrderId}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-5 space-y-2">
                    {order.items.map((item, index) => (
                      <div
                        key={`${order.id}-${item.productId}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-lg bg-secondary/30 px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium font-body">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right text-sm font-body shrink-0">
                          <p className="text-muted-foreground">₹{item.price.toLocaleString()} each</p>
                          <p className="font-semibold">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  {nextStatus && (
                    <div className="px-5 pb-5 flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => void handleStatusAdvance(order)}
                        disabled={isUpdating}
                        className={`font-body ${
                          nextStatus === "CONFIRMED"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : nextStatus === "SHIPPED"
                            ? "bg-violet-600 hover:bg-violet-700 text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {isUpdating ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Updating…
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            {nextStatus === "CONFIRMED" && <CheckCircle className="h-4 w-4" />}
                            {nextStatus === "SHIPPED" && <Truck className="h-4 w-4" />}
                            {nextStatus === "DELIVERED" && <MapPin className="h-4 w-4" />}
                            {STATUS_BUTTON_LABELS[nextStatus]}
                          </span>
                        )}
                      </Button>
                      <span className="text-xs text-muted-foreground font-body">
                        Current: <strong>{statusCfg.label}</strong>
                      </span>
                    </div>
                  )}

                  {orderStatus === "DELIVERED" && (
                    <div className="px-5 pb-5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Order fully delivered
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl bg-card p-12 text-center shadow-premium">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm font-body text-muted-foreground">No orders yet.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
