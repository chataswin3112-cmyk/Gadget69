import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAdminData } from "@/contexts/AdminDataContext";
import MediaImage from "@/components/ui/media-image";
import { getEffectivePrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { Product } from "@/types";

const ProductMarqueeSection = () => {
  const { products } = useAdminData();

  const marqueeProducts = useMemo(
    () => products.slice(0, Math.min(products.length, 8)),
    [products]
  );
  const mobileProducts = useMemo(() => marqueeProducts.slice(0, 6), [marqueeProducts]);
  const rowA = useMemo(() => [...marqueeProducts, ...marqueeProducts], [marqueeProducts]);
  const rowB = useMemo(() => {
    const reversed = [...marqueeProducts].reverse();
    return [...reversed, ...reversed];
  }, [marqueeProducts]);

  if (!marqueeProducts.length) {
    return null;
  }

  return (
    <section className="section-padding overflow-hidden group">
      <div className="section-container mb-8">
        <div className="flex flex-col items-center text-center">
          <p className="mb-2 font-body text-xs font-medium uppercase tracking-[0.22em] text-accent">
            Our Catalogue
          </p>
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Browse All Products
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Premium electronics crafted for everyone.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 sm:hidden">
        {mobileProducts.map((product) => (
          <CompactProductCard key={`mobile-${product.id}`} product={product} />
        ))}
      </div>

      <div className="mb-4 hidden overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] sm:flex">
        <div className="flex animate-product-left gap-4 will-change-transform group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
          {rowA.map((product, index) => (
            <CompactProductCard key={`a-${product.id}-${index}`} product={product} />
          ))}
        </div>
      </div>

      <div className="hidden overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] sm:flex">
        <div className="flex animate-product-right gap-4 will-change-transform group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
          {rowB.map((product, index) => (
            <CompactProductCard key={`b-${product.id}-${index}`} product={product} />
          ))}
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-all duration-300 hover:scale-[1.03] hover:bg-foreground/85 hover:shadow-lg font-heading"
        >
          View All Products →
        </Link>
      </div>
    </section>
  );
};

const CompactProductCard = ({ product }: { product: Product }) => {
  const price = getEffectivePrice(product);
  const hasOffer = product.offer && product.offerPrice;

  return (
    <Link
      to={`/products/${product.id}`}
      className={cn(
        "group w-full flex-shrink-0 overflow-hidden rounded-[20px]",
        "border border-white/70 bg-white/90 shadow-[0_12px_32px_-18px_hsl(var(--surface-shadow)/0.22)]",
        "transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-20px_hsl(var(--surface-shadow)/0.30)] sm:w-[200px] md:w-[220px]"
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-secondary/10">
        <MediaImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {hasOffer && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
            Sale
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground font-body">
          {product.sectionName}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold leading-tight text-foreground font-heading">
          {product.name}
        </p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-foreground font-body">
            ₹{price.toLocaleString()}
          </span>
          {product.mrp && product.mrp > price && (
            <span className="text-xs line-through text-muted-foreground font-body">
              ₹{product.mrp.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductMarqueeSection;
