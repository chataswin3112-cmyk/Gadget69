import { useState, useMemo, type CSSProperties } from "react";
import { useParams, Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, ChevronRight } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import ProductCard from "@/components/storefront/ProductCard";
import ColorSwatchSelector from "@/components/storefront/ColorSwatchSelector";
import MediaFrame from "@/components/storefront/MediaFrame";
import SectionHeader from "@/components/storefront/SectionHeader";
import { useCart } from "@/contexts/CartContext";
import { useAdminData } from "@/contexts/AdminDataContext";
import { uniqueMediaUrls } from "@/lib/media";
import { getDisplayMrp, getEffectivePrice } from "@/lib/pricing";

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { products: allProducts } = useAdminData();
  const product = allProducts.find((p) => p.id === Number(id));

  const variants = product?.variants || [];
  const defaultVariant = variants.find((v) => v.isDefault) || variants[0];

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    defaultVariant?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [mainMedia, setMainMedia] = useState(
    defaultVariant?.images?.[0]?.imageUrl ||
    product?.galleryImages?.[0] ||
    product?.videoUrl ||
    product?.imageUrl ||
    ""
  );

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId),
    [variants, selectedVariantId]
  );

  const relatedProducts = useMemo(
    () =>
      product
        ? allProducts.filter((p) => p.sectionId === product.sectionId && p.id !== product.id).slice(0, 4)
        : [],
    [allProducts, product]
  );

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <div className="section-container section-padding pt-24 text-center">
          <h1 className="font-heading text-3xl font-bold">Product Not Found</h1>
          <Link to="/products" className="text-accent hover:underline mt-4 inline-block font-body">
            ← Back to Products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const allMedia = uniqueMediaUrls([
    ...(selectedVariant?.images?.map((img) => img.imageUrl) || []),
    ...(product.galleryImages || []),
    product.videoUrl,
    product.imageUrl,
  ]);
  const basePrice = getEffectivePrice(product);
  const priceAdj = selectedVariant?.priceAdjustment || 0;
  const finalPrice = basePrice + priceAdj;
  const mrp = getDisplayMrp(product);
  const stock = selectedVariant?.stock ?? product.stockQuantity;
  const sku = selectedVariant?.sku;

  const handleVariantChange = (variantId: number) => {
    setSelectedVariantId(variantId);
    const v = variants.find((vr) => vr.id === variantId);
    if (v?.images?.[0]) {
      setMainMedia(v.images[0].imageUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      {/* Breadcrumb */}
      <div className="section-container pt-6 pb-2">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground font-body">
          <Link to="/" className="hover:text-accent">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/products" className="hover:text-accent">Products</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      {/* Product detail */}
      <div className="section-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div className="enter-slide-in-left">
            <div className="rounded-xl overflow-hidden shadow-premium bg-card">
              <MediaFrame
                src={mainMedia}
                alt={product.name}
                aspectRatio="aspect-square"
                padding="p-8"
                className="bg-secondary/20"
              />
            </div>
            {allMedia.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {allMedia.map((media, i) => (
                  <button
                    key={i}
                    onClick={() => setMainMedia(media)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      mainMedia === media ? "border-accent" : "border-border"
                    }`}
                  >
                    <MediaFrame src={media} alt="" padding="p-1" className="rounded-none" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div
            className="enter-slide-in-right flex flex-col"
            style={{ "--enter-delay": "80ms" } as CSSProperties}
          >
            {product.sectionName && (
              <Link
                to={`/categories/${product.sectionId}`}
                className="text-xs uppercase tracking-[0.2em] text-accent font-medium mb-2 font-body hover:underline"
              >
                {product.sectionName}
              </Link>
            )}
            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-1">
              {product.name}
            </h1>
            {product.model_number && (
              <p className="text-sm text-muted-foreground font-body mb-4">{product.model_number}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-foreground font-body">
                ₹{finalPrice.toLocaleString()}
              </span>
              {mrp && mrp > finalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through font-body">
                    ₹{mrp.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-accent-foreground bg-accent/20 px-2 py-0.5 rounded">
                    {Math.round(((mrp - finalPrice) / mrp) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Variants */}
            {variants.length > 1 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground mb-2 font-body">
                  Color: {selectedVariant?.colorName}
                </p>
                <ColorSwatchSelector
                  variants={variants.map((v) => ({ id: v.id, colorName: v.colorName, hexCode: v.hexCode }))}
                  selectedId={selectedVariantId}
                  onSelect={handleVariantChange}
                />
              </div>
            )}

            {/* Stock & SKU */}
            <div className="flex items-center gap-4 mb-6 text-sm font-body">
              <span className={stock > 0 ? "text-accent" : "text-destructive"}>
                {stock > 0 ? `In Stock (${stock})` : "Out of Stock"}
              </span>
              {sku && <span className="text-muted-foreground">SKU: {sku}</span>}
            </div>

            {/* Description */}
            <p className="text-muted-foreground font-body leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4 mt-auto">
              <div className="flex items-center border border-input rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2.5 hover:bg-secondary transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2.5 font-medium text-sm font-body min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  className="px-3 py-2.5 hover:bg-secondary transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => addToCart(product, quantity)}
                disabled={stock <= 0}
                className="flex-1 flex items-center justify-center gap-2 bg-accent text-accent-foreground px-8 py-3 rounded-lg font-medium transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="h-5 w-5" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="section-container section-padding">
          <SectionHeader title="You May Also Like" viewAllLink={`/categories/${product.sectionId}`} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      <FloatingContactActions />
      <Footer />
    </div>
  );
};

export default ProductDetails;
