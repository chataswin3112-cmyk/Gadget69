import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getOrders, updateOrderStatus } from "@/api/orderApi";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const AUTO_REFRESH_MS = 30000;
const STATUS_OPTIONS = ["CONFIRMED", "SHIPPED", "DELIVERED"] as const;

const paymentStatusClassName = (paymentStatus: string) => {
  switch (paymentStatus.toUpperCase()) {
    case "PAID":
      return "bg-emerald-100 text-emerald-700";
    case "AUTHORIZED":
      return "bg-blue-100 text-blue-700";
    case "PENDING":
      return "bg-secondary text-foreground";
    case "FAILED":
      return "bg-red-100 text-red-700";
    case "REFUNDED":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const orderStatusClassName = (status: string) => {
  switch (status.toUpperCase()) {
    case "CONFIRMED":
      return "bg-blue-100 text-blue-700";
    case "SHIPPED":
      return "bg-violet-100 text-violet-700";
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-secondary text-foreground";
  }
};

const formatCreatedAt = (value?: string) => (value ? new Date(value).toLocaleString() : "--");

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

  const handleStatusChange = async (orderId: number | undefined, nextStatus: string) => {
    if (!orderId) {
      return;
    }

    setUpdatingOrderId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, nextStatus);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, orderStatus: updated.orderStatus } : order))
      );
      toast({
        title: `Order #${orderId} updated`,
        description: `Status changed to ${updated.orderStatus}.`,
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Orders</h1>
            <p className="mt-1 text-sm font-body text-muted-foreground">
              Manage confirmed orders, shipping progress, and completed deliveries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs font-body text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" onClick={() => void loadOrders()} className="flex items-center gap-2">
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

        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-premium">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60">
              <thead className="bg-secondary/40">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="px-5 py-4">Order ID</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-sm font-body">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={8} className="px-5 py-5">
                        <div className="h-12 animate-pulse rounded-2xl bg-secondary/40" />
                      </td>
                    </tr>
                  ))
                ) : orders.length ? (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-5 py-4 align-top font-mono font-semibold text-foreground">#{order.id}</td>
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-foreground">{order.customerName}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{formatCreatedAt(order.createdAt)}</div>
                      </td>
                      <td className="px-5 py-4 align-top text-muted-foreground">{order.phone}</td>
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={`${order.id}-${item.productId}-${index}`} className="text-foreground">
                              <span className="font-medium">{item.productName}</span>
                              <span className="ml-2 text-xs text-muted-foreground">x {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top font-semibold text-accent">
                        Rs. {order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusClassName(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${orderStatusClassName(order.orderStatus || "CONFIRMED")}`}>
                          {order.orderStatus || "CONFIRMED"}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-2">
                          <select
                            value={order.orderStatus || "CONFIRMED"}
                            disabled={updatingOrderId === order.id}
                            onChange={(event) => void handleStatusChange(order.id, event.target.value)}
                            className="min-w-[150px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          {updatingOrderId === order.id && (
                            <p className="text-xs text-muted-foreground">Saving status...</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
