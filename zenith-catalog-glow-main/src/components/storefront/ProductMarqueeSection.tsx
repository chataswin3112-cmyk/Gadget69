import { Link } from "react-router-dom";
import { useAdminData } from "@/contexts/AdminDataContext";
import { mockProducts } from "@/data/mockData";
import MediaImage from "@/components/ui/media-image";
import { getEffectivePrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const ProductMarqueeSection = () => {
  const { products: adminProducts } = useAdminData();
  const products = adminProducts.length ? adminProducts : mockProducts;
  if (!products.length) return null;

  // Shuffle for variety and fill two independent rows
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  const rowA = [...shuffled, ...shuffled]; // duplicate for seamless loop
  const rowB = [...shuffled.reverse(), ...shuffled]; // reverse order for row B

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

      {/* Row 1 — scrolls left slowly */}
      <div className="mb-4 flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex animate-product-left gap-4 will-change-transform group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
          {rowA.map((product, i) => (
            <ProductCard key={`a-${product.id}-${i}`} product={product} />
          ))}
        </div>
      </div>

      {/* Row 2 — scrolls right slowly */}
      <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex animate-product-right gap-4 will-change-transform group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
          {rowB.map((product, i) => (
            <ProductCard key={`b-${product.id}-${i}`} product={product} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 flex justify-center">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-all duration-300 hover:bg-foreground/85 hover:scale-[1.03] hover:shadow-lg font-heading"
        >
          View All Products →
        </Link>
      </div>
    </section>
  );
};

const ProductCard = ({ product }: { product: (typeof mockProducts)[number] }) => {
  const price = getEffectivePrice(product);
  const hasOffer = product.offer && product.offerPrice;

  return (
    <Link
      to={`/products/${product.id}`}
      className={cn(
        "group flex-shrink-0 w-[200px] md:w-[220px] overflow-hidden rounded-[20px]",
        "border border-white/70 bg-white/90 shadow-[0_12px_32px_-18px_hsl(var(--surface-shadow)/0.22)]",
        "transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-20px_hsl(var(--surface-shadow)/0.30)]"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary/10">
        <MediaImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hasOffer && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
            Sale
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="truncate text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground font-body">
          {product.sectionName}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground font-heading leading-tight">
          {product.name}
        </p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-foreground font-body">
            ₹{price.toLocaleString()}
          </span>
          {product.mrp && product.mrp > price && (
            <span className="text-xs text-muted-foreground line-through font-body">
              ₹{product.mrp.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductMarqueeSection;
