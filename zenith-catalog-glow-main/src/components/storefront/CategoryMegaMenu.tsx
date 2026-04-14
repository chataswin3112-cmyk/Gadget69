import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminData } from "@/contexts/AdminDataContext";
import { ChevronRight } from "lucide-react";
import MediaImage from "@/components/ui/media-image";
import { getEffectivePrice } from "@/lib/pricing";

const CategoryMegaMenu = () => {
  const { sections, products } = useAdminData();
  const activeSections = sections.filter(s => s.is_active !== false);
  const [hoveredId, setHoveredId] = useState<number | null>(activeSections[0]?.id ?? null);

  const hoveredProducts = products
    .filter(p => p.sectionId === hoveredId)
    .slice(0, 5);

  return (
    <div className="absolute top-full left-0 right-0 bg-card border-b border-border shadow-premium-hover z-50 overflow-y-auto max-h-[calc(100vh-5rem)]">
      <div className="section-container py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Category list */}
          <div className="col-span-3 border-r border-border pr-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-body">Categories</p>
            <div className="space-y-1">
              {activeSections.map(section => (
                <Link
                  key={section.id}
                  to={`/categories/${section.id}`}
                  onMouseEnter={() => setHoveredId(section.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${
                    hoveredId === section.id
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {section.name}
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </Link>
              ))}
            </div>
          </div>

          {/* Products list */}
          <div className="col-span-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-body">
              {activeSections.find(s => s.id === hoveredId)?.name ?? "Products"}
            </p>
            {hoveredProducts.length > 0 ? (
              <div className="space-y-2">
                {hoveredProducts.map(product => {
                  const price = getEffectivePrice(product);
                  return (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <MediaImage
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 rounded-md object-contain bg-secondary/30"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium font-body truncate">{product.name}</p>
                        {product.model_number && (
                          <p className="text-xs text-muted-foreground">{product.model_number}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold font-body">₹{price.toLocaleString()}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground font-body">No products in this category yet.</p>
            )}
          </div>

          {/* Featured image */}
          <div className="col-span-3">
            <div className="rounded-xl overflow-hidden aspect-square bg-secondary/30">
              <MediaImage
                src={activeSections.find(s => s.id === hoveredId)?.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"}
                alt="Category"
                className="w-full h-full object-cover"
              />
            </div>
            <Link
              to={`/categories/${hoveredId}`}
              className="inline-flex items-center gap-1 mt-3 text-sm text-accent font-medium hover:underline font-body"
            >
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryMegaMenu;
