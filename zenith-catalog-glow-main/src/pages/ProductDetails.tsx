import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Minus, Play, Plus, ShoppingBag } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import ProductCard from "@/components/storefront/ProductCard";
import ColorSwatchSelector from "@/components/storefront/ColorSwatchSelector";
import MediaFrame from "@/components/storefront/MediaFrame";
import SectionHeader from "@/components/storefront/SectionHeader";
import DeferredRender from "@/components/ui/deferred-render";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useCart } from "@/contexts/CartContext";
import { useAdminData } from "@/contexts/AdminDataContext";
import { getProductById, getVariant } from "@/api/productApi";
import { getProductMedia, getVariantMedia } from "@/lib/catalog-media";
import { getProductCategoryLabel } from "@/lib/category";
import { getDisplayMrp, getVariantPrice } from "@/lib/pricing";
import { Product, ProductMedia, VariantMedia } from "@/types";
import { scheduleIdleTask } from "@/lib/idle";

const Footer = lazy(() => import("@/components/storefront/Footer"));
const FloatingContactActions = lazy(() => import("@/components/storefront/FloatingContactActions"));

type DisplayMedia = ProductMedia | VariantMedia;

const ProductDetailsSkeleton = () => (
  <div className="min-h-screen bg-background">
    <AnnouncementBar />
    <Navbar />
    <div className="section-container pb-2 pt-6">
      <div className="h-5 w-48 animate-pulse rounded-full bg-secondary/60" />
    </div>
    <div className="section-container py-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="rounded-3xl border border-border bg-card p-4 shadow-premium">
          <div className="aspect-square animate-pulse rounded-2xl bg-secondary/50" />
        </div>
        <div className="space-y-5">
          <div className="h-4 w-28 animate-pulse rounded-full bg-secondary/60" />
          <div className="h-9 w-4/5 animate-pulse rounded-full bg-secondary/60" />
          <div className="h-5 w-32 animate-pulse rounded-full bg-secondary/50" />
          <div className="h-9 w-48 animate-pulse rounded-full bg-secondary/60" />
          <div className="h-5 w-36 animate-pulse rounded-full bg-secondary/50" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded-full bg-secondary/50" />
            <div className="h-4 w-11/12 animate-pulse rounded-full bg-secondary/50" />
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-secondary/50" />
          </div>
          <div className="h-12 w-full animate-pulse rounded-lg bg-secondary/60 sm:w-72" />
        </div>
      </div>
    </div>
  </div>
);

