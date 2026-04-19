import { Link, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle2, Home, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import type { Order } from "@/types";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";

const LAST_ORDER_STORAGE_KEY = "gadget69:last-order";

const readStoredOrder = (): Order | null => {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
};

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const orderIdFromQuery = searchParams.get("orderId");
  const locationOrder = (location.state as { order?: Order } | null)?.order;
  const storedOrder = readStoredOrder();

  const order =
    locationOrder && String(locationOrder.id) === orderIdFromQuery
      ? locationOrder
      : storedOrder && String(storedOrder.id) === orderIdFromQuery
        ? storedOrder
        : locationOrder ?? storedOrder ?? null;

  const productSummary =
    order?.items?.length === 1
      ? order.items[0].productName
      : order?.items?.map((item) => item.productName).join(", ");

  const quantitySummary = order?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="section-container section-padding flex justify-center">
        <div className="w-full max-w-3xl py-10">
          <div className="rounded-[2rem] border border-border/60 bg-card/90 p-8 shadow-premium backdrop-blur-sm sm:p-10">
            <div className="mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
                  Order Confirmed 🎉
                </h1>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground font-body sm:text-base">
                  Your payment was successful and your order is now confirmed. We will ship your order soon 🚚
                </p>
              </div>

              <div className="grid min-w-[220px] gap-3 sm:max-w-[240px]">
                <div className="rounded-2xl border border-accent/20 bg-accent/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/80">Order ID</p>
                  <p className="mt-2 font-mono text-xl font-bold text-accent">#{order?.id ?? orderIdFromQuery ?? "--"}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Amount Paid</p>
                  <p className="mt-2 text-xl font-bold text-emerald-700">
                    Rs. {order?.totalAmount?.toLocaleString() ?? "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Product Name</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{productSummary || "--"}</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Quantity</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{quantitySummary || "--"}</p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Payment Status</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  <PackageCheck className="h-4 w-4" />
                  SUCCESS
                </div>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Order Status</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                  <Truck className="h-4 w-4" />
                  {order?.orderStatus || "CONFIRMED"}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-border/60 bg-secondary/30 p-6">
              <p className="text-sm font-semibold text-foreground font-heading">What happens next</p>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground font-body">
                <p>1. Your order is already confirmed and saved in our system.</p>
                <p>2. Our team will manually review, pack, and dispatch it.</p>
                <p>3. You can track the latest status anytime using your order ID and phone number.</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/track-order"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                <PackageCheck className="h-4 w-4" />
                Track Order
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-card px-6 py-3 font-medium transition-colors hover:bg-secondary"
              >
                <ShoppingBag className="h-4 w-4" />
                Continue Shopping
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-card px-6 py-3 font-medium transition-colors hover:bg-secondary"
              >
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
