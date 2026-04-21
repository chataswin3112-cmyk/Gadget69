import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    token: "seed-token",
    isAuthenticated: true,
    login: vi.fn(),
    logout: mockLogout,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const setViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: width < 768,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe("Admin sidebar branding", () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockNavigate.mockReset();
    setViewport(1280);
  });

  it("renders the expanded logo treatment without the redundant Gadget69 text label", () => {
    render(
      <MemoryRouter initialEntries={["/admin/orders"]}>
        <SidebarProvider>
          <AdminSidebar />
        </SidebarProvider>
      </MemoryRouter>
    );

    const logo = screen.getByAltText("Gadget69 logo") as HTMLImageElement;
    const ordersLink = screen.getByRole("link", { name: /orders/i });

    expect(logo).toBeInTheDocument();
    expect(logo.src).toContain("gadget69-logo.png");
    expect(logo).toHaveClass("h-32");
    expect(screen.queryByText(/^Gadget69$/)).not.toBeInTheDocument();
    expect(screen.getByText("Admin Panel")).toHaveClass("text-sidebar-foreground");
    expect(screen.getByText("Control Room")).toHaveClass("text-sidebar-primary");
    expect(screen.getByText("Workspace")).toHaveClass("text-sidebar-foreground/60");
    expect(screen.getByText("Admin session protected")).toBeInTheDocument();
    expect(ordersLink).toHaveClass("text-sidebar-foreground/90");
    expect(ordersLink).toHaveAttribute("href", "/admin/orders");
  });

  it("shows the compact favicon mark in collapsed mode and keeps logout working", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/admin/dashboard"]}>
        <SidebarProvider defaultOpen={false}>
          <AdminSidebar />
        </SidebarProvider>
      </MemoryRouter>
    );

    const mark = screen.getByAltText("Gadget69 logo mark") as HTMLImageElement;

    expect(mark).toBeInTheDocument();
    expect(mark.src).toContain("favicon.svg");
    expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();

    const logoutButton = container.querySelectorAll('[data-sidebar="menu-button"]');

    fireEvent.click(logoutButton[logoutButton.length - 1] as HTMLElement);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/admin/login");
  });

  it("renders a logo-only mobile header treatment in the admin layout", async () => {
    setViewport(375);

    render(
      <MemoryRouter>
        <AdminLayout>
          <div>Admin content</div>
        </AdminLayout>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByAltText("Gadget69 logo")).toBeInTheDocument());

    expect(screen.getByText("Admin Workspace")).toBeInTheDocument();
    expect(screen.queryByText(/^Gadget69$/)).not.toBeInTheDocument();
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });
});
