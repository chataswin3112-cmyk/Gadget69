import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import HeroSlider from "@/components/storefront/HeroSlider";
import ProductSectionRow from "@/components/storefront/ProductSectionRow";
import { useAdminData } from "@/contexts/AdminDataContext";
import { SECTION_BG_COLORS } from "@/hooks/useScrollBgColor";
import CategoryRail from "@/components/storefront/CategoryRail";
import DeferredRender from "@/components/ui/deferred-render";

const TopCategoryGrid = lazy(() => import("@/components/storefront/TopCategoryGrid"));
const ProductMarqueeSection = lazy(() => import("@/components/storefront/ProductMarqueeSection"));
const FloatingContactActions = lazy(() => import("@/components/storefront/FloatingContactActions"));
const CommunitySection = lazy(() => import("@/components/storefront/CommunitySection"));
const ReviewSection = lazy(() => import("@/components/storefront/ReviewSection"));
const Footer = lazy(() => import("@/components/storefront/Footer"));

const rowSurfaceTones = ["mist", "ivory", "paper"] as const;

const SectionPlaceholder = ({ minHeight }: { minHeight: number }) => (
  <div className="section-padding" aria-hidden="true">
    <div className="section-container">
      <div
        className="rounded-[28px] border border-border/55 bg-white/45"
        style={{ minHeight }}
      />
    </div>
  </div>
);

