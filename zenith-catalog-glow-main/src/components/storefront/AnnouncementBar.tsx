import { useAdminData } from "@/contexts/AdminDataContext";

const AnnouncementBar = () => {
  const { settings } = useAdminData();
  const items = settings.announcementItems.map((item) => item.trim()).filter(Boolean);

  if (!items.length) return null;

  const renderItems = (ariaHidden = false) =>
    items.map((item, index) => (
      <span
        key={`${ariaHidden ? "copy" : "item"}-${item}-${index}`}
        aria-hidden={ariaHidden || undefined}
        className="inline-flex shrink-0 items-center gap-4 whitespace-nowrap px-3"
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/85 sm:text-[11px] sm:tracking-[0.18em]">
          {item}
        </span>
        <span
          className="select-none text-[8px] text-[hsl(38_65%_62%)] sm:text-[9px]"
          aria-hidden="true"
        >
          *
        </span>
      </span>
    ));

  return (
    <div
      className="border-b border-black/10"
      style={{
        background:
          "linear-gradient(90deg, hsl(20 25% 8%), hsl(26 22% 14%) 38%, hsl(20 25% 8%) 72%, hsl(26 22% 14%))",
      }}
    >
      <div className="overflow-hidden" aria-label="Store announcements">
        <div
          data-testid="announcement-marquee-track"
          className="announcement-marquee-track flex min-h-9 w-max items-center py-2 will-change-transform"
        >
          <div className="flex shrink-0 items-center">{renderItems()}</div>
          <div className="flex shrink-0 items-center">{renderItems(true)}</div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
