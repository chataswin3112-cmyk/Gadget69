import { Link } from "react-router-dom";
import { Section } from "@/types";
import SectionHeader from "./SectionHeader";
import MediaFrame from "./MediaFrame";

interface TopCategoryGridProps {
  sections: Section[];
}

const TopCategoryGrid = ({ sections }: TopCategoryGridProps) => {
  const topSections = sections.filter((s) => s.show_in_top_category);

  if (!topSections.length) return null;

  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="home-section-panel" data-surface="sand" data-animate="curtain-header">
          <SectionHeader label="Popular" title="Top Categories" viewAllLink="/categories" />
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {topSections.map((section) => (
              <Link
                key={section.id}
                to={`/categories/${section.id}`}
                className="group"
                data-animate-card="top-cat-pop"
                data-drift="card"
                data-drift-x="0.18"
                data-drift-y="-0.38"
                data-drift-strength="0.6"
              >
                <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/88 shadow-[0_20px_44px_-34px_hsl(var(--surface-shadow)/0.42)] transition-[box-shadow,border-color] duration-300 group-hover:border-[hsl(var(--surface-soft-gold))]/55 group-hover:shadow-[0_28px_62px_-32px_hsl(var(--surface-shadow)/0.38)]">
                  <MediaFrame
                    src={section.imageUrl || "/placeholder.svg"}
                    alt={section.name}
                    aspectRatio="aspect-[4/3]"
                    objectFit="cover"
                    padding="p-0"
                    className="rounded-none"
                  />
                  <div className="space-y-2 px-4 py-4">
                    <h3 className="font-heading text-lg font-bold text-foreground">{section.name}</h3>
                    {section.description && (
                      <p className="text-xs leading-5 text-muted-foreground">{section.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopCategoryGrid;
