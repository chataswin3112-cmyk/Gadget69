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
}

const SectionHeader = ({
  label,
  title,
  subtitle,
  viewAllLink,
  viewAllText = "View All",
  className,
  centered = false,
}: SectionHeaderProps) => (
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
          {/* Glow dot */}
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
            style={{ boxShadow: "0 0 6px 1px hsl(38 50% 58% / 0.7)" }}
          />
          {label}
        </p>
      )}
      <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
        {title}
      </h2>
      {/* Animated grow-in underline */}
      <div className="mt-2 h-[2px] w-12 rounded-full bg-accent section-header-line" />
      {subtitle && (
        <p className="text-muted-foreground text-sm mt-2 max-w-lg">{subtitle}</p>
      )}
    </div>
    {viewAllLink && !centered && (
      <Link
        to={viewAllLink}
        className="inline-flex items-center gap-1.5 shrink-0 rounded-full border border-[hsl(var(--surface-line))] bg-white/70 px-4 py-1.5 text-sm font-medium text-foreground transition-all duration-200 hover:border-accent hover:text-accent hover:bg-[hsl(var(--accent))]/5 hover:gap-2.5"
      >
        {viewAllText}
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    )}
  </div>
);

export default SectionHeader;
