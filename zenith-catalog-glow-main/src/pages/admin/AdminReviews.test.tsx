import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminReviews from "@/pages/admin/AdminReviews";
import { Review } from "@/types";

const { mockUseAdminData, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockUseAdminData: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/admin/MediaUploadField", () => ({
  default: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: string;
    onChange: (value: string) => void;
  }) => (
    <label>
      <span>{label}</span>
      <input
        aria-label={label}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

const reviews: Review[] = [
  {
    id: 1,
    name: "Arjun Mehta",
    rating: 5,
    comment: "The checkout was smooth and the product arrived on time.",
    avatar: "",
    date: "2026-04-12",
  },
];

describe("AdminReviews", () => {
  beforeEach(() => {
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
    mockUseAdminData.mockReset();
    mockUseAdminData.mockReturnValue({
      reviews,
      addReview: vi.fn(),
      updateReview: vi.fn().mockResolvedValue(undefined),
      deleteReview: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("renders existing admin reviews", () => {
    render(<AdminReviews />);

    expect(screen.getByText("Manage homepage customer reviews")).toBeInTheDocument();
    expect(screen.getByText("Arjun Mehta")).toBeInTheDocument();
    expect(screen.getByText(/checkout was smooth/i)).toBeInTheDocument();
  });

  it("updates a reviewer avatar image through the admin editor", async () => {
    const updateReview = vi.fn().mockResolvedValue(undefined);
    mockUseAdminData.mockReturnValue({
      reviews,
      addReview: vi.fn(),
      updateReview,
      deleteReview: vi.fn().mockResolvedValue(undefined),
    });

    render(<AdminReviews />);

    fireEvent.click(screen.getByRole("button", { name: /edit review for arjun mehta/i }));
    fireEvent.change(screen.getByLabelText("Reviewer Photo"), {
      target: { value: "https://cdn.example.com/arjun-updated.jpg" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save review/i }));

    await waitFor(() =>
      expect(updateReview).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          avatar: "https://cdn.example.com/arjun-updated.jpg",
        })
      )
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Review updated");
  });

  it("deletes a review from the admin list", async () => {
    const deleteReview = vi.fn().mockResolvedValue(undefined);
    mockUseAdminData.mockReturnValue({
      reviews,
      addReview: vi.fn(),
      updateReview: vi.fn().mockResolvedValue(undefined),
      deleteReview,
    });

    render(<AdminReviews />);

    fireEvent.click(screen.getByRole("button", { name: /delete review for arjun mehta/i }));
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(deleteReview).toHaveBeenCalledWith(1));
    expect(mockToastSuccess).toHaveBeenCalledWith("Review deleted");
  });
});
