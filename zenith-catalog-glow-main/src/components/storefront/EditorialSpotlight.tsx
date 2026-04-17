import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import MediaImage from "@/components/ui/media-image";
import { Product, Section } from "@/types";
import { getEffectivePrice } from "@/lib/pricing";

interface EditorialSpotlightProps {
  products: Product[];
  sections: Section[];
}

const EditorialSpotlight = ({ products, sections }: EditorialSpotlightProps) => {
  const prioritizedProducts = [
    ...products.filter((product) => product.is_new_launch),
    ...products.filter((product) => product.is_best_seller),
    ...products,
  ];

  const showcaseProducts = Array.from(
    new Map(prioritizedProducts.map((product) => [product.id, product])).values()
  ).slice(0, 3);

  if (showcaseProducts.length < 3) return null;

  const [leadProduct, ...supportingProducts] = showcaseProducts;
  const sectionLookup = new Map(sections.map((section) => [section.id, section]));

  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="home-section-panel" data-surface="pearl">
          <div className="mb-6 sm:mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 font-body text-xs font-medium uppercase tracking-[0.2em] text-accent">
                Visual Spotlight
              </p>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground md:text-4xl">
                Built to feel premium the moment the page opens
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                A more visual browse path helps shoppers understand the catalog faster, especially
                when they land without scrolling deep into product rows.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex self-start items-center gap-2 rounded-full border border-[hsl(var(--surface-line))] bg-white/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Browse all products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">
            <Link
              to={`/products/${leadProduct.id}`}
              className="group relative min-h-[280px] sm:min-h-[360px] md:min-h-[420px] overflow-hidden rounded-[24px] sm:rounded-[32px] border border-white/75 bg-white/88 shadow-[0_32px_72px_-40px_hsl(var(--surface-shadow)/0.42)]"
              data-animate="editorial-lead"
              data-drift="card"
              data-drift-x="0.24"
              data-drift-y="-0.36"
              data-drift-strength="0.72"
            >
              <MediaImage
                src={leadProduct.imageUrl}
                alt={leadProduct.name}
                className="absolute inset-y-0 right-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 lg:w-[62%]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--surface-paper))]/98 via-[hsl(var(--surface-paper))]/88 to-[hsl(var(--surface-paper))]/12" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsla(40,65%,80%,0.42),transparent_38%)]" />

              <div className="relative flex h-full max-w-xl flex-col justify-between p-5 sm:p-8 md:p-10 lg:max-w-[62%]">
                <div className="max-w-xl">
                  <span className="inline-flex rounded-full border border-[hsl(var(--surface-line))] bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70 backdrop-blur">
                    Featured Drop
                  </span>
                  <h3 className="mt-3 sm:mt-5 font-heading text-2xl sm:text-3xl font-bold leading-tight text-foreground md:text-5xl">
                    {leadProduct.name}
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-foreground/70 line-clamp-2 sm:line-clamp-none">
                    {leadProduct.short_description || leadProduct.description}
                  </p>
                </div>

                <div className="flex flex-col gap-3 border-t border-[hsl(var(--surface-line))] pt-4 sm:pt-5 sm:flex-row sm:items-end sm:justify-between mt-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-foreground/48">
                      {sectionLookup.get(leadProduct.sectionId)?.name || leadProduct.sectionName || "Featured"}
                    </p>
                    <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold text-foreground">
                      Rs. {getEffectivePrice(leadProduct).toLocaleString()}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    View details
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>

            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {supportingProducts.map((product, index) => {
                const relatedSection = sectionLookup.get(product.sectionId);
                const motionSide = index === 0 ? "left" : "right";

                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="group relative min-h-[160px] sm:min-h-[200px] overflow-hidden rounded-[24px] sm:rounded-[28px] border border-white/78 bg-white/86 shadow-[0_28px_62px_-38px_hsl(var(--surface-shadow)/0.38)]"
                    data-animate-card="editorial-support"
                    data-motion-side={motionSide}
                    data-drift="card"
                    data-drift-x={motionSide === "left" ? -0.4 : 0.4}
                    data-drift-y="-0.26"
                    data-drift-strength="0.6"
                  >
                    <MediaImage
                      src={product.imageUrl}
                      alt={product.name}
                      className="absolute inset-y-0 right-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:w-[56%]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--surface-paper))]/97 via-[hsl(var(--surface-paper))]/88 to-[hsl(var(--surface-paper))]/20" />

                    <div className="relative flex h-full max-w-[72%] flex-col justify-end p-4 sm:p-6 text-foreground sm:max-w-[68%]">
                      <span className="mb-2 sm:mb-3 inline-flex w-fit rounded-full border border-[hsl(var(--surface-line))] bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/68 backdrop-blur">
                        {index === 0 ? "Fresh pick" : "Trending"}
                      </span>
                      <h3 className="font-heading text-xl sm:text-2xl font-bold leading-tight">{product.name}</h3>
                      <div className="mt-2 sm:mt-3 flex items-center justify-between gap-3 text-sm text-foreground/62">
                        <span>{relatedSection?.name || product.sectionName || "Shop now"}</span>
                        <span className="inline-flex items-center gap-1 text-foreground">
                          Explore
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialSpotlight;
