import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
  className?: string;
  centered?: boolean;
  headingLevel?: "h1" | "h2" | "h3";
  titleId?: string;
}

const SectionHeader = ({
  label,
  title,
  subtitle,
  viewAllLink,
  viewAllText = "View All",
  className,
  centered = false,
  headingLevel = "h2",
  titleId,
}: SectionHeaderProps) => {
  const TitleTag = headingLevel;

  return (
    <div
      className={cn(
        "flex items-end justify-between mb-5 sm:mb-7 lg:mb-8",
        centered && "flex-col items-center text-center",
        className
      )}
    >
      <div>
        {label && (
          <p className="inline-flex items-center gap-1.5 text-accent uppercase tracking-[0.2em] text-xs font-medium mb-2 sm:mb-3 font-body">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
              style={{ boxShadow: "0 0 6px 1px hsl(38 50% 58% / 0.7)" }}
            />
            {label}
          </p>
        )}
        <TitleTag
          id={titleId}
          className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground"
        >
          {title}
        </TitleTag>
        <div className="mt-2 h-[2px] w-12 rounded-full bg-accent section-header-line" />
        {subtitle && (
          <p className="text-muted-foreground text-sm mt-2 max-w-lg">{subtitle}</p>
        )}
      </div>
      {viewAllLink && !centered && (
        <Link
          to={viewAllLink}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[hsl(var(--surface-line))] bg-white/70 px-4 py-1.5 text-sm font-medium text-foreground transition-colors duration-200 hover:border-accent hover:bg-[hsl(var(--accent))]/5 hover:text-accent"
        >
          {viewAllText}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
