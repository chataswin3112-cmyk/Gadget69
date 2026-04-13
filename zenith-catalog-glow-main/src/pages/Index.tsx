import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import HeroSlider from "@/components/storefront/HeroSlider";
import EditorialSpotlight from "@/components/storefront/EditorialSpotlight";
import CategoryRail from "@/components/storefront/CategoryRail";
import TopCategoryGrid from "@/components/storefront/TopCategoryGrid";
import ProductSectionRow from "@/components/storefront/ProductSectionRow";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import CommunitySection from "@/components/storefront/CommunitySection";
import ReviewSection from "@/components/storefront/ReviewSection";
import ProductMarqueeSection from "@/components/storefront/ProductMarqueeSection";
import Footer from "@/components/storefront/Footer";
import { useAdminData } from "@/contexts/AdminDataContext";
import { useMemo } from "react";
import { useScrollAnimations } from "@/hooks/useScrollAnimations";
import { useScrollBgColor, SECTION_BG_COLORS } from "@/hooks/useScrollBgColor";

const rowSurfaceTones = ["mist", "ivory", "paper"] as const;

const Index = () => {
  const { sections, products, banners, communityMedia } = useAdminData();

  const deps = [sections.length, products.length, banners.length, communityMedia.length];
  useScrollAnimations(deps);
  useScrollBgColor(deps);

  const newLaunches = useMemo(
    () => products.filter((p) => p.is_new_launch),
    [products]
  );

  const categoryRows = useMemo(() => {
    const activeSections = sections.filter((s) => s.is_active !== false);
    return activeSections
      .map((section, index) => ({
        section,
        products: products.filter((p) => p.sectionId === section.id),
        surfaceTone: rowSurfaceTones[index % rowSurfaceTones.length],
        bgColor: SECTION_BG_COLORS[index % SECTION_BG_COLORS.length],
      }))
      .filter((row) => row.products.length > 0);
  }, [sections, products]);

  return (
    <div className="min-h-screen">
      <AnnouncementBar />
      <Navbar />

      {/* Hero — 🟡 Soft Yellow */}
      <div data-bg-color="#fefce8">
        <HeroSlider />
      </div>

      {/* Category Rail — 🔵 Light Blue */}
      <div data-bg-color="#dbeafe">
        <CategoryRail sections={sections} />
      </div>

      {/* Editorial Spotlight — 🟠 Warm Orange */}
      <div data-bg-color="#ffedd5">
        <EditorialSpotlight products={products} sections={sections} />
      </div>

      {/* New Launches — 🩵 Sky Blue */}
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

      {/* Top Category Grid — 💜 Lavender */}
      <div data-bg-color="#f3e8ff">
        <TopCategoryGrid sections={sections} />
      </div>

      {/* Per-section product rows — each gets its own pastel colour */}
      {categoryRows.map(({ section, products, surfaceTone, bgColor }, index) => (
        <div key={section.id} data-bg-color={bgColor}>
          <ProductSectionRow
            label={section.name}
            title={section.name}
            products={products}
            viewAllLink={`/categories/${section.id}`}
            animateDir={index % 2 === 0 ? "left" : "right"}
            surfaceTone={surfaceTone}
          />
        </div>
      ))}

      {/* Community — 🌼 Buttercup Yellow */}
      <div data-bg-color="#fef9c3">
        <CommunitySection />
      </div>

      {/* All Products Marquee — 🦶 Warm Peach */}
      <div data-bg-color="#fff7ed">
        <ProductMarqueeSection />
      </div>

      {/* Reviews — 🌸 Soft Rose */}
      <div data-bg-color="#fce7f3">
        <ReviewSection />
      </div>

      <FloatingContactActions />
      <Footer />
    </div>
  );
};

export default Index;
