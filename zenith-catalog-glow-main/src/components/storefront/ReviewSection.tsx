import { Star, Quote } from "lucide-react";
import { mockReviews } from "@/data/mockData";
import { cn } from "@/lib/utils";

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
          i < rating ? "fill-[hsl(38_65%_58%)] text-[hsl(38_65%_58%)]" : "fill-muted text-muted"
        )}
      />
    ))}
  </div>
);

const ReviewSection = () => {
  // Duplicate reviews to fill out the display nicely
  const reviews = mockReviews.length ? mockReviews : [];
  if (!reviews.length) return null;

  // Create enough cards for two full rows
  const expandedReviews = [
    ...reviews,
    ...reviews,
    ...reviews, // triplicate so we have at least 9 cards
  ].map((r, i) => ({ ...r, uid: `${r.id}-${i}` }));

  const half = Math.ceil(expandedReviews.length / 2);
  const topRow = expandedReviews.slice(0, half);
  const bottomRow = expandedReviews.slice(half);

  return (
    <section className="section-padding overflow-hidden">
      <div className="section-container">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <p className="mb-2 font-body text-xs font-medium uppercase tracking-[0.22em] text-accent">
            What People Say
          </p>
          <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Loved by Thousands
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            Real customers. Genuine stories. No fakes.
          </p>
          {/* Aggregate rating bar */}
          <div className="mt-5 flex items-center gap-3 rounded-full border border-[hsl(var(--surface-line))] bg-white/80 px-5 py-2.5 shadow-sm backdrop-blur">
            <StarRow rating={5} />
            <span className="font-heading text-lg font-bold text-foreground">4.9</span>
            <span className="text-sm text-muted-foreground font-body">from 1,200+ reviews</span>
          </div>
        </div>

        {/* Infinite marquee — Row 1 (left) */}
        <div className="relative mb-4 flex gap-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex animate-marquee-left gap-4 will-change-transform">
            {[...topRow, ...topRow].map((review, i) => (
              <ReviewCard key={`top-${review.uid}-${i}`} review={review} index={i} />
            ))}
          </div>
        </div>

        {/* Infinite marquee — Row 2 (right, reversed) */}
        <div className="relative flex gap-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex animate-marquee-right gap-4 will-change-transform">
            {[...bottomRow, ...bottomRow].map((review, i) => (
              <ReviewCard key={`bot-${review.uid}-${i}`} review={review} index={i + 3} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface ReviewCardProps {
  review: { uid: string; id: number; name: string; rating: number; comment: string; date: string };
  index: number;
}

const ReviewCard = ({ review, index }: ReviewCardProps) => {
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = review.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative w-[300px] flex-shrink-0 overflow-hidden rounded-[22px] border border-white/78 bg-white/90 p-5 shadow-[0_18px_40px_-28px_hsl(var(--surface-shadow)/0.28)] backdrop-blur-sm md:w-[340px]">
      {/* Quote icon */}
      <Quote className="absolute right-4 top-4 h-8 w-8 fill-[hsl(38_55%_88%)] text-[hsl(38_55%_88%)]" />

      {/* Stars */}
      <StarRow rating={review.rating} />

      {/* Comment */}
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-foreground/80 font-body">
        "{review.comment}"
      </p>

      {/* Reviewer */}
      <div className="mt-4 flex items-center gap-3 border-t border-[hsl(var(--surface-line))] pt-4">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold font-heading", avatarColor)}>
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground font-heading">{review.name}</p>
          <p className="text-xs text-muted-foreground font-body">{review.date}</p>
        </div>
        <div className="ml-auto rounded-full bg-[hsl(38_56%_90%)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(38_56%_40%)]">
          Verified
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;