const Index = () => {
  const {
    sections,
    products,
    banners,
    ensureCommunityMediaLoaded,
    ensureReviewsLoaded,
    ensureStorefrontBootstrapLoaded,
  } = useAdminData();
  const [communityVisible, setCommunityVisible] = useState(false);
  const [communityReady, setCommunityReady] = useState(false);
  const [reviewsVisible, setReviewsVisible] = useState(false);
  const [reviewsReady, setReviewsReady] = useState(false);

  useEffect(() => {
    void ensureStorefrontBootstrapLoaded();
  }, [ensureStorefrontBootstrapLoaded]);

  useEffect(() => {
    if (!communityVisible || communityReady) {
      return;
    }

    let cancelled = false;
    void ensureCommunityMediaLoaded()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setCommunityReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [communityReady, communityVisible, ensureCommunityMediaLoaded]);

  useEffect(() => {
    if (!reviewsVisible || reviewsReady) {
      return;
    }

    let cancelled = false;
    void ensureReviewsLoaded()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setReviewsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ensureReviewsLoaded, reviewsReady, reviewsVisible]);

  const newLaunches = useMemo(
    () => products.filter((product) => product.is_new_launch),
    [products]
  );

  const productsBySection = useMemo(() => {
    return products.reduce<Map<number, typeof products>>((accumulator, product) => {
      const currentProducts = accumulator.get(product.sectionId);
      if (currentProducts) {
        currentProducts.push(product);
      } else {
        accumulator.set(product.sectionId, [product]);
      }
      return accumulator;
    }, new Map());
  }, [products]);

  const categoryRows = useMemo(() => {
    const activeSections = sections.filter((section) => section.is_active !== false);
    return activeSections
      .map((section, index) => ({
        section,
        products: productsBySection.get(section.id) ?? [],
        surfaceTone: rowSurfaceTones[index % rowSurfaceTones.length],
        bgColor: SECTION_BG_COLORS[index % SECTION_BG_COLORS.length],
      }))
      .filter((row) => row.products.length > 0);
  }, [productsBySection, sections]);

  const showcaseCategoryRows = useMemo(
    () => categoryRows.filter((row) => row.products.length >= 2),
    [categoryRows]
  );

  const featuredCategoryProducts = useMemo(
    () =>
      categoryRows
        .filter((row) => row.products.length === 1)
        .map((row) => row.products[0]),
    [categoryRows]
  );

  const featuredCategoryRows = showcaseCategoryRows.slice(0, 2);
  const deferredCategoryRows = showcaseCategoryRows.slice(2);

  return (
    <div className="min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <main id="main-content" tabIndex={-1}>
        <h1 className="sr-only">Gadget69 premium electronics catalog</h1>

        <div data-bg-color="#fefce8">
          {banners.length ? <HeroSlider /> : <div className="home-hero" aria-hidden="true" />}
        </div>

        <div data-bg-color="#dbeafe">
          {sections.length ? <CategoryRail sections={sections} /> : <SectionPlaceholder minHeight={360} />}
        </div>

        <div data-bg-color="#ffedd5">
          <DeferredRender
            rootMargin="280px 0px"
            placeholder={<SectionPlaceholder minHeight={420} />}
          >
            <Suspense fallback={<SectionPlaceholder minHeight={420} />}>
              <ProductMarqueeSection />
            </Suspense>
          </DeferredRender>
        </div>

        <div data-bg-color="#e0f2fe">
          {products.length ? (
            <ProductSectionRow
              label="Just Arrived"
              title="New Launches"
              products={newLaunches}
              viewAllLink="/products?filter=new"
              animateDir="up"
              surfaceTone="paper"
            />
          ) : (
            <SectionPlaceholder minHeight={520} />
          )}
        </div>

        <div data-bg-color="#f3e8ff">
          <DeferredRender
            rootMargin="280px 0px"
            placeholder={<SectionPlaceholder minHeight={520} />}
          >
            <Suspense fallback={<SectionPlaceholder minHeight={520} />}>
              <TopCategoryGrid sections={sections} />
            </Suspense>
          </DeferredRender>
        </div>

        {featuredCategoryProducts.length > 0 ? (
          <div data-bg-color="#ede9fe">
            <ProductSectionRow
              label="Curated"
              title="Featured Picks"
              products={featuredCategoryProducts}
              viewAllLink="/products"
              animateDir="up"
              surfaceTone="mist"
            />
          </div>
        ) : null}

        {featuredCategoryRows.map(({ section, products: rowProducts, surfaceTone, bgColor }, index) => (
          <div key={section.id} data-bg-color={bgColor}>
            <DeferredRender
              rootMargin="220px 0px"
              placeholder={<SectionPlaceholder minHeight={620} />}
            >
              <ProductSectionRow
                label={section.name}
                title={section.name}
                products={rowProducts}
                viewAllLink={`/categories/${section.id}`}
                animateDir={index % 2 === 0 ? "left" : "right"}
                surfaceTone={surfaceTone}
              />
            </DeferredRender>
          </div>
        ))}

        {deferredCategoryRows.map(({ section, products: rowProducts, surfaceTone, bgColor }, index) => (
          <div key={section.id} data-bg-color={bgColor}>
            <DeferredRender
              rootMargin="220px 0px"
              placeholder={<SectionPlaceholder minHeight={620} />}
            >
              <ProductSectionRow
                label={section.name}
                title={section.name}
                products={rowProducts}
                viewAllLink={`/categories/${section.id}`}
                animateDir={index % 2 === 0 ? "left" : "right"}
                surfaceTone={surfaceTone}
              />
            </DeferredRender>
          </div>
        ))}

        <div data-bg-color="#dcfce7">
          <DeferredRender
            rootMargin="360px 0px"
            onVisible={() => setCommunityVisible(true)}
            placeholder={<SectionPlaceholder minHeight={880} />}
          >
            {communityReady ? (
              <Suspense fallback={<SectionPlaceholder minHeight={880} />}>
                <CommunitySection />
              </Suspense>
            ) : (
              <SectionPlaceholder minHeight={880} />
            )}
          </DeferredRender>
        </div>

        <div data-bg-color="#fce7f3">
          <DeferredRender
            rootMargin="360px 0px"
            onVisible={() => setReviewsVisible(true)}
            placeholder={<SectionPlaceholder minHeight={720} />}
          >
            {reviewsReady ? (
              <Suspense fallback={<SectionPlaceholder minHeight={720} />}>
                <ReviewSection />
              </Suspense>
            ) : (
              <SectionPlaceholder minHeight={720} />
            )}
          </DeferredRender>
        </div>
      </main>

      <div data-bg-color="#fed7aa">
        <DeferredRender rootMargin="240px 0px">
          <Suspense fallback={null}>
            <FloatingContactActions />
          </Suspense>
        </DeferredRender>
      </div>

      <div data-bg-color="#dbeafe">
        <DeferredRender
          rootMargin="480px 0px"
          placeholder={<SectionPlaceholder minHeight={360} />}
        >
          <Suspense fallback={<SectionPlaceholder minHeight={360} />}>
            <Footer />
          </Suspense>
        </DeferredRender>
      </div>
    </div>
  );
};

export default Index;
