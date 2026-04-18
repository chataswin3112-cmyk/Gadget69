import { render, screen } from "@testing-library/react";
import ReviewSection from "@/components/storefront/ReviewSection";
import { Review } from "@/types";

const { mockUseAdminData } = vi.hoisted(() => ({
  mockUseAdminData: vi.fn(),
}));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

const reviews: Review[] = [
  {
    id: 7,
    name: "Nila Rajan",
    rating: 5,
    comment: "Great after-sales support and a surprisingly fast delivery.",
    avatar: "https://cdn.example.com/nila.jpg",
    date: "2026-04-18",
  },
  {
    id: 3,
    name: "Rahul Bose",
    rating: 4,
    comment: "Setup was easy and the quality matched the product photos.",
    date: "2026-04-14",
  },
];

describe("ReviewSection", () => {
  beforeEach(() => {
    mockUseAdminData.mockReset();
    mockUseAdminData.mockReturnValue({ reviews });
  });

  it("renders review content, avatar images, and a hover-pausing marquee track", () => {
    render(<ReviewSection />);

    expect(screen.getByText("Customer Feedback")).toBeInTheDocument();
    expect(screen.getAllByText("Nila Rajan").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/great after-sales support/i).length).toBeGreaterThan(0);
    expect(screen.getAllByAltText("Nila Rajan")[0]).toHaveAttribute("src", "https://cdn.example.com/nila.jpg");

    const marqueeTrack = screen.getByTestId("review-marquee-track");
    expect(marqueeTrack.className).toContain("animate-marquee-left");
    expect(marqueeTrack.className).toContain("group-hover:[animation-play-state:paused]");
    expect(marqueeTrack.className).toContain("group-focus-within:[animation-play-state:paused]");
  });

  it("renders nothing when no reviews are available", () => {
    mockUseAdminData.mockReturnValue({ reviews: [] });

    const { container } = render(<ReviewSection />);

    expect(container).toBeEmptyDOMElement();
  });
});
