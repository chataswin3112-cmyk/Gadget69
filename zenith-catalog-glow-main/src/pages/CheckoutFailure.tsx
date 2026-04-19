import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, RotateCcw, ShoppingBag } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";

const CheckoutFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="section-container section-padding flex justify-center">
        <div className="w-full max-w-md text-center py-16">
          {/* Animated icon */}
          <div className="relative inline-flex mb-8">
            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>

          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
            Payment Failed
          </h1>

          <p className="text-muted-foreground font-body mb-2 max-w-sm mx-auto">
            We were unable to process your payment. Your cart has been saved — you can try again.
          </p>

          {orderId && (
            <p className="text-xs text-muted-foreground font-mono mb-8">
              Reference: Order #{orderId}
            </p>
          )}

          {!orderId && <div className="mb-8" />}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              id="retry-payment-btn"
              onClick={() => navigate("/checkout")}
              className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </button>

            <Link
              to="/products"
              id="continue-shopping-btn"
              className="inline-flex items-center justify-center gap-2 border border-input bg-card px-6 py-3 rounded-lg font-medium hover:bg-secondary transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>

          {/* Help text */}
          <p className="mt-10 text-xs text-muted-foreground font-body">
            If money was deducted from your account, it will be refunded within 5–7 business days.{" "}
            <Link to="/contact" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Contact support
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutFailure;
