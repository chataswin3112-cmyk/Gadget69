import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MediaFrame from "./MediaFrame";
import ColorSwatchSelector from "./ColorSwatchSelector";
import { getDisplayMrp, getShippingLabel, getVariantPrice } from "@/lib/pricing";
import { getPrimaryImageUrl, getProductMedia, getVariantMedia } from "@/lib/catalog-media";
import { getProductCategoryLabel } from "@/lib/category";

interface ProductCardProps {
  product: Product;
  animationPreset?: "product-card-rise" | "product-card-flip";
  className?: string;
  priority?: boolean;
  drift?: {
    x: number;
    y: number;
    strength?: number;
  };
}

const ProductCard = ({ product, animationPreset, className, priority = false, drift }: ProductCardProps) => {
  const { addToCart } = useCart();
  const variants = useMemo(() => product.variants || [], [product.variants]);
  const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    defaultVariant?.id ?? null
  );
  const [addedFlash, setAddedFlash] = useState(false);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId),
    [variants, selectedVariantId]
  );

  const displayImage =
    getPrimaryImageUrl(getVariantMedia(selectedVariant)) || getPrimaryImageUrl(getProductMedia(product));
  const displayPrice = getVariantPrice(product, selectedVariant);
  const mrp = getDisplayMrp(product);
  const discountPct =
    mrp && mrp > displayPrice ? Math.round(((mrp - displayPrice) / mrp) * 100) : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1, selectedVariant);
    toast.success(`${product.name} added to cart`);
    window.dispatchEvent(new Event("open-cart-drawer"));
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 600);
  };

  return (
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-transparent bg-card shadow-premium transition-[box-shadow,border-color,background-color] duration-200 hover:border-[hsl(var(--surface-soft-gold))]/30 hover:shadow-premium-hover",
        className
      )}
      data-animate-card={animationPreset}
      data-drift={drift ? "card" : undefined}
      data-drift-x={drift?.x}
      data-drift-y={drift?.y}
      data-drift-strength={drift?.strength}
    >
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden">
        <MediaFrame
          src={displayImage}
          alt={product.name}
          aspectRatio="aspect-square"
          className="bg-secondary/30"
          padding="p-6"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw"
          optimizeWidth={priority ? 260 : 320}
          optimizeHeight={priority ? 260 : 320}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {product.is_new_launch && (
            <span
              className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full font-body"
              style={{
                background: "linear-gradient(135deg, hsl(38 65% 62%), hsl(38 80% 72%))",
                color: "hsl(20 25% 10%)",
              }}
            >
              New
            </span>
          )}
          {product.is_best_seller && (
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose text-rose-foreground rounded-full font-body">
              Bestseller
            </span>
          )}
          {discountPct && (
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500 text-white rounded-full font-body">
              -{discountPct}%
            </span>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        {product.sectionName && (
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-body">
            {getProductCategoryLabel(product)}
          </p>
        )}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-heading text-base font-semibold text-foreground mb-0.5 group-hover:text-accent transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>
        {product.model_number && (
          <p className="text-xs text-muted-foreground mb-2 font-body">{product.model_number}</p>
        )}
        <p className="mb-2 text-xs font-medium text-accent font-body">
          {getShippingLabel(product)}
        </p>

        {variants.length > 1 && (
          <div className="mb-3">
            <ColorSwatchSelector
              variants={variants.map((v) => ({ id: v.id, colorName: v.colorName, hexCode: v.hexCode }))}
              selectedId={selectedVariantId}
              onSelect={setSelectedVariantId}
            />
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground font-body">
              ₹{displayPrice.toLocaleString()}
            </span>
            {mrp && mrp > displayPrice && (
              <span className="text-xs text-muted-foreground line-through font-body">
                ₹{mrp.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className={cn(
              "rounded-full bg-accent p-2 text-accent-foreground transition-colors duration-200 hover:bg-accent/80",
              addedFlash && "bg-green-500 text-white"
            )}
            aria-label="Add to cart"
          >
            <ShoppingBag className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
