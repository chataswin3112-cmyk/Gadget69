import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HeroSlider from "@/components/storefront/HeroSlider";
import { Banner } from "@/types";

const { mockUseAdminData, mockUseIsMobile } = vi.hoisted(() => ({
  mockUseAdminData: vi.fn(),
  mockUseIsMobile: vi.fn(),
}));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: mockUseIsMobile,
}));

const banners: Banner[] = [
  {
    id: 1,
    title: "Banner One",
    desktopImageUrl: "https://cdn.example.com/banner-one.jpg",
    ctaText: "Shop Banner One",
    ctaLink: "/products/1",
    displayOrder: 0,
    isActive: true,
  },
  {
    id: 2,
    title: "Banner Two",
    desktopImageUrl: "https://cdn.example.com/banner-two.jpg",
    ctaText: "Shop Banner Two",
    ctaLink: "/products/2",
    displayOrder: 1,
    isActive: true,
  },
];

describe("HeroSlider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUseAdminData.mockReset();
    mockUseIsMobile.mockReset();
    mockUseAdminData.mockReturnValue({ banners });
    mockUseIsMobile.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("autoplays through active banners", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <HeroSlider />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Banner One" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByRole("heading", { name: "Banner Two" })).toBeInTheDocument();
  });

  it("pauses autoplay while hovered and resumes when the pointer leaves", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <HeroSlider />
      </MemoryRouter>
    );

    const heroSlider = screen.getByTestId("hero-slider");

    fireEvent.mouseEnter(heroSlider);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByRole("heading", { name: "Banner One" })).toBeInTheDocument();

    fireEvent.mouseLeave(heroSlider);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByRole("heading", { name: "Banner Two" })).toBeInTheDocument();
  });
});
