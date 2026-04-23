import { cn } from "@/lib/utils";

type BrandTone = "dark" | "light";

interface StorefrontBrandLockupProps {
  imageSrc: string;
  tone?: BrandTone;
  className?: string;
  imageClassName?: string;
  labelClassName?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "auto" | "high" | "low";
  intrinsicWidth?: number;
  intrinsicHeight?: number;
}

const toneClasses: Record<BrandTone, string> = {
  dark: "text-black",
  light: "text-white",
};

const StorefrontBrandLockup = ({
  imageSrc,
  tone = "dark",
  className,
  imageClassName,
  labelClassName,
  loading = "lazy",
  fetchPriority = "auto",
  intrinsicWidth = 448,
  intrinsicHeight = 448,
}: StorefrontBrandLockupProps) => (
  <div className={cn("flex min-w-0 items-center", className)}>
    <img
      src={imageSrc}
      alt="Gadget 69"
      className={cn(
        "flex-shrink-0 object-contain",
        toneClasses[tone] === "text-white" ? "brightness-0 invert mix-blend-screen" : "mix-blend-multiply",
        imageClassName
      )}
      width={intrinsicWidth}
      height={intrinsicHeight}
      loading={loading}
      decoding="async"
      {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
    />
  </div>
);

export default StorefrontBrandLockup;
