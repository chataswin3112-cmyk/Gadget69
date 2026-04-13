import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CommunitySection from "@/components/storefront/CommunitySection";
import { CommunityMedia } from "@/types";

const { mockUseAdminData } = vi.hoisted(() => ({
  mockUseAdminData: vi.fn(),
}));

vi.mock("@/contexts/AdminDataContext", () => ({
  useAdminData: mockUseAdminData,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, initial, whileInView, transition, viewport, ...props }: any) => <div {...props}>{children}</div>,
    a: ({ children, initial, whileInView, transition, viewport, ...props }: any) => <a {...props}>{children}</a>,
    button: ({ children, initial, whileInView, transition, viewport, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

const communityMedia: CommunityMedia[] = [
  {
    id: 1,
    title: "Launch Day",
    caption: "Watch the new launch recap",
    mediaType: "VIDEO",
    videoUrl: "https://res.cloudinary.com/demo-cloud/video/upload/v1/gadget69/community/videos/launch.mp4",
    thumbnailUrl: "https://res.cloudinary.com/demo-cloud/video/upload/c_fill,g_auto,h_720,w_1280,so_0/gadget69/community/videos/launch.jpg",
    videoPublicId: "gadget69/community/videos/launch",
    videoWidth: 1920,
    videoHeight: 1080,
    videoDuration: 36,
    displayOrder: 0,
    isActive: true,
  },
  {
    id: 2,
    title: "Community Photo",
    caption: "Behind the scenes",
    mediaType: "IMAGE",
    imageUrl: "https://cdn.example.com/community-image.jpg",
    displayOrder: 1,
    isActive: true,
  },
];

describe("CommunitySection", () => {
  beforeEach(() => {
    mockUseAdminData.mockReset();
    mockUseAdminData.mockReturnValue({
      communityMedia,
    });
  });

  it("renders video items as poster cards and only mounts the video player after click", async () => {
    render(<CommunitySection />);

    expect(screen.queryByTestId("community-video-player")).not.toBeInTheDocument();
    expect(document.querySelectorAll("video")).toHaveLength(0);

    fireEvent.click(screen.getByTestId("community-video-card-1"));

    await waitFor(() => expect(screen.getByTestId("community-video-player")).toBeInTheDocument());
    expect(document.querySelectorAll("video")).toHaveLength(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens YouTube items inside an iframe player", async () => {
    mockUseAdminData.mockReturnValue({
      communityMedia: [
        {
          id: 9,
          title: "YouTube recap",
          caption: "External recap",
          mediaType: "VIDEO",
          videoUrl: "https://www.youtube.com/watch?v=abc123XYZ",
          displayOrder: 0,
          isActive: true,
        },
      ],
    });

    render(<CommunitySection />);

    fireEvent.click(screen.getByTestId("community-video-card-9"));

    await waitFor(() => expect(screen.getByTestId("community-video-player")).toBeInTheDocument());
    expect(screen.getByTitle("YouTube recap")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/abc123XYZ?rel=0&modestbranding=1"
    );
  });
});
