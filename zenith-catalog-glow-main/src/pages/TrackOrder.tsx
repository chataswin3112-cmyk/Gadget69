import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, PackageCheck, Search, Truck } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import { getOrderById } from "@/api/orderApi";
import { getErrorMessage } from "@/lib/api-error";
import { toast } from "@/hooks/use-toast";
import type { Order } from "@/types";

const statusSteps = ["CONFIRMED", "SHIPPED", "DELIVERED"] as const;

const statusLabel = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return "CONFIRMED ✅";
    case "SHIPPED":
      return "SHIPPED 🚚";
    case "DELIVERED":
      return "DELIVERED 🎉";
    default:
      return status;
  }
};

const statusClassName = (status: string) => {
  switch (status) {
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

const TrackOrder = () => {
  const [form, setForm] = useState({ orderId: "", phone: "" });
  const [order, setOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentStep = useMemo(() => {
    const index = statusSteps.indexOf((order?.orderStatus || "CONFIRMED") as (typeof statusSteps)[number]);
    return index === -1 ? 0 : index;
  }, [order?.orderStatus]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const orderId = Number(form.orderId);
    if (!orderId || !form.phone.trim()) {
      toast({ title: "Enter your order ID and phone number", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const result = await getOrderById(orderId, form.phone.trim());
      setOrder(result);
    } catch (error) {
      setOrder(null);
      toast({
        title: getErrorMessage(error, "We could not find an order for those details"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="section-container section-padding">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[2rem] border border-border/60 bg-card/90 p-8 shadow-premium backdrop-blur-sm sm:p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-accent/80 font-heading">
              Track Order
            </p>
            <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Track your Gadget69 order
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground font-body sm:text-base">
              Enter your order ID and phone number to check the latest delivery status without logging in.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4 rounded-3xl border border-border/60 bg-background/80 p-6 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground font-body">Order ID</label>
                <input
                  type="number"
                  value={form.orderId}
                  onChange={(event) => setForm((current) => ({ ...current, orderId: event.target.value }))}
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="12345"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground font-body">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="+91 98765 43210"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {submitting ? "Checking..." : "Track Order"}
              </button>
            </form>

            {order && (
              <div className="mt-8 grid gap-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Order ID</p>
                    <p className="mt-3 font-mono text-lg font-bold text-foreground">#{order.id}</p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Product Name</p>
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {order.items.map((item) => item.productName).join(", ")}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Amount</p>
                    <p className="mt-3 text-lg font-bold text-accent">Rs. {order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Current Status</p>
                    <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusClassName(order.orderStatus || "CONFIRMED")}`}>
                      {statusLabel(order.orderStatus || "CONFIRMED")}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/60 bg-secondary/20 p-6">
                  <p className="text-sm font-semibold text-foreground font-heading">Order timeline</p>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {statusSteps.map((step, index) => {
                      const active = index <= currentStep;
                      const icon =
                        step === "CONFIRMED"
                          ? <PackageCheck className="h-5 w-5" />
                          : step === "SHIPPED"
                            ? <Truck className="h-5 w-5" />
                            : <CheckCircle2 className="h-5 w-5" />;

                      return (
                        <div
                          key={step}
                          className={`rounded-2xl border p-4 transition-colors ${
                            active
                              ? "border-accent/30 bg-accent/10 text-foreground"
                              : "border-border/60 bg-background/80 text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2 font-semibold">
                            {icon}
                            {statusLabel(step)}
                          </div>
                          <p className="mt-2 text-sm">
                            {step === "CONFIRMED" && "Your payment is successful and the order is confirmed."}
                            {step === "SHIPPED" && "Your package has left our facility and is on the way."}
                            {step === "DELIVERED" && "Your order has been completed successfully."}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <FloatingContactActions />
      <Footer />
    </div>
  );
};

export default TrackOrder;
