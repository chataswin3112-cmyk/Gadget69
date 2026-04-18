import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MediaImage from "@/components/ui/media-image";
import VideoFrame from "@/components/ui/VideoFrame";
import { CommunityMedia } from "@/types";
import { resolveCommunityVideoPoster } from "@/lib/cloudinary";
import { FALLBACK_IMAGE_SRC } from "@/lib/media";
import { isVideoUrl, resolveVideoPosterUrl } from "@/lib/video";

const getVideoPoster = (item: CommunityMedia, width = 1280, height = 720) => {
  const poster = resolveCommunityVideoPoster({
    videoPublicId: item.videoPublicId,
    videoUrl: item.videoUrl,
    thumbnailUrl: item.thumbnailUrl,
    imageUrl: item.imageUrl,
    width,
    height,
  });
  if (poster && poster !== FALLBACK_IMAGE_SRC) {
    return poster;
  }

  return resolveVideoPosterUrl(item.videoUrl) || poster || FALLBACK_IMAGE_SRC;
};

const CommunitySection = () => {
  const { communityMedia } = useAdminData();
  const displayMedia = communityMedia;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeVideo, setActiveVideo] = useState<CommunityMedia | null>(null);
  const [allowInlineAutoplay, setAllowInlineAutoplay] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    const updateInlineAutoplay = () => setAllowInlineAutoplay(mediaQuery.matches);

    updateInlineAutoplay();
    mediaQuery.addEventListener("change", updateInlineAutoplay);

    return () => {
      mediaQuery.removeEventListener("change", updateInlineAutoplay);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (!displayMedia.length) {
    return null;
  }

  const activeVideoPoster = activeVideo ? getVideoPoster(activeVideo, 1600, 900) : "/placeholder.svg";

  return (
    <>
      <section className="section-padding">
        <div className="section-container">
          <div className="home-section-panel" data-surface="mist">
            <div
              data-animate="cta-glow"
              className="mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="mb-1 font-body text-xs font-medium uppercase tracking-[0.2em] text-accent">
                  Community
                </p>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
                  Join The Clan
                </h2>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => scroll("left")}
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[hsl(var(--surface-line))] bg-white/86 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button
                  onClick={() => scroll("right")}
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[hsl(var(--surface-line))] bg-white/86 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {displayMedia.map((item, index) => {
                const poster = item.thumbnailUrl || item.imageUrl || "/placeholder.svg";
                const hasVideo = item.mediaType === "VIDEO" || isVideoUrl(item.videoUrl);
                const videoPoster = hasVideo ? getVideoPoster(item, 960, 540) : poster;
                const shouldAutoPlayInline = hasVideo && allowInlineAutoplay;
                const motionSide = index % 2 === 0 ? "community-slide-left" : "community-slide-right";
                const driftX = index % 2 === 0 ? -0.72 : 0.72;

                if (hasVideo) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`community-video-card-${item.id}`}
                      onClick={() => setActiveVideo(item)}
                      data-animate-card={motionSide}
                      data-drift="card"
                      data-drift-x={driftX}
                      data-drift-y="-0.14"
                      data-drift-strength="0.55"
                      className="w-[280px] flex-shrink-0 snap-start text-left md:w-[360px]"
                    >
                      <div className="overflow-hidden rounded-[28px] border border-white/78 bg-white/90 shadow-[0_28px_62px_-36px_hsl(var(--surface-shadow)/0.36)]">
                        <div className="group relative aspect-video overflow-hidden">
                          {shouldAutoPlayInline ? (
                            <>
                              <VideoFrame
                                src={item.videoUrl}
                                title={item.title || item.caption || "Community video"}
                                videoPublicId={item.videoPublicId}
                                poster={videoPoster}
                                className="h-full rounded-none border-0 bg-black"
                                mediaClassName="transition-transform duration-500 group-hover:scale-105"
                                objectFit="cover"
                                controls={false}
                                autoPlay
                                muted
                                loop
                                testId={`community-inline-video-${item.id}`}
                              />
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-foreground/40 via-foreground/10 to-transparent" />
                            </>
                          ) : (
                            <>
                              <MediaImage
                                src={videoPoster}
                                alt={item.title || item.caption || "Community video"}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading={index < 2 ? "eager" : "lazy"}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-foreground/38 via-foreground/6 to-transparent" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/88 text-accent shadow-lg backdrop-blur">
                                  <Play className="ml-1 h-6 w-6 fill-current" />
                                </div>
                              </div>
                            </>
                          )}
                          <div className="absolute left-4 top-4 rounded-full bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
                            Playing
                          </div>
                        </div>
                        <div className="space-y-1 p-4">
                          <p className="font-heading text-lg font-semibold text-foreground">
                            {item.title || item.caption || "Community highlight"}
                          </p>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {item.caption || "Tap to watch the latest community drop."}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                }

                return (
                  <a
                    key={item.id}
                    href={item.actionLink || undefined}
                    onClick={(event) => {
                      if (!item.actionLink) {
                        event.preventDefault();
                      }
                    }}
                    data-animate-card={motionSide}
                    data-drift="card"
                    data-drift-x={driftX}
                    data-drift-y="-0.08"
                    data-drift-strength="0.5"
                    className="block w-52 flex-shrink-0 snap-start md:w-60"
                  >
                    <div className="overflow-hidden rounded-[24px] border border-white/76 bg-white/90 shadow-[0_26px_56px_-36px_hsl(var(--surface-shadow)/0.34)]">
                      <div className="group relative aspect-[3/4] overflow-hidden">
                        <MediaImage
                          src={poster}
                          alt={item.title || item.caption || "Community media"}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading={index < 2 ? "eager" : "lazy"}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/18 via-transparent to-transparent" />
                      </div>
                      <div className="space-y-2 px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-foreground/42">Community pick</p>
                        <p className="text-sm font-medium leading-6 text-foreground font-body">
                          {item.caption || item.title}
                        </p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DialogContent className="max-w-5xl overflow-hidden border-border/60 bg-background p-0 sm:rounded-[28px]">
          {activeVideo ? (
            <>
              <div className="bg-black">
                {isVideoUrl(activeVideo.videoUrl) ? (
                  <VideoFrame
                    src={activeVideo.videoUrl}
                    title={activeVideo.title || activeVideo.caption || "Community video"}
                    videoPublicId={activeVideo.videoPublicId}
                    poster={activeVideoPoster}
                    testId="community-video-player"
                    className="max-h-[75vh] rounded-none border-0"
                    autoPlay
                    muted
                  />
                ) : (
                  <MediaImage
                    src={activeVideoPoster}
                    alt={activeVideo.title || activeVideo.caption || "Community video"}
                    className="h-auto max-h-[75vh] w-full object-cover"
                  />
                )}
              </div>
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl">
                    {activeVideo.title || "Community highlight"}
                  </DialogTitle>
                  <DialogDescription className="text-base leading-relaxed">
                    {activeVideo.caption || "Watch the latest community story from Gadget69."}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CommunitySection;
