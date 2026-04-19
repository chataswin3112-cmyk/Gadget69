import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "@/components/storefront/Footer";

const { mockUseAdminData } = vi.hoisted(() => ({
  mockUseAdminData: vi.fn(),
}));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

describe("Footer", () => {
  beforeEach(() => {
    mockUseAdminData.mockReset();
    mockUseAdminData.mockReturnValue({
      settings: {
        id: 1,
        siteTitle: "Gadget69",
        footerText: "Premium electronics and smart gadgets for everyday use.",
        catalogueUrl: "https://cdn.example.com/catalogue.pdf",
        facebookUrl: "https://facebook.com/gadget69",
        logoUrl: "https://cdn.example.com/custom-logo.png",
        announcementItems: [],
      },
    });
  });

  it("renders both footer brand logos while honoring a custom image source", () => {
    const { container } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getAllByAltText("Gadget 69")).toHaveLength(2);
    expect(screen.getAllByText("All Products").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/instagram/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/facebook/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/whatsapp/i).length).toBeGreaterThan(0);

    const customLogos = container.querySelectorAll('img[src="https://cdn.example.com/custom-logo.png"]');
    expect(customLogos).toHaveLength(2);
  });
});
