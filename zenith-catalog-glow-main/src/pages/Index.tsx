import { useEffect, useMemo } from "react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import HeroSlider from "@/components/storefront/HeroSlider";
import CategoryRail from "@/components/storefront/CategoryRail";
import TopCategoryGrid from "@/components/storefront/TopCategoryGrid";
import ProductSectionRow from "@/components/storefront/ProductSectionRow";
import ProductMarqueeSection from "@/components/storefront/ProductMarqueeSection";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import CommunitySection from "@/components/storefront/CommunitySection";
import ReviewSection from "@/components/storefront/ReviewSection";
import Footer from "@/components/storefront/Footer";
import DeferredRender from "@/components/ui/deferred-render";
import { useAdminData } from "@/contexts/AdminDataContext";
import { useScrollAnimations } from "@/hooks/useScrollAnimations";
import { useScrollBgColor, SECTION_BG_COLORS } from "@/hooks/useScrollBgColor";

const rowSurfaceTones = ["mist", "ivory", "paper"] as const;

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

  useEffect(() => {
    void Promise.all([
      ensureBannersLoaded(),
      ensureSectionsLoaded(),
      ensureProductsLoaded(),
    ]);
  }, [ensureBannersLoaded, ensureProductsLoaded, ensureSectionsLoaded]);

  const deps = [sections.length, products.length, banners.length, communityMedia.length, reviews.length];
  useScrollAnimations(deps);
  useScrollBgColor(deps);

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
      <AnnouncementBar />
      <Navbar />

      <div data-bg-color="#fefce8">
        <HeroSlider />
      </div>

      <div data-bg-color="#dbeafe">
        <CategoryRail sections={sections} />
      </div>

      <DeferredRender
        rootMargin="520px 0px"
        placeholder={<div className="min-h-[420px]" data-bg-color="#fff7ed" aria-hidden="true" />}
      >
        <div data-bg-color="#fff7ed">
          <ProductMarqueeSection />
        </div>
      </DeferredRender>

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

      <div data-bg-color="#f3e8ff">
        <TopCategoryGrid sections={sections} />
      </div>

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
        <DeferredRender
          key={section.id}
          rootMargin="420px 0px"
          placeholder={<div className="min-h-[540px]" data-bg-color={bgColor} aria-hidden="true" />}
        >
          <div data-bg-color={bgColor}>
            <ProductSectionRow
              label={section.name}
              title={section.name}
              products={rowProducts}
              viewAllLink={`/categories/${section.id}`}
              animateDir={index % 2 === 0 ? "left" : "right"}
              surfaceTone={surfaceTone}
            />
          </div>
        </DeferredRender>
      ))}

      <DeferredRender
        rootMargin="680px 0px"
        onVisible={() => {
          void ensureCommunityMediaLoaded();
        }}
        placeholder={<div className="min-h-[700px]" data-bg-color="#fef9c3" aria-hidden="true" />}
      >
        <div data-bg-color="#fef9c3">
          <CommunitySection />
        </div>
      </DeferredRender>

      <DeferredRender
        rootMargin="720px 0px"
        onVisible={() => {
          void ensureReviewsLoaded();
        }}
        placeholder={<div className="min-h-[540px]" data-bg-color="#fce7f3" aria-hidden="true" />}
      >
        <div data-bg-color="#fce7f3">
          <ReviewSection />
        </div>
      </DeferredRender>

      <FloatingContactActions />
      <Footer />
    </div>
  );
};

export default Index;
