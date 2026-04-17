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
    address: "",
    pincode: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.customerName || !form.phone || !form.address || !form.pincode) {
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
            await verifyPayment({
              orderId: order.id!,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            navigate("/checkout/success");
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
        toast({
          title: "Payment failed",
          description: "No amount was confirmed. Please retry from checkout.",
          variant: "destructive",
        });
      });
      checkout.open();
    } catch (error) {
      setSubmitting(false);
      toast({ title: getErrorMessage(error, "Failed to start checkout"), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="section-container pt-8 pb-16">
        <h1 className="font-heading text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Full Name</label>
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-body"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-body"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Delivery Address</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-body resize-none"
                placeholder="Street address, apartment, city, state"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-body"
                placeholder="560001"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="w-full bg-accent text-accent-foreground px-8 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Opening Secure Checkout..." : "Pay Securely"}
            </button>
          </form>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl shadow-premium p-6 sticky top-24">
              <h2 className="font-heading text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm font-body">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between">
                    <span className="text-muted-foreground truncate mr-2">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="font-medium whitespace-nowrap">
                      Rs. {(getEffectivePrice(item.product) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                    <span className="font-medium">Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-foreground text-base">Total</span>
                    <span className="font-bold text-foreground text-base">Rs. {totalAmount.toLocaleString()}</span>
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
