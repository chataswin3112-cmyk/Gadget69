import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, ShoppingBag, Home } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="section-container section-padding flex justify-center">
        <div className="w-full max-w-md text-center py-16">
          {/* Animated success icon */}
          <div className="relative inline-flex mb-8">
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
          </div>

          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
            Order Confirmed!
          </h1>

          <p className="text-muted-foreground font-body mb-4 max-w-sm mx-auto">
            Thank you for your order. We&apos;ve received your payment and will start processing soon.
          </p>

          {orderId && (
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg px-4 py-2 mb-8">
              <span className="text-sm font-body text-muted-foreground">Order ID:</span>
              <span className="text-sm font-bold font-mono text-accent">#{orderId}</span>
            </div>
          )}

          {!orderId && <div className="mb-8" />}

          {/* What happens next */}
          <div className="bg-card border border-border rounded-xl p-5 mb-8 text-left space-y-3">
            <p className="text-sm font-semibold font-heading">What happens next?</p>
            <div className="space-y-2 text-sm font-body text-muted-foreground">
              <p>✅ We'll confirm your order shortly</p>
              <p>📦 Your items will be packed and dispatched</p>
              <p>🚚 You'll receive your order within 3–7 business days</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/products"
              id="continue-shopping-btn"
              className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-all hover:scale-105 active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Link>
            <Link
              to="/"
              id="back-home-btn"
              className="inline-flex items-center justify-center gap-2 border border-input bg-card px-6 py-3 rounded-lg font-medium hover:bg-secondary transition-colors"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
