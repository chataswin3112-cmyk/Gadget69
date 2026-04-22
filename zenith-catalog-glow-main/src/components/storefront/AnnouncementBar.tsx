import { useAdminData } from "@/contexts/AdminDataContext";
import { useIsMobile } from "@/hooks/use-mobile";

const AnnouncementBar = () => {
  const { settings } = useAdminData();
  const isMobile = useIsMobile();
  const items = settings.announcementItems;

  if (!items.length) return null;

  const repeatedItems = [...items, ...items];

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(90deg, hsl(20 25% 8%), hsl(26 22% 14%) 38%, hsl(20 25% 8%) 72%, hsl(26 22% 14%))",
      }}
    >
      {!isMobile ? <div className="announcement-shimmer-overlay absolute inset-0 pointer-events-none" /> : null}
      {isMobile ? (
        <div className="relative flex min-h-9 items-center overflow-x-auto px-4 py-2 scrollbar-hide">
          <div className="flex min-w-full items-center justify-center gap-4">
            {items.map((item, index) => (
              <span key={`${item}-${index}`} className="inline-flex items-center gap-4 whitespace-nowrap">
                <span className="text-[10px] font-medium tracking-[0.16em] text-white/85 uppercase">
                  {item}
                </span>
                {index < items.length - 1 ? (
                  <span className="text-[hsl(38_65%_62%)] text-[8px] select-none flex-shrink-0" aria-hidden="true">
                    *
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative flex h-9 items-center overflow-hidden">
          <div className="announcement-scroll flex items-center whitespace-nowrap">
            {repeatedItems.map((item, index) => (
              <span key={`${item}-${index}`} className="inline-flex items-center gap-4">
                <span className="px-6 text-[11px] font-medium tracking-[0.18em] text-white/85 uppercase">
                  {item}
                </span>
                <span className="text-[hsl(38_65%_62%)] text-[9px] select-none flex-shrink-0" aria-hidden="true">
                  *
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementBar;
