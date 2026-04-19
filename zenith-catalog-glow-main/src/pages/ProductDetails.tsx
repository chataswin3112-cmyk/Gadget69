import { useEffect, useState, useMemo, useCallback, type CSSProperties } from "react";
import { useParams, Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, ChevronRight, Play } from "lucide-react";
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
import { getVariant } from "@/api/productApi";
import { VariantMedia } from "@/types";

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { products: allProducts, isLoading } = useAdminData();
  const product = allProducts.find((p) => p.id === Number(id));

  const variants = useMemo(() => product?.variants || [], [product?.variants]);
  const defaultVariant = useMemo(
    () => variants.find((variant) => variant.isDefault) || variants[0],
    [variants]
  );

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainMediaIndex, setMainMediaIndex] = useState(0);
  const [variantMedia, setVariantMedia] = useState<VariantMedia[]>([]);
  const [loadingVariant, setLoadingVariant] = useState(false);

  // Build fallback media from product fields
  const fallbackMediaUrls = useMemo(() => {
    if (!product) return [];
    return uniqueMediaUrls([
      ...(product.galleryImages || []),
      product.videoUrl,
      product.imageUrl,
    ]).map((url) => ({ id: 0, mediaUrl: url, mediaType: "IMAGE" as const, displayOrder: 0, isPrimary: false }));
  }, [product]);

  const loadVariantMedia = useCallback(async (variantId: number) => {
    const variant = variants.find((v) => v.id === variantId);
    // If variant has media pre-loaded, use it directly
    if (variant?.media && variant.media.length > 0) {
      setVariantMedia(variant.media);
      setMainMediaIndex(0);
      return;
    }
    // Otherwise fetch from API
    setLoadingVariant(true);
    try {
      const data = await getVariant(variantId);
      setVariantMedia(data.media || []);
      setMainMediaIndex(0);
    } catch {
      setVariantMedia([]);
    } finally {
      setLoadingVariant(false);
    }
  }, [variants]);

  useEffect(() => {
    if (!product) {
      setSelectedVariantId(null);
      setVariantMedia([]);
      return;
    }
    const vid = defaultVariant?.id ?? null;
    setSelectedVariantId(vid);
    if (vid) {
      void loadVariantMedia(vid);
    }
  }, [defaultVariant, product, loadVariantMedia]);

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

  const handleVariantChange = (variantId: number) => {
    setSelectedVariantId(variantId);
    void loadVariantMedia(variantId);
  };

  // Price: use variant's own price if set, else base price + adjustment
  const basePrice = getEffectivePrice(product);
  const finalPrice = selectedVariant?.price
    ? Number(selectedVariant.price)
    : basePrice + (selectedVariant?.priceAdjustment || 0);
  const mrp = getDisplayMrp(product);
  const stock = selectedVariant?.stock ?? product.stockQuantity;
  const sku = selectedVariant?.sku;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

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

  // Current media items — prefer variant media, fall back to product-level gallery
  const activeMedia: VariantMedia[] = variantMedia.length > 0 ? variantMedia : fallbackMediaUrls;
  const mainMediaItem = activeMedia[mainMediaIndex] ?? activeMedia[0] ?? null;

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
          {/* Gallery — variant media-aware with IMAGE/VIDEO support */}
          <div className="enter-slide-in-left">
            {/* Main Media */}
            <div className="relative rounded-xl overflow-hidden shadow-premium bg-card">
              {loadingVariant && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
                  <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                </div>
              )}
              {mainMediaItem?.mediaType === "VIDEO" ? (
                <video
                  key={mainMediaItem.mediaUrl}
                  src={mainMediaItem.mediaUrl}
                  controls
                  className="w-full aspect-square object-contain bg-black"
                />
              ) : (
                <MediaFrame
                  src={mainMediaItem?.mediaUrl || product.imageUrl}
                  alt={product.name}
                  aspectRatio="aspect-square"
                  padding="p-8"
                  className="bg-secondary/20"
                  loading="eager"
                />
              )}
            </div>

            {/* Thumbnail Strip */}
            {activeMedia.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {activeMedia.map((item, i) => (
                  <button
                    key={item.id ? `${item.id}-${i}` : i}
                    onClick={() => setMainMediaIndex(i)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      mainMediaIndex === i ? "border-accent" : "border-border"
                    }`}
                  >
                    {item.mediaType === "VIDEO" ? (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Play className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ) : (
                      <MediaFrame src={item.mediaUrl} alt="" padding="p-1" className="rounded-none" />
                    )}
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

            {/* Variants — Color + Size selectors */}
            {variants.length > 0 && (
              <div className="mb-6 space-y-4">
                {variants.some((v) => v.colorName) && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2 font-body">
                      Color: <span className="text-accent">{selectedVariant?.colorName}</span>
                    </p>
                    <ColorSwatchSelector
                      variants={variants.map((v) => ({ id: v.id, colorName: v.colorName, hexCode: v.hexCode }))}
                      selectedId={selectedVariantId}
                      onSelect={handleVariantChange}
                    />
                  </div>
                )}
                {/* Size selector — shown only if any variant has a size */}
                {variants.some((v) => v.size) && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2 font-body">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {variants
                        .filter((v) => v.size)
                        .map((v) => (
                          <button
                            key={v.id}
                            onClick={() => handleVariantChange(v.id)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                              selectedVariantId === v.id
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-muted-foreground hover:border-accent/50"
                            } ${v.stock === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                            disabled={v.stock === 0}
                          >
                            {v.size}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
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
            <p className="text-muted-foreground font-body leading-relaxed mb-8 whitespace-pre-wrap">
              {product.description}
            </p>

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mb-8">
                <h3 className="font-heading font-semibold text-lg mb-4 text-foreground">Specifications</h3>
                <div className="border border-border rounded-lg overflow-hidden flex flex-col font-body text-sm">
                  {Object.entries(product.specifications).map(([key, value], index) => (
                    <div
                      key={key}
                      className={`flex px-4 py-3 ${
                        index % 2 === 0 ? "bg-muted/30" : "bg-card"
                      } border-b border-border last:border-b-0`}
                    >
                      <span className="w-1/3 font-medium text-muted-foreground shrink-0">{key}</span>
                      <span className="w-2/3 text-foreground break-words">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex flex-wrap items-center gap-3 mt-auto">
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
                className="flex-1 min-w-[160px] flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg font-medium transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
