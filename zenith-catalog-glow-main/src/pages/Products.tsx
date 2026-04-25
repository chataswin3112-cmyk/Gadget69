import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import ProductCard from "@/components/storefront/ProductCard";
import SectionHeader from "@/components/storefront/SectionHeader";
import DeferredRender from "@/components/ui/deferred-render";
import { useAdminData } from "@/contexts/AdminDataContext";
import { scheduleAfterPaint, scheduleIdleTask } from "@/lib/idle";

const Footer = lazy(() => import("@/components/storefront/Footer"));
const FloatingContactActions = lazy(() => import("@/components/storefront/FloatingContactActions"));

const filterTabs = [
  { key: "all", label: "All Products" },
  { key: "new", label: "New Launches" },
  { key: "best", label: "Best Sellers" },
];

const sortOptions = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "name", label: "Name A-Z" },
];

const INITIAL_VISIBLE_PRODUCTS = 12;

const Products = () => {
  const {
    products: allProducts,
    sections,
    ensureProductsLoaded,
    ensureSectionsLoaded,
    isLoading,
  } = useAdminData();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("filter") || "all";

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);
  const [initialProductsLoaded, setInitialProductsLoaded] = useState(allProducts.length > 0);

  const deferredSearch = useDeferredValue(search);
  const deferredSortBy = useDeferredValue(sortBy);
  const deferredCategoryFilter = useDeferredValue(categoryFilter);

  useEffect(() => {
    let cancelled = false;
    let cancelIdleSectionLoad = () => {};
    const cancelProductLoad = scheduleAfterPaint(() => {
      void Promise.resolve(ensureProductsLoaded()).finally(() => {
        if (!cancelled) {
          setInitialProductsLoaded(true);
        }
      });
      cancelIdleSectionLoad = scheduleIdleTask(() => {
        void ensureSectionsLoaded();
      }, 1000);
    }, 50);

    return () => {
      cancelled = true;
      cancelProductLoad();
      cancelIdleSectionLoad();
    };
  }, [ensureProductsLoaded, ensureSectionsLoaded]);

  useEffect(() => {
    if (allProducts.length > 0) {
      setInitialProductsLoaded(true);
    }
  }, [allProducts.length]);

  const filtered = useMemo(() => {
    let products = [...allProducts];

    if (activeFilter === "new") {
      products = products.filter((product) => product.is_new_launch);
    } else if (activeFilter === "best") {
      products = products.filter((product) => product.is_best_seller);
    }

    if (deferredCategoryFilter !== "all") {
      products = products.filter((product) => product.sectionId === Number(deferredCategoryFilter));
    }

    if (deferredSearch.trim()) {
      const query = deferredSearch.toLowerCase();
      products = products.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.model_number?.toLowerCase().includes(query) ||
          product.sectionName?.toLowerCase().includes(query)
      );
    }

    switch (deferredSortBy) {
      case "price-asc":
        products.sort((left, right) => left.price - right.price);
        break;
      case "price-desc":
        products.sort((left, right) => right.price - left.price);
        break;
      case "name":
        products.sort((left, right) => left.name.localeCompare(right.name));
        break;
      default:
        products.sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
    }

    return products;
  }, [activeFilter, allProducts, deferredCategoryFilter, deferredSearch, deferredSortBy]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
  }, [activeFilter, deferredCategoryFilter, deferredSearch, deferredSortBy]);

  const visibleProducts = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );
  const hasMoreProducts = visibleCount < filtered.length;
  const showInitialSkeleton = !initialProductsLoaded && allProducts.length === 0;

  const handleFilterChange = (key: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (key === "all") {
      nextSearchParams.delete("filter");
    } else {
      nextSearchParams.set("filter", key);
    }

    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="section-container pt-8 pb-4">
        <SectionHeader
          title="Products"
          subtitle={showInitialSkeleton ? "Loading products" : `${filtered.length} products`}
        />

        <div className="mb-6 flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-input bg-card py-2.5 pl-10 pr-4 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-body"
          >
            <option value="all">All Categories</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-body"
          >
            {sortOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="section-container pb-16">
        {showInitialSkeleton || (isLoading && allProducts.length === 0) ? (
          <div className="grid grid-cols-2 gap-4 md:gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-[0.78] animate-pulse rounded-2xl bg-secondary/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-body text-muted-foreground">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="enter-fade-up"
                  style={
                    {
                      "--enter-delay": `${Math.min(index * 30, 180)}ms`,
                    } as CSSProperties
                  }
                >
                  <ProductCard product={product} priority={index < 2} />
                </div>
              ))}
            </div>

            {hasMoreProducts ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((current) => current + INITIAL_VISIBLE_PRODUCTS)}
                  className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:text-accent"
                >
                  Load More Products
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

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
        placeholder={<div className="min-h-[960px]" aria-hidden="true" />}
      >
        <Suspense fallback={<div className="min-h-[960px]" aria-hidden="true" />}>
          <Footer />
        </Suspense>
      </DeferredRender>
    </div>
  );
};

export default Products;
