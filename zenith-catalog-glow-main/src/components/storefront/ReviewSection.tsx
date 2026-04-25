import { useMemo } from "react";
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

  const displayReviews = useMemo(
    () => reviews.slice(0, Math.min(reviews.length, 6)),
    [reviews]
  );
  const marqueeReviews = useMemo(() => {
    if (displayReviews.length <= 1) {
      return displayReviews;
    }

    return [...displayReviews, ...displayReviews];
  }, [displayReviews]);
  const avgRating = useMemo(() => {
    if (!reviews.length) {
      return "0.0";
    }

    return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  if (!reviews.length) return null;

  return (
    <section
      data-testid="review-section"
      className="group section-padding [content-visibility:auto] [contain-intrinsic-size:760px]"
    >
      <div className="section-container">
        <div className="mb-8 flex flex-col items-center px-2 text-center sm:mb-10">
          <p className="mb-2 font-body text-xs font-medium uppercase tracking-[0.22em] text-accent">
            What People Say
          </p>
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Customer Feedback
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Real customers. Genuine stories. No fakes.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 rounded-full border border-[hsl(var(--surface-line))] bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur sm:gap-3 sm:px-5">
            <StarRow rating={5} />
            <span className="font-heading text-lg font-bold text-foreground">{avgRating}</span>
            <span className="font-body text-sm text-muted-foreground">
              from {reviews.length.toLocaleString()} reviews
            </span>
          </div>
        </div>

        {displayReviews.length === 1 ? (
          <div className="mx-auto max-w-[360px]">
            <ReviewCard review={displayReviews[0]} index={0} />
          </div>
        ) : (
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <div
              data-testid="review-marquee-track"
              className="review-marquee-track flex w-max gap-4 will-change-transform animate-marquee-left group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
            >
              {marqueeReviews.map((review, index) => {
                const originalIndex = index % displayReviews.length;
                const isDuplicate = index >= displayReviews.length;

                return (
                  <div
                    key={`${review.id}-${index}`}
                    className="w-[84vw] max-w-[340px] flex-shrink-0 sm:w-[320px] lg:w-[360px]"
                    aria-hidden={isDuplicate}
                  >
                    <ReviewCard review={review} index={originalIndex} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
        optimizeWidth={80}
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
    <div className="relative overflow-hidden rounded-[20px] border border-white/78 bg-white/90 p-4 shadow-[0_14px_36px_-22px_hsl(var(--surface-shadow)/0.26)] backdrop-blur-sm sm:p-5">
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
