import { useAdminData } from "@/contexts/AdminDataContext";
import { useIsMobile } from "@/hooks/use-mobile";

const AnnouncementBar = () => {
  const { settings } = useAdminData();
  const isMobile = useIsMobile();
  const items = settings.announcementItems;

  if (!items.length) return null;

  return (
    <div
      className="border-b border-black/10"
      style={{
        background:
          "linear-gradient(90deg, hsl(20 25% 8%), hsl(26 22% 14%) 38%, hsl(20 25% 8%) 72%, hsl(26 22% 14%))",
      }}
    >
      <div className="section-container">
        {isMobile ? (
          <div className="flex min-h-9 items-center overflow-x-auto py-2 scrollbar-hide">
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
          <div className="flex min-h-9 flex-wrap items-center justify-center gap-x-5 gap-y-1 py-2">
            {items.map((item, index) => (
              <span key={`${item}-${index}`} className="inline-flex items-center gap-4 whitespace-nowrap">
                <span className="text-[11px] font-medium tracking-[0.18em] text-white/85 uppercase">
                  {item}
                </span>
                {index < items.length - 1 ? (
                  <span className="text-[hsl(38_65%_62%)] text-[9px] select-none flex-shrink-0" aria-hidden="true">
                    *
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBar;
