import { useMemo, type CSSProperties } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import ProductCard from "@/components/storefront/ProductCard";
import { useAdminData } from "@/contexts/AdminDataContext";
import MediaImage from "@/components/ui/media-image";

const CategoryDetails = () => {
  const { id } = useParams();
  const { sections, products: allProducts } = useAdminData();
  const section = sections.find((s) => s.id === Number(id));
  const products = useMemo(
    () => allProducts.filter((p) => p.sectionId === Number(id)),
    [id, allProducts]
  );

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

      {/* Products */}
      <div className="section-container py-10">
        <p className="text-sm text-muted-foreground mb-6 font-body">{products.length} products</p>
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg font-body">No products in this category yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {products.map((product, i) => (
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
        )}
      </div>

      <FloatingContactActions />
      <Footer />
    </div>
  );
};

export default CategoryDetails;
