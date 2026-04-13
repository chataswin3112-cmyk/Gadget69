import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Section } from "@/types";
import SectionHeader from "./SectionHeader";
import MediaFrame from "./MediaFrame";

interface CategoryRailProps {
  sections: Section[];
}

// Unique warm pastel gradients cycling per card
const CARD_GRADIENTS = [
  "linear-gradient(145deg, hsl(38 55% 97%), hsl(38 45% 92%))",
  "linear-gradient(145deg, hsl(32 50% 97%), hsl(28 40% 93%))",
  "linear-gradient(145deg, hsl(42 60% 97%), hsl(40 50% 92%))",
  "linear-gradient(145deg, hsl(34 45% 97%), hsl(30 38% 93%))",
  "linear-gradient(145deg, hsl(46 55% 97%), hsl(44 48% 92%))",
];

const CategoryRail = ({ sections }: CategoryRailProps) => {
  const exploreSections = sections.filter((s) => s.show_in_explore !== false);

  if (!exploreSections.length) return null;

  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="home-section-panel" data-surface="ivory" data-animate="curtain-header">
          <SectionHeader label="Browse" title="Explore Categories" viewAllLink="/categories" />
          <div className="scrollbar-hide -mx-4 flex gap-5 overflow-x-auto px-4 pb-4">
            {exploreSections.map((section, index) => (
              <Link
                key={section.id}
                to={`/categories/${section.id}`}
                className="group w-40 flex-shrink-0 md:w-48"
                data-animate-card="category-chip"
                data-drift="card"
                data-drift-x="0.6"
                data-drift-y="-0.55"
                data-drift-strength="0.72"
              >
                <div
                  className="rounded-[28px] border border-white/80 p-3 shadow-[0_20px_44px_-32px_hsl(var(--surface-shadow)/0.45)] transition-all duration-300 group-hover:border-[hsl(var(--surface-soft-gold))]/60 group-hover:shadow-[0_28px_60px_-34px_hsl(var(--surface-shadow)/0.4)] group-hover:-translate-y-1"
                  style={{ background: CARD_GRADIENTS[index % CARD_GRADIENTS.length] }}
                >
                  <MediaFrame
                    src={section.imageUrl || "/placeholder.svg"}
                    alt={section.name}
                    aspectRatio="aspect-square"
                    className="rounded-[22px] bg-white/60"
                    padding="p-4"
                  />
                  <div className="px-1 pb-1 pt-4 flex items-end justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground font-body transition-colors group-hover:text-accent">
                        {section.name}
                      </p>
                      <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-foreground/45">
                        Explore
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-accent opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 flex-shrink-0 mb-0.5" />
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

export default CategoryRail;
