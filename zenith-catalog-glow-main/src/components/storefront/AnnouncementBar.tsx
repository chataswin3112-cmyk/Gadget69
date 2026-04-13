import { useAdminData } from "@/contexts/AdminDataContext";

const AnnouncementBar = () => {
  const { settings } = useAdminData();
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
      {/* Shimmer overlay */}
      <div className="announcement-shimmer-overlay absolute inset-0 pointer-events-none" />
      <div className="relative h-9 flex items-center overflow-hidden">
        <div className="announcement-scroll flex whitespace-nowrap items-center">
          {repeatedItems.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4">
              <span className="text-[11px] font-medium tracking-[0.18em] text-white/85 uppercase px-6">
                {item}
              </span>
              <span
                className="text-[hsl(38_65%_62%)] text-[9px] select-none flex-shrink-0"
                aria-hidden="true"
              >
                ✦
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
