import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import HeroSlider from "@/components/storefront/HeroSlider";
import ProductSectionRow from "@/components/storefront/ProductSectionRow";
import DeferredRender from "@/components/ui/deferred-render";
import { useAdminData } from "@/contexts/AdminDataContext";
import { useScrollAnimations } from "@/hooks/useScrollAnimations";
import { useScrollBgColor, SECTION_BG_COLORS } from "@/hooks/useScrollBgColor";
import { scheduleAfterPaint, scheduleIdleTask } from "@/lib/idle";

const CategoryRail = lazy(() => import("@/components/storefront/CategoryRail"));
const TopCategoryGrid = lazy(() => import("@/components/storefront/TopCategoryGrid"));
const ProductMarqueeSection = lazy(() => import("@/components/storefront/ProductMarqueeSection"));
const FloatingContactActions = lazy(() => import("@/components/storefront/FloatingContactActions"));
const CommunitySection = lazy(() => import("@/components/storefront/CommunitySection"));
const ReviewSection = lazy(() => import("@/components/storefront/ReviewSection"));
const Footer = lazy(() => import("@/components/storefront/Footer"));

const rowSurfaceTones = ["mist", "ivory", "paper"] as const;

const DeferredSection = ({
  children,
  minHeight,
  rootMargin = "420px 0px",
  bgColor,
  onVisible,
}: {
  children: ReactNode;
  minHeight: string;
  rootMargin?: string;
  bgColor?: string;
  onVisible?: () => void;
}) => {
  const placeholder = (
    <div className={minHeight} data-bg-color={bgColor} aria-hidden="true" />
  );

  return (
    <DeferredRender rootMargin={rootMargin} placeholder={placeholder} onVisible={onVisible}>
      <Suspense fallback={placeholder}>{children}</Suspense>
    </DeferredRender>
  );
};

const HomepageEnhancements = ({ deps }: { deps: ReadonlyArray<number> }) => {
  useScrollAnimations(deps);
  useScrollBgColor(deps);
  return null;
};

const Index = () => {
  const {
    sections,
    products,
    banners,
    communityMedia,
    reviews,
    ensureBannersLoaded,
    ensureCommunityMediaLoaded,
    ensureProductsLoaded,
    ensureReviewsLoaded,
    ensureSectionsLoaded,
  } = useAdminData();
  const [enhancementsReady, setEnhancementsReady] = useState(false);

  useEffect(() => {
    void ensureBannersLoaded();

    const cancelCatalogLoad = scheduleAfterPaint(() => {
      void Promise.all([ensureSectionsLoaded(), ensureProductsLoaded()]);
    }, 80);

    const cancelEnhancementLoad = scheduleIdleTask(() => {
      setEnhancementsReady(true);
    }, 1000);

    return () => {
      cancelCatalogLoad();
      cancelEnhancementLoad();
    };
  }, [ensureBannersLoaded, ensureProductsLoaded, ensureSectionsLoaded]);

  const deps = [sections.length, products.length, banners.length, communityMedia.length, reviews.length];

  const newLaunches = useMemo(
    () => products.filter((product) => product.is_new_launch),
    [products]
  );

  const categoryRows = useMemo(() => {
    const activeSections = sections.filter((section) => section.is_active !== false);
    return activeSections
      .map((section, index) => ({
        section,
        products: products.filter((product) => product.sectionId === section.id),
        surfaceTone: rowSurfaceTones[index % rowSurfaceTones.length],
        bgColor: SECTION_BG_COLORS[index % SECTION_BG_COLORS.length],
      }))
      .filter((row) => row.products.length > 0);
  }, [sections, products]);

  const featuredCategoryRows = categoryRows.slice(0, 2);
  const deferredCategoryRows = categoryRows.slice(2);

  return (
    <div className="min-h-screen">
      {enhancementsReady ? <HomepageEnhancements deps={deps} /> : null}
      <AnnouncementBar />
      <Navbar />

      <div data-bg-color="#fefce8">
        {banners.length ? <HeroSlider /> : <div className="home-hero" aria-hidden="true" />}
      </div>

      <DeferredSection
        minHeight="min-h-[360px]"
        rootMargin="480px 0px"
        bgColor="#dbeafe"
      >
        <div data-bg-color="#dbeafe">
          <CategoryRail sections={sections} />
        </div>
      </DeferredSection>

      <DeferredSection
        minHeight="min-h-[420px]"
        rootMargin="520px 0px"
        bgColor="#ffedd5"
      >
        <div data-bg-color="#ffedd5">
          <ProductMarqueeSection />
        </div>
      </DeferredSection>

      <DeferredSection
        minHeight="min-h-[520px]"
        rootMargin="420px 0px"
        bgColor="#e0f2fe"
      >
        <div data-bg-color="#e0f2fe">
          <ProductSectionRow
            label="Just Arrived"
            title="New Launches"
            products={newLaunches}
            viewAllLink="/products?filter=new"
            animateDir="up"
            surfaceTone="paper"
          />
        </div>
      </DeferredSection>

      <DeferredSection
        minHeight="min-h-[460px]"
        rootMargin="460px 0px"
        bgColor="#f3e8ff"
      >
        <div data-bg-color="#f3e8ff">
          <TopCategoryGrid sections={sections} />
        </div>
      </DeferredSection>

      {featuredCategoryRows.map(({ section, products: rowProducts, surfaceTone, bgColor }, index) => (
        <div key={section.id} data-bg-color={bgColor}>
          <ProductSectionRow
            label={section.name}
            title={section.name}
            products={rowProducts}
            viewAllLink={`/categories/${section.id}`}
            animateDir={index % 2 === 0 ? "left" : "right"}
            surfaceTone={surfaceTone}
          />
        </div>
      ))}

      {deferredCategoryRows.map(({ section, products: rowProducts, surfaceTone, bgColor }, index) => (
        <div key={section.id} data-bg-color={bgColor}>
          <ProductSectionRow
            label={section.name}
            title={section.name}
            products={rowProducts}
            viewAllLink={`/categories/${section.id}`}
            animateDir={index % 2 === 0 ? "left" : "right"}
            surfaceTone={surfaceTone}
          />
        </div>
      ))}

      <DeferredSection
        minHeight="min-h-[700px]"
        rootMargin="680px 0px"
        bgColor="#dcfce7"
        onVisible={() => {
          void ensureCommunityMediaLoaded();
        }}
      >
        <div data-bg-color="#dcfce7">
          <CommunitySection />
        </div>
      </DeferredSection>

      <DeferredSection
        minHeight="min-h-[540px]"
        rootMargin="720px 0px"
        bgColor="#fce7f3"
        onVisible={() => {
          void ensureReviewsLoaded();
        }}
      >
        <div data-bg-color="#fce7f3">
          <ReviewSection />
        </div>
      </DeferredSection>

      <DeferredSection minHeight="min-h-[1px]" rootMargin="960px 0px" bgColor="#fed7aa">
        <div data-bg-color="#fed7aa">
          <FloatingContactActions />
        </div>
      </DeferredSection>

      <DeferredSection minHeight="min-h-[560px]" rootMargin="960px 0px" bgColor="#dbeafe">
        <div data-bg-color="#dbeafe">
          <Footer />
        </div>
      </DeferredSection>
    </div>
  );
};

export default Index;
