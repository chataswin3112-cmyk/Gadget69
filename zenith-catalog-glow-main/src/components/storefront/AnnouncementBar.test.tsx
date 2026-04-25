import { render, screen } from "@testing-library/react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";

const { mockUseAdminData } = vi.hoisted(() => ({
  mockUseAdminData: vi.fn(),
}));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

describe("AnnouncementBar", () => {
  beforeEach(() => {
    mockUseAdminData.mockReturnValue({
      settings: {
        announcementItems: ["Free shipping", "New arrivals"],
      },
    });
  });

  it("renders saved announcements as a moving navbar ticker", () => {
    render(<AnnouncementBar />);

    expect(screen.getByTestId("announcement-marquee-track")).toHaveClass(
      "announcement-marquee-track"
    );
    expect(screen.getAllByText("Free shipping")).toHaveLength(2);
    expect(screen.getAllByText("New arrivals")).toHaveLength(2);
  });

  it("does not render an empty announcement bar", () => {
    mockUseAdminData.mockReturnValue({
      settings: {
        announcementItems: ["   "],
      },
    });

    const { container } = render(<AnnouncementBar />);

    expect(container).toBeEmptyDOMElement();
  });
});
