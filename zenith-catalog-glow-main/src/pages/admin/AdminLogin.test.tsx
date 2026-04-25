import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { adminLogin } from "@/api/adminApi";
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

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AdminLogin", () => {
  const mockAdminLogin = vi.mocked(adminLogin);

  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
    mockAdminLogin.mockReset();
  });

  it("renders the larger Gadget69 wordmark without introducing a text heading", () => {
    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    const logo = screen.getByAltText("Gadget69") as HTMLImageElement;

    expect(logo).toBeInTheDocument();
    expect(logo.src).toContain("gadget69-navbar-wordmark.webp");
    expect(logo).toHaveClass("h-32");
    expect(screen.queryByRole("heading", { name: /gadget69/i })).not.toBeInTheDocument();
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("stores the token and replaces the login route after a successful login", async () => {
    mockAdminLogin.mockResolvedValue({ token: "admin-token", message: "Login successful" });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: " admin@gadget69.com " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Admin@123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin-token");
      expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard", { replace: true });
    });
    expect(mockAdminLogin).toHaveBeenCalledWith({
      email: "admin@gadget69.com",
      password: "Admin@123",
    });
  });

  it("shows the backend message for invalid credentials", async () => {
    mockAdminLogin.mockRejectedValue({
      response: { status: 401, data: { message: "Invalid credentials" } },
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@gadget69.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Wrong@123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("locks locally for the backend rate-limit window after five failed attempts", async () => {
    mockAdminLogin.mockRejectedValue({
      response: { status: 401, data: { message: "Invalid credentials" } },
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@gadget69.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Wrong@123" },
    });

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
      await waitFor(() => expect(mockAdminLogin).toHaveBeenCalledTimes(attempt));
    }

    expect(await screen.findByText(/Account locked/i)).toBeInTheDocument();
    expect(screen.getByText("15:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Locked (15:00)" })).toBeDisabled();
  });

  it("uses the backend Retry-After value when the login endpoint returns 429", async () => {
    mockAdminLogin.mockRejectedValue({
      response: { status: 429, headers: { "Retry-After": "120" } },
    });

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@gadget69.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Wrong@123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText(/Account locked/i)).toBeInTheDocument();
    expect(screen.getByText("2:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Locked (2:00)" })).toBeDisabled();
  });
});
