import { useEffect, useMemo, type CSSProperties } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import ProductCard from "@/components/storefront/ProductCard";
import { useAdminData } from "@/contexts/AdminDataContext";
import MediaImage from "@/components/ui/media-image";
import MediaFrame from "@/components/storefront/MediaFrame";
import {
  getChildSections,
  getDirectProductsForSection,
  getProductGroupsForChildSections,
  isSubcategory,
} from "@/lib/category";

const CategoryDetails = () => {
  const { id } = useParams();
  const { sections, products: allProducts, ensureProductsLoaded, ensureSectionsLoaded } = useAdminData();

  useEffect(() => {
    void Promise.all([ensureSectionsLoaded(), ensureProductsLoaded()]);
  }, [ensureProductsLoaded, ensureSectionsLoaded]);

  const sectionId = Number(id);
  const section = sections.find((s) => s.id === sectionId);
  const parentSection = section?.parentSectionId
    ? sections.find((item) => item.id === section.parentSectionId)
    : null;
  const childSections = useMemo(
    () => (section && !isSubcategory(section) ? getChildSections(sections, section.id, true) : []),
    [section, sections]
  );
  const directProducts = useMemo(
    () => getDirectProductsForSection(allProducts, sectionId),
    [allProducts, sectionId]
  );
  const childProductGroups = useMemo(
    () =>
      section && !isSubcategory(section)
        ? getProductGroupsForChildSections(allProducts, childSections)
        : [],
    [allProducts, childSections, section]
  );
  const childProductsCount = childProductGroups.reduce(
    (total, group) => total + group.products.length,
    0
  );
  const totalProductsCount = directProducts.length + childProductsCount;
  const showsParentProductGroups = Boolean(section && !isSubcategory(section) && childSections.length);

  if (!section) {
    return (
      <div className="min-h-screen bg-background">
        <AnnouncementBar />
        <Navbar />
        <div className="section-container section-padding pt-24 text-center">
          <h1 className="font-heading text-3xl font-bold">Category Not Found</h1>
          <Link to="/categories" className="text-accent hover:underline mt-4 inline-block font-body">
            ← Back to Categories
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

      {/* Hero banner */}
      <div className="relative h-48 md:h-64 overflow-hidden bg-muted">
        {section.imageUrl && (
          <MediaImage
            src={section.imageUrl}
            alt={section.name}
            className="w-full h-full object-cover"
            sizes="100vw"
            optimizeWidth={800}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="section-container">
            <nav className="flex items-center gap-1.5 text-sm text-white/70 font-body mb-3">
              <Link to="/" className="hover:text-white">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to="/categories" className="hover:text-white">Categories</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              {parentSection ? (
                <>
                  <Link to={`/categories/${parentSection.id}`} className="hover:text-white">
                    {parentSection.name}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              ) : null}
              <span className="text-white">{section.name}</span>
            </nav>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">
              {section.name}
            </h1>
            {section.description && (
              <p className="text-white/70 mt-2 font-body">{section.description}</p>
            )}
          </div>
        </div>
      </div>

      {childSections.length > 0 ? (
        <div className="section-container py-10">
          <p className="text-sm text-muted-foreground mb-6 font-body">
            {childSections.length} subcategories
          </p>
          <div className="grid grid-cols-2 gap-4 md:gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {childSections.map((child, i) => (
              <div
                key={child.id}
                className="enter-fade-up"
                style={
                  {
                    "--enter-delay": `${Math.min(i * 30, 180)}ms`,
                  } as CSSProperties
                }
              >
                <Link to={`/categories/${child.id}`} className="group block">
                  <div className="relative overflow-hidden rounded-xl shadow-premium transition-shadow duration-300 group-hover:shadow-premium-hover">
                    <MediaFrame
                      src={child.imageUrl || "/placeholder.svg"}
                      alt={child.name}
                      aspectRatio="aspect-[4/3]"
                      objectFit="cover"
                      padding="p-0"
                      className="rounded-xl"
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      optimizeWidth={480}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h2 className="font-heading text-xl font-bold text-white">{child.name}</h2>
                      {child.description ? (
                        <p className="mt-1 text-sm text-white/70 font-body">{child.description}</p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Products */}
      {totalProductsCount > 0 || childSections.length === 0 ? (
      <div className="section-container py-10">
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-bold">Products in this Category</h2>
          <p className="mt-1 text-sm text-muted-foreground font-body">
            {totalProductsCount} products
          </p>
        </div>
        {totalProductsCount === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg font-body">No products in this category yet</p>
          </div>
        ) : (
          <div className="space-y-10">
            {childProductGroups.map((group) => (
              <div key={group.section.id} className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-xl font-semibold">{group.section.name}</h3>
                    <p className="text-sm text-muted-foreground font-body">
                      {group.products.length} products
                    </p>
                  </div>
                  <Link
                    to={`/categories/${group.section.id}`}
                    className="text-sm font-medium text-accent hover:underline font-body"
                  >
                    View Subcategory
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                  {group.products.map((product, i) => (
                    <div
                      key={product.id}
                      className="enter-fade-up"
                      style={
                        {
                          "--enter-delay": `${Math.min(i * 30, 180)}ms`,
                        } as CSSProperties
                      }
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {directProducts.length > 0 ? (
              <div className="space-y-4">
                {showsParentProductGroups ? (
                  <div>
                    <h3 className="font-heading text-xl font-semibold">Other Products</h3>
                    <p className="text-sm text-muted-foreground font-body">
                      {directProducts.length} products
                    </p>
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                  {directProducts.map((product, i) => (
                    <div
                      key={product.id}
                      className="enter-fade-up"
                      style={
                        {
                          "--enter-delay": `${Math.min(i * 30, 180)}ms`,
                        } as CSSProperties
                      }
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      ) : null}

      <FloatingContactActions />
      <Footer />
    </div>
  );
};

export default CategoryDetails;
