import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { CartItem, Product, ProductVariant } from "@/types";
import { useAdminData } from "@/contexts/AdminDataContext";
import { getCartLineId, getPrimaryImageUrl, getProductMedia, getVariantMedia } from "@/lib/catalog-media";
import { scheduleIdleTask } from "@/lib/idle";
import { getShippingCharge, getVariantPrice } from "@/lib/pricing";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, qty?: number, variant?: ProductVariant | null) => void;
  removeFromCart: (lineId: string) => void;
  updateQuantity: (lineId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotalAmount: number;
  shippingAmount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "mzflow_cart";

const clampQuantity = (qty: number, maxStock?: number | null) =>
  typeof maxStock === "number" && maxStock > 0 ? Math.min(qty, maxStock) : qty;

const areCartItemsEqual = (current: CartItem[], next: CartItem[]) =>
  current.length === next.length &&
  current.every((item, index) => {
    const candidate = next[index];
    return (
      candidate != null &&
      item.lineId === candidate.lineId &&
      item.quantity === candidate.quantity &&
      item.unitPrice === candidate.unitPrice &&
      item.mediaUrl === candidate.mediaUrl &&
      item.variantId === candidate.variantId &&
      item.product.id === candidate.product.id &&
      getShippingCharge(item.product) === getShippingCharge(candidate.product)
    );
  });

const hydrateCartItem = (product: Product, variantId?: number): CartItem => {
  const selectedVariant = product.variants?.find((variant) => variant.id === variantId);
  const lineId = getCartLineId(product.id, selectedVariant?.id);
  const mediaUrl = getPrimaryImageUrl(getVariantMedia(selectedVariant)) || getPrimaryImageUrl(getProductMedia(product));

  return {
    lineId,
    product,
    quantity: 1,
    variantId: selectedVariant?.id,
    selectedVariantId: selectedVariant?.id,
    variantColor: selectedVariant?.colorName,
    variantSize: selectedVariant?.size,
    unitPrice: getVariantPrice(product, selectedVariant),
    mediaUrl,
  };
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const { products, isLoading, ensureProductsLoaded } = useAdminData();

  useEffect(() => {
    const cancelPersist = scheduleIdleTask(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, 500);

    return cancelPersist;
  }, [items]);

  const addToCart = useCallback((product: Product, qty = 1, variant?: ProductVariant | null) => {
    const nextItem = hydrateCartItem(product, variant?.id);
    const maxStock = variant?.stock ?? product.stockQuantity;

    setItems((current) => {
      const existing = current.find((item) => item.lineId === nextItem.lineId);
      if (existing) {
        return current.map((item) =>
          item.lineId === nextItem.lineId
            ? { ...item, quantity: clampQuantity(item.quantity + qty, maxStock) }
            : item
        );
      }
      return [...current, { ...nextItem, quantity: clampQuantity(qty, maxStock) }];
    });
  }, []);

  const removeFromCart = useCallback((lineId: string) => {
    setItems((current) => current.filter((item) => item.lineId !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId: string, qty: number) => {
    if (qty <= 0) {
      setItems((current) => current.filter((item) => item.lineId !== lineId));
      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (item.lineId !== lineId) {
          return item;
        }
        const variant = item.variantId
          ? item.product.variants?.find((candidate) => candidate.id === item.variantId)
          : undefined;
        const maxStock = variant?.stock ?? item.product.stockQuantity;
        return { ...item, quantity: clampQuantity(qty, maxStock) };
      })
    );
  }, []);

  useEffect(() => {
    if (isLoading || items.length === 0) {
      return;
    }

    setItems((current) => {
      const nextItems = current.flatMap((item) => {
        const product = products.find((candidate) => candidate.id === item.product.id && candidate.status !== "INACTIVE");
        if (!product) {
          return [];
        }

        const selectedVariant = item.variantId
          ? product.variants?.find((variant) => variant.id === item.variantId)
          : undefined;
        const rehydrated = hydrateCartItem(product, selectedVariant?.id);
        return [
          {
            ...item,
            ...rehydrated,
            quantity: item.quantity,
          },
        ];
      });

      return areCartItemsEqual(current, nextItems) ? current : nextItems;
    });
  }, [isLoading, items.length, products]);

  useEffect(() => {
    const needsCatalogHydration =
      location.pathname === "/cart" || location.pathname === "/checkout";

    if (!needsCatalogHydration || items.length === 0 || products.length > 0) {
      return;
    }

    void ensureProductsLoaded();
  }, [ensureProductsLoaded, items.length, location.pathname, products.length]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );
  const shippingAmount = useMemo(
    () => items.reduce((sum, item) => sum + getShippingCharge(item.product) * item.quantity, 0),
    [items]
  );
  const totalAmount = subtotalAmount + shippingAmount;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotalAmount,
        shippingAmount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