const ProductDetails = () => {
  const { id } = useParams();
  const productId = Number(id);
  const { addToCart } = useCart();
  const { products: allProducts, ensureProductsLoaded } = useAdminData();
  const [remoteProduct, setRemoteProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState(false);
  const cachedProduct = useMemo(
    () => allProducts.find((item) => item.id === productId),
    [allProducts, productId]
  );
  const product = cachedProduct ?? remoteProduct;

  useEffect(() => {
    let cancelled = false;

    if (!Number.isFinite(productId)) {
      setRemoteProduct(null);
      setProductLoading(false);
      setProductError(true);
      return () => {
        cancelled = true;
      };
    }

    if (cachedProduct) {
      setRemoteProduct(cachedProduct);
      setProductLoading(false);
      setProductError(false);
      return () => {
        cancelled = true;
      };
    }

    setProductLoading(true);
    setProductError(false);

    void getProductById(productId)
      .then((data) => {
        if (cancelled) {
          return;
        }
        setRemoteProduct(data);
        setProductLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setRemoteProduct(null);
        setProductLoading(false);
        setProductError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [cachedProduct, productId]);

  useEffect(() => {
    const cancelProductHydration = scheduleIdleTask(() => {
      void ensureProductsLoaded();
    }, 900);

    return cancelProductHydration;
  }, [ensureProductsLoaded]);

  const variants = useMemo(() => product?.variants || [], [product?.variants]);
  const defaultVariant = useMemo(
    () => variants.find((variant) => variant.isDefault) || variants[0],
    [variants]
  );

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(defaultVariant?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [variantMedia, setVariantMedia] = useState<VariantMedia[]>([]);
  const [loadingVariant, setLoadingVariant] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const loadVariantMedia = useCallback(
    async (variantId: number) => {
      const variant = variants.find((item) => item.id === variantId);
      if (variant?.media?.length) {
        setVariantMedia(getVariantMedia(variant));
        setCurrentSlide(0);
        carouselApi?.scrollTo(0);
        return;
      }

      setLoadingVariant(true);
      try {
        const data = await getVariant(variantId);
        setVariantMedia(data.media || []);
        setCurrentSlide(0);
        carouselApi?.scrollTo(0);
      } catch {
        setVariantMedia([]);
      } finally {
        setLoadingVariant(false);
      }
    },
    [carouselApi, variants]
  );

  useEffect(() => {
    if (!product) {
      setSelectedVariantId(null);
      setVariantMedia([]);
      return;
    }

    const variantId = defaultVariant?.id ?? null;
    setSelectedVariantId(variantId);
    if (variantId) {
      void loadVariantMedia(variantId);
    } else {
      setVariantMedia([]);
    }
  }, [defaultVariant, loadVariantMedia, product]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    onSelect();
    carouselApi.on("select", onSelect);
    carouselApi.on("reInit", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId),
    [selectedVariantId, variants]
  );

  const productMedia = useMemo(() => getProductMedia(product), [product]);
  const activeMedia: DisplayMedia[] = variantMedia.length > 0 ? variantMedia : productMedia;
  const finalPrice = product ? getVariantPrice(product, selectedVariant) : 0;
  const mrp = product ? getDisplayMrp(product) : undefined;
  const stock = selectedVariant?.stock ?? product?.stockQuantity ?? 0;
  const sku = selectedVariant?.sku;

  const relatedProducts = useMemo(
    () =>
      product
        ? allProducts.filter((item) => item.sectionId === product.sectionId && item.id !== product.id).slice(0, 4)
        : [],
    [allProducts, product]
  );

  const handleVariantChange = (variantId: number) => {
    setSelectedVariantId(variantId);
    void loadVariantMedia(variantId);
  };

  const handleAddToCart = () => {
    if (!product) {
      return;
    }
    addToCart(product, quantity, selectedVariant);
    window.dispatchEvent(new Event("open-cart-drawer"));
  };

  if (productLoading && !product) {
    return <ProductDetailsSkeleton />;
  }

  if (!product || productError) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <div className="section-container section-padding pt-24 text-center">
          <h1 className="font-heading text-3xl font-bold">Product Not Found</h1>
          <Link to="/products" className="mt-4 inline-block text-accent hover:underline font-body">
            Back to Products
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

      <div className="section-container pb-2 pt-6">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground font-body">
          <Link to="/" className="hover:text-accent">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/products" className="hover:text-accent">
            Products
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          {product.parentSectionId && product.parentSectionName ? (
            <>
              <Link to={`/categories/${product.parentSectionId}`} className="hover:text-accent">
                {product.parentSectionName}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          ) : null}
          {product.sectionName ? (
            <>
              <Link to={`/categories/${product.sectionId}`} className="hover:text-accent">
                {product.sectionName}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          ) : null}
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      <div className="section-container py-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="enter-slide-in-left">
            <div className="relative rounded-3xl border border-border bg-card p-4 shadow-premium">
              {loadingVariant ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-background/60">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : null}

              <Carousel setApi={setCarouselApi} opts={{ loop: activeMedia.length > 1 }}>
                <CarouselContent>
                  {activeMedia.map((media, index) => (
                    <CarouselItem key={`${media.id ?? "fallback"}-${media.mediaUrl}-${index}`}>
                      {media.mediaType === "VIDEO" ? (
                        <video
                          controls
                          preload="metadata"
                          className="aspect-square w-full rounded-2xl bg-black object-contain"
                        >
                          <source src={media.mediaUrl} type="video/mp4" />
                        </video>
                      ) : (
                        <MediaFrame
                          src={media.mediaUrl}
                          alt={`${product.name} ${index + 1}`}
                          aspectRatio="aspect-square"
                          padding="p-8"
                          className="rounded-2xl bg-secondary/20"
                          loading={index === 0 ? "eager" : "lazy"}
                          sizes="(max-width: 640px) 82vw, (max-width: 1024px) 70vw, 50vw"
                          optimizeWidth={520}
                          fetchPriority={index === 0 ? "high" : "low"}
                        />
                      )}
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {activeMedia.length > 1 ? (
                  <>
                    <CarouselPrevious className="left-4 top-1/2 translate-y-[-50%]" />
                    <CarouselNext className="right-4 top-1/2 translate-y-[-50%]" />
                  </>
                ) : null}
              </Carousel>
            </div>

            {activeMedia.length > 1 ? (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {activeMedia.map((media, index) => (
                  <button
                    key={`${media.id ?? "thumb"}-${media.mediaUrl}-${index}`}
                    type="button"
                    onClick={() => {
                      setCurrentSlide(index);
                      carouselApi?.scrollTo(index);
                    }}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                      currentSlide === index ? "border-accent" : "border-border"
                    }`}
                  >
                    {media.mediaType === "VIDEO" ? (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Play className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ) : (
                        <MediaFrame
                          src={media.mediaUrl}
                          alt=""
                          padding="p-1"
                          className="rounded-none"
                          sizes="80px"
                          optimizeWidth={120}
                        />
                    )}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="enter-slide-in-right flex flex-col" style={{ "--enter-delay": "80ms" } as CSSProperties}>
            {product.sectionName ? (
              <Link
                to={`/categories/${product.sectionId}`}
                className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-accent hover:underline font-body"
              >
                {getProductCategoryLabel(product)}
              </Link>
            ) : null}

            <h1 className="mb-1 font-heading text-3xl font-bold text-foreground lg:text-4xl">{product.name}</h1>
            {product.model_number ? (
              <p className="mb-4 text-sm text-muted-foreground font-body">{product.model_number}</p>
            ) : null}

            <div className="mb-6 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground font-body">Rs. {finalPrice.toLocaleString()}</span>
              {mrp && mrp > finalPrice ? (
                <>
                  <span className="text-lg line-through text-muted-foreground font-body">Rs. {mrp.toLocaleString()}</span>
                  <span className="rounded bg-accent/20 px-2 py-0.5 text-sm font-medium text-accent-foreground">
                    {Math.round(((mrp - finalPrice) / mrp) * 100)}% OFF
                  </span>
                </>
              ) : null}
            </div>

            {variants.length > 0 ? (
              <div className="mb-6 space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground font-body">
                    Color: <span className="text-accent">{selectedVariant?.colorName}</span>
                  </p>
                  <ColorSwatchSelector
                    variants={variants.map((variant) => ({
                      id: variant.id,
                      colorName: variant.colorName,
                      hexCode: variant.hexCode,
                    }))}
                    selectedId={selectedVariantId}
                    onSelect={handleVariantChange}
                  />
                </div>

                {variants.some((variant) => variant.size) ? (
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground font-body">Size</p>
                    <div className="flex flex-wrap gap-2">
                      {variants
                        .filter((variant) => variant.size)
                        .map((variant) => (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => handleVariantChange(variant.id)}
                            disabled={variant.stock === 0}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                              selectedVariantId === variant.id
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-muted-foreground hover:border-accent/50"
                            } ${variant.stock === 0 ? "cursor-not-allowed opacity-40" : ""}`}
                          >
                            {variant.size}
                          </button>
                        ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mb-6 flex items-center gap-4 text-sm font-body">
              <span className={stock > 0 ? "text-accent" : "text-destructive"}>
                {stock > 0 ? `In Stock (${stock})` : "Out of Stock"}
              </span>
              {sku ? <span className="text-muted-foreground">SKU: {sku}</span> : null}
            </div>

            <p className="mb-8 whitespace-pre-wrap text-muted-foreground font-body leading-relaxed">
              {product.description}
            </p>

            {product.specifications && Object.keys(product.specifications).length > 0 ? (
              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-foreground font-heading">Specifications</h3>
                <div className="flex flex-col overflow-hidden rounded-lg border border-border text-sm font-body">
                  {Object.entries(product.specifications).map(([key, value], index) => (
                    <div
                      key={key}
                      className={`flex flex-col gap-1 border-b border-border px-4 py-3 last:border-b-0 sm:flex-row sm:gap-0 ${
                        index % 2 === 0 ? "bg-muted/30" : "bg-card"
                      }`}
                    >
                      <span className="shrink-0 font-medium text-muted-foreground sm:w-1/3">{key}</span>
                      <span className="break-words text-foreground sm:w-2/3">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-center rounded-lg border border-input">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="px-3 py-2.5 hover:bg-secondary transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[3rem] px-4 py-2.5 text-center text-sm font-medium font-body">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.min(stock, current + 1))}
                  className="px-3 py-2.5 hover:bg-secondary transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={stock <= 0}
                data-testid="product-details-add-to-cart"
                className="flex min-w-[160px] w-full flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <ShoppingBag className="h-5 w-5" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 ? (
        <DeferredRender
          rootMargin="720px 0px"
          placeholder={<div className="min-h-[440px]" aria-hidden="true" />}
        >
          <div className="section-container section-padding">
            <SectionHeader title="You May Also Like" viewAllLink={`/categories/${product.sectionId}`} />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        </DeferredRender>
      ) : null}

      <DeferredRender
        rootMargin="900px 0px"
        placeholder={<div className="min-h-[1px]" aria-hidden="true" />}
      >
        <Suspense fallback={null}>
          <FloatingContactActions />
        </Suspense>
      </DeferredRender>
      <DeferredRender
        rootMargin="900px 0px"
        placeholder={<div className="min-h-[560px]" aria-hidden="true" />}
      >
        <Suspense fallback={<div className="min-h-[560px]" aria-hidden="true" />}>
          <Footer />
        </Suspense>
      </DeferredRender>
    </div>
  );
};

export default ProductDetails;
