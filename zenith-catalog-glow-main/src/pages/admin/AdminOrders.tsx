import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getOrders } from "@/api/orderApi";
import { Order } from "@/types";
import { Button } from "@/components/ui/button";

const AUTO_REFRESH_MS = 30000;

const paymentStatusClassName = (paymentStatus: string) => {
  switch (paymentStatus.toUpperCase()) {
    case "PAID":
      return "bg-accent/20 text-accent";
    case "AUTHORIZED":
      return "bg-blue-100 text-blue-700";
    case "PENDING":
      return "bg-secondary text-foreground";
    case "FAILED":
      return "bg-destructive/10 text-destructive";
    case "REFUNDED":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const formatCreatedAt = (value?: string) =>
  value ? new Date(value).toLocaleString() : "-";

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Orders</h1>
            <p className="mt-1 text-sm font-body text-muted-foreground">
              Latest customer orders. This list auto-refreshes every 30 seconds.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs font-body text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" onClick={() => void loadOrders()}>
              Refresh Now
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-body text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-xl bg-card shadow-premium" />
            ))
          ) : orders.length ? (
            orders.map((order) => (
              <div key={order.id} className="rounded-xl bg-card p-5 shadow-premium">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">
                      Order #{order.id}
                    </h2>
                    <p className="mt-1 text-sm font-body text-muted-foreground">
                      {order.customerName} · {order.phone}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.address}, {order.pincode}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${paymentStatusClassName(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                    <p className="mt-2 text-sm font-semibold font-body">
                      Rs. {order.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCreatedAt(order.createdAt)}
                    </p>
                    {order.razorpayOrderId && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Razorpay: {order.razorpayOrderId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {order.items.map((item, index) => (
                    <div key={`${order.id}-${item.productId}-${index}`} className="flex items-center justify-between gap-4 rounded-lg bg-secondary/30 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium font-body">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right text-sm font-body">
                        <p>Rs. {item.price.toLocaleString()} each</p>
                        <p className="font-semibold">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-card p-8 text-center text-sm font-body text-muted-foreground shadow-premium">
              No orders yet.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
