import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminData } from "@/contexts/AdminDataContext";
import MediaImage from "@/components/ui/media-image";

const AVATAR_COLORS = [
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-orange-100 text-orange-700",
];

const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(
          "h-3.5 w-3.5",
          i < rating
            ? "fill-[hsl(38_65%_58%)] text-[hsl(38_65%_58%)]"
            : "fill-muted text-muted"
        )}
      />
    ))}
  </div>
);

const ReviewSection = () => {
  const { reviews } = useAdminData();

  if (!reviews.length) return null;

  // Repeat to fill the marquee (need at least ~8 cards)
  const filled = reviews.length < 4
    ? [...reviews, ...reviews, ...reviews]
    : [...reviews, ...reviews];

  const avgRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <section data-testid="review-section" className="section-padding overflow-hidden">
      <div className="section-container">
        {/* Header */}
        <div className="mb-8 sm:mb-10 flex flex-col items-center text-center px-2">
          <p className="mb-2 font-body text-xs font-medium uppercase tracking-[0.22em] text-accent">
            What People Say
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Customer Feedback
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Real customers. Genuine stories. No fakes.
          </p>
          {/* Aggregate badge */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 rounded-full border border-[hsl(var(--surface-line))] bg-white/80 px-4 sm:px-5 py-2.5 shadow-sm backdrop-blur">
            <StarRow rating={5} />
            <span className="font-heading text-lg font-bold text-foreground">{avgRating}</span>
            <span className="text-sm text-muted-foreground font-body">
              from {reviews.length.toLocaleString()} reviews
            </span>
          </div>
        </div>

        <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:hidden">
          {reviews.map((review, i) => (
            <ReviewCard
              key={`${review.id}-mobile-${i}`}
              review={review}
              index={i}
            />
          ))}
        </div>

        {/* Single infinite marquee row — pauses on hover */}
        <div className="relative hidden overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] md:flex">
          <div
            data-testid="review-marquee-track"
            className="review-marquee-track flex flex-nowrap animate-marquee-left gap-4 will-change-transform"
          >
            {[...filled, ...filled].map((review, i) => (
              <ReviewCard
                key={`${review.id}-${i}`}
                review={review}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface ReviewCardProps {
  review: { id: number; name: string; rating: number; comment: string; avatar?: string; date: string };
  index: number;
}

const ReviewAvatar = ({
  name,
  avatar,
  colorClass,
}: {
  name: string;
  avatar?: string;
  colorClass: string;
}) => {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (avatar) {
    return (
      <MediaImage
        src={avatar}
        alt={name}
        className="h-10 w-10 flex-shrink-0 rounded-full border border-white/80 object-cover shadow-sm"
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold font-heading",
        colorClass
      )}
    >
      {initials}
    </div>
  );
};

const ReviewCard = ({ review, index }: ReviewCardProps) => {
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <div className="relative w-[220px] sm:w-[260px] flex-shrink-0 overflow-hidden rounded-[20px] border border-white/78 bg-white/90 p-4 sm:p-5 shadow-[0_14px_36px_-22px_hsl(var(--surface-shadow)/0.26)] backdrop-blur-sm md:w-[320px]">
      <Quote className="absolute right-4 top-4 h-7 w-7 fill-[hsl(38_55%_88%)] text-[hsl(38_55%_88%)]" />

      <StarRow rating={review.rating} />

      <p className="mt-3 line-clamp-3 text-sm leading-6 text-foreground/80 font-body">
        "{review.comment}"
      </p>

      <div className="mt-4 flex items-center gap-3 border-t border-[hsl(var(--surface-line))] pt-3">
        <ReviewAvatar name={review.name} avatar={review.avatar} colorClass={avatarColor} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground font-heading">
            {review.name}
          </p>
          <p className="text-xs text-muted-foreground font-body">{review.date}</p>
        </div>
        <div className="ml-auto flex-shrink-0 rounded-full bg-[hsl(38_56%_90%)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(38_56%_40%)]">
          Customer
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;
