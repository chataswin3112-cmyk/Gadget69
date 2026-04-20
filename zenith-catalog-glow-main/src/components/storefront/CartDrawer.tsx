import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import MediaImage from "@/components/ui/media-image";
import { useCart } from "@/contexts/CartContext";
import { describeVariant } from "@/lib/catalog-media";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, updateQuantity, removeFromCart, totalItems, totalAmount } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-heading">
            <ShoppingBag className="h-5 w-5" />
            Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground font-body">Your cart is empty</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)} asChild>
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto py-4">
              {items.map((item) => {
                const variantLabel = describeVariant(item.variantColor, item.variantSize);

                return (
                  <div key={item.lineId} className="flex gap-3 rounded-lg bg-secondary/30 p-3">
                    <MediaImage
                      src={item.mediaUrl || item.product.imageUrl}
                      alt={item.product.name}
                      className="h-16 w-16 rounded-md bg-muted object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium font-heading">{item.product.name}</h4>
                      {variantLabel ? (
                        <p className="mt-0.5 text-xs text-muted-foreground font-body">{variantLabel}</p>
                      ) : null}
                      <p className="mt-1 text-sm font-bold font-body">Rs. {item.unitPrice.toLocaleString()}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                          className="rounded bg-muted p-1 transition-colors hover:bg-accent/20"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium font-body">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                          className="rounded bg-muted p-1 transition-colors hover:bg-accent/20"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.lineId)}
                          className="ml-auto rounded p-1 text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <SheetFooter className="flex-col gap-3 border-t pt-4">
              <div className="flex w-full justify-between text-base font-body">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">Rs. {totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} asChild>
                  <Link to="/cart">View Cart</Link>
                </Button>
                <Button
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => onOpenChange(false)}
                  asChild
                >
                  <Link to="/checkout">Checkout</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
