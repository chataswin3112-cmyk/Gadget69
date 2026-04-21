import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminLogin from "@/pages/admin/AdminLogin";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    token: null,
    isAuthenticated: false,
    login: mockLogin,
    logout: vi.fn(),
  }),
}));

vi.mock("@/api/adminApi", () => ({
  adminLogin: vi.fn(),
  resetPasswordWithSecretKey: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AdminLogin", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  it("renders the larger Gadget69 wordmark without introducing a text heading", () => {
    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    const logo = screen.getByAltText("Gadget69") as HTMLImageElement;

    expect(logo).toBeInTheDocument();
    expect(logo.src).toContain("gadget69-navbar-wordmark.png");
    expect(logo).toHaveClass("h-32");
    expect(screen.queryByRole("heading", { name: /gadget69/i })).not.toBeInTheDocument();
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });
});
