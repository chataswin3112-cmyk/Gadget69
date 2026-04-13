import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";

const CheckoutSuccess = () => (
  <div className="min-h-screen bg-background">
    <AnnouncementBar />
    <Navbar />
    <div className="section-container section-padding text-center">
      <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
        Order Confirmed!
      </h1>
      <p className="text-muted-foreground font-body mb-8 max-w-md mx-auto">
        Thank you for your order. We'll send you a confirmation shortly.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors"
        >
          Continue Shopping
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 border border-input bg-card px-6 py-3 rounded-lg font-medium hover:bg-secondary transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
    <Footer />
  </div>
);

export default CheckoutSuccess;
