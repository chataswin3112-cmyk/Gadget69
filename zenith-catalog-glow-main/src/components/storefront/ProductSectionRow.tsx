import { Product } from "@/types";
import { cn } from "@/lib/utils";
import ProductCard from "./ProductCard";
import SectionHeader from "./SectionHeader";

interface ProductSectionRowProps {
  label?: string;
  title: string;
  products: Product[];
  viewAllLink?: string;
  animateDir?: "left" | "right" | "up";
  surfaceTone?: "paper" | "mist" | "ivory";
}

const ProductSectionRow = ({
  label,
  title,
  products,
  viewAllLink,
  animateDir = "up",
  surfaceTone = "paper",
}: ProductSectionRowProps) => {
  if (!products.length) return null;

  const sectionAnimate =
    animateDir === "left"
      ? "section-row-left"
      : animateDir === "right"
      ? "section-row-right"
      : "new-launches-header";
  const cardAnimation = animateDir === "up" ? "product-card-rise" : "product-card-flip";
  const cardDrift =
    animateDir === "up"
      ? { x: 0.18, y: -0.85, strength: 1.1 }
      : animateDir === "left"
      ? { x: -0.48, y: -0.4, strength: 0.72 }
      : { x: 0.48, y: -0.4, strength: 0.72 };

  return (
    <section className="section-padding">
      <div className="section-container">
        <div
          className={cn(
            "home-section-panel",
            animateDir === "up" && "home-section-panel--elevated"
          )}
          data-surface={surfaceTone}
          data-animate={sectionAnimate}
        >
          <SectionHeader label={label} title={title} viewAllLink={viewAllLink} />
          <div className="grid grid-cols-2 gap-4 md:gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.slice(0, 5).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                animationPreset={cardAnimation}
                drift={cardDrift}
                className={cn(
                  "home-product-card",
                  animateDir === "up" && "home-product-card--elevated"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductSectionRow;
