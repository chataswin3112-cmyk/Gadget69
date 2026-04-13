import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import MediaImage from "@/components/ui/media-image";
import { getEffectivePrice } from "@/lib/pricing";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, updateQuantity, removeFromCart, totalItems, totalAmount } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-body">Your cart is empty</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)} asChild>
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {items.map((item) => {
                const price = getEffectivePrice(item.product);
                return (
                  <div key={item.product.id} className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                    <MediaImage
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-md object-contain bg-muted"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium font-heading truncate">{item.product.name}</h4>
                      <p className="text-sm font-bold font-body mt-1">₹{price.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 rounded bg-muted hover:bg-accent/20 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center font-body">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 rounded bg-muted hover:bg-accent/20 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-auto p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
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
              <div className="flex justify-between w-full text-base font-body">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} asChild>
                  <Link to="/cart">View Cart</Link>
                </Button>
                <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => onOpenChange(false)} asChild>
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
