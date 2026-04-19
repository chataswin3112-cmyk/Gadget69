import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";
import { createOrder, verifyPayment } from "@/api/orderApi";
import { getErrorMessage } from "@/lib/api-error";
import { getEffectivePrice } from "@/lib/pricing";

const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";
const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const LAST_ORDER_STORAGE_KEY = "gadget69:last-order";

interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    contact: string;
    email: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
  handler: (response: RazorpayCheckoutResponse) => void | Promise<void>;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", callback: (response: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const loadRazorpayScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(RAZORPAY_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
    document.body.appendChild(script);
  });

const Checkout = () => {
  const { items, totalAmount, totalItems, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    pincode: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.customerName || !form.phone || !form.email || !form.address || !form.pincode) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const order = await createOrder({
        ...form,
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: getEffectivePrice(item.product),
        })),
      });

      if (!order.id || !order.razorpayOrderId || !order.razorpayKeyId) {
        toast({
          title: "Payment gateway is not configured",
          description: "Your cart is still saved. Please contact support to complete this order.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      await loadRazorpayScript();
      if (!window.Razorpay) {
        throw new Error("Razorpay checkout did not load");
      }

      const checkout = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amountPaise ?? Math.round(order.totalAmount * 100),
        currency: order.currency || "INR",
        name: "Gadget69",
        description: `Order #${order.id}`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: form.customerName,
          contact: form.phone,
          email: form.email,
        },
        theme: {
          color: "#b88a44",
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            toast({ title: "Payment was not completed" });
          },
        },
        handler: async (response) => {
          try {
            const verifiedOrder = await verifyPayment({
              orderId: order.id!,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(verifiedOrder));
            clearCart();
            navigate(`/checkout/success?orderId=${verifiedOrder.id}`, {
              state: { order: verifiedOrder },
            });
          } catch (error) {
            setSubmitting(false);
            toast({
              title: getErrorMessage(error, "Payment verification failed"),
              variant: "destructive",
            });
          }
        },
      });

      checkout.on("payment.failed", () => {
        setSubmitting(false);
        navigate(`/checkout/failure${order.id ? `?orderId=${order.id}` : ""}`);
      });
      checkout.open();
    } catch (error) {
      setSubmitting(false);

      const errMsg = getErrorMessage(error, "Failed to start checkout");
      if (errMsg.includes("Product not found") || errMsg.includes("not available")) {
        toast({
          title: "Product unavailable",
          description: "One or more items in your cart are no longer available. Your cart will be refreshed.",
          variant: "destructive",
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast({ title: errMsg, variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="section-container pt-8 pb-16">
        <h1 className="mb-8 font-heading text-3xl font-bold">Checkout</h1>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground font-body">Full Name</label>
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="John Doe"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground font-body">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground font-body">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground font-body">Delivery Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Street address, apartment, city, state"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground font-body">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="560001"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="w-full rounded-lg bg-accent px-8 py-3 font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Opening Secure Checkout..." : "Pay Securely"}
            </button>
          </form>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl bg-card p-6 shadow-premium">
              <h2 className="mb-4 font-heading text-lg font-bold">Order Summary</h2>
              <div className="space-y-3 text-sm font-body">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between">
                    <span className="mr-2 truncate text-muted-foreground">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="whitespace-nowrap font-medium">
                      Rs. {(getEffectivePrice(item.product) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}

                <div className="mt-3 border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                    <span className="font-medium">Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-foreground">Total</span>
                    <span className="text-base font-bold text-foreground">Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingContactActions />
      <Footer />
    </div>
  );
};

export default Checkout;
