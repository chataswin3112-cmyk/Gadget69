import { Link } from "react-router-dom";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import { useCart } from "@/contexts/CartContext";
import MediaImage from "@/components/ui/media-image";
import { getEffectivePrice } from "@/lib/pricing";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, totalAmount, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <div className="section-container section-padding text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-heading text-3xl font-bold mb-2">Your Cart is Empty</h1>
          <p className="text-muted-foreground font-body mb-6">Looks like you haven't added anything yet.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="section-container pt-8 pb-16">
        <h1 className="font-heading text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = getEffectivePrice(item.product);

              return (
                <div
                  key={item.product.id}
                  className="flex gap-4 p-4 bg-card rounded-xl shadow-premium"
                >
                  <Link to={`/products/${item.product.id}`} className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary/30">
                      <MediaImage
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product.id}`}>
                      <h3 className="font-heading text-base font-semibold text-foreground truncate hover:text-accent transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    {item.product.model_number && (
                      <p className="text-xs text-muted-foreground font-body">{item.product.model_number}</p>
                    )}
                    <p className="text-sm font-bold text-foreground mt-1 font-body">
                      ₹{price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-input rounded-md">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1.5 hover:bg-secondary transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-medium font-body">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              Math.min(item.quantity + 1, item.product.stockQuantity)
                            )
                          }
                          className="px-2 py-1.5 hover:bg-secondary transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-base font-bold text-foreground font-body whitespace-nowrap">
                    ₹{(price * item.quantity).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl shadow-premium p-6 sticky top-24">
              <h2 className="font-heading text-lg font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm font-body">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items ({totalItems})</span>
                  <span className="font-medium">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-foreground text-base">Total</span>
                    <span className="font-bold text-foreground text-base">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <Link
                to="/checkout"
                className="mt-6 w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/products"
                className="mt-3 w-full flex items-center justify-center text-sm text-muted-foreground hover:text-accent transition-colors font-body"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      <FloatingContactActions />
      <Footer />
    </div>
  );
};

export default Cart;
