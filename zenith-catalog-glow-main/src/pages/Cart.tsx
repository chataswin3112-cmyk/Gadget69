import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import MediaImage from "@/components/ui/media-image";
import { useCart } from "@/contexts/CartContext";
import { describeVariant } from "@/lib/catalog-media";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, totalAmount, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <div className="section-container section-padding text-center">
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-3xl font-bold font-heading">Your Cart is Empty</h1>
          <p className="mb-6 text-muted-foreground font-body">Looks like you have not added anything yet.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-colors hover:bg-accent/90"
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

      <div className="section-container pb-16 pt-8">
        <h1 className="mb-8 text-3xl font-bold font-heading">Shopping Cart</h1>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => {
              const variantLabel = describeVariant(item.variantColor, item.variantSize);
              const maxStock =
                item.variantId
                  ? item.product.variants?.find((variant) => variant.id === item.variantId)?.stock || item.quantity
                  : item.product.stockQuantity;

              return (
                <div key={item.lineId} className="flex gap-4 rounded-xl bg-card p-4 shadow-premium">
                  <Link to={`/products/${item.product.id}`} className="flex-shrink-0">
                    <div className="h-24 w-24 overflow-hidden rounded-lg bg-secondary/30">
                      <MediaImage
                        src={item.mediaUrl || item.product.imageUrl}
                        alt={item.product.name}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/products/${item.product.id}`}>
                      <h3 className="truncate text-base font-semibold text-foreground transition-colors hover:text-accent font-heading">
                        {item.product.name}
                      </h3>
                    </Link>
                    {item.product.model_number ? (
                      <p className="text-xs text-muted-foreground font-body">{item.product.model_number}</p>
                    ) : null}
                    {variantLabel ? (
                      <p className="mt-1 text-xs text-muted-foreground font-body">{variantLabel}</p>
                    ) : null}
                    <p className="mt-1 text-sm font-bold text-foreground font-body">
                      Rs. {item.unitPrice.toLocaleString()}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center rounded-md border border-input">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                          className="px-2 py-1.5 transition-colors hover:bg-secondary"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 py-1.5 text-sm font-medium font-body">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.lineId,
                              typeof maxStock === "number" && maxStock > 0
                                ? Math.min(item.quantity + 1, maxStock)
                                : item.quantity + 1
                            )
                          }
                          className="px-2 py-1.5 transition-colors hover:bg-secondary"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.lineId)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="whitespace-nowrap text-base font-bold text-foreground font-body">
                    Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl bg-card p-6 shadow-premium">
              <h2 className="mb-4 text-lg font-bold font-heading">Order Summary</h2>
              <div className="space-y-3 text-sm font-body">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items ({totalItems})</span>
                  <span className="font-medium">Rs. {totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="mt-3 border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-foreground">Total</span>
                    <span className="text-base font-bold text-foreground">Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <Link
                to="/checkout"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/products"
                className="mt-3 flex w-full items-center justify-center text-sm text-muted-foreground transition-colors hover:text-accent font-body"
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
