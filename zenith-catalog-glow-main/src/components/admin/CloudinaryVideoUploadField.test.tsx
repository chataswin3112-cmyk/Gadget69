import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CloudinaryVideoUploadField from "@/components/admin/CloudinaryVideoUploadField";

const { mockUploadCommunityVideo, mockReadVideoMetadata, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockUploadCommunityVideo: vi.fn(),
  mockReadVideoMetadata: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("@/api/communityApi", () => ({
  uploadCommunityVideo: mockUploadCommunityVideo,
}));

vi.mock("@/lib/cloudinary", () => ({
  readVideoMetadata: mockReadVideoMetadata,
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

describe("CloudinaryVideoUploadField", () => {
  beforeEach(() => {
    mockUploadCommunityVideo.mockReset();
    mockReadVideoMetadata.mockReset();
    mockToastSuccess.mockReset();
    mockToastError.mockReset();
  });

  it("accepts portrait uploads and stores the returned Cloudinary payload", async () => {
    mockReadVideoMetadata.mockResolvedValue({
      width: 720,
      height: 1280,
      duration: 12,
    });
    mockUploadCommunityVideo.mockResolvedValue({
      videoUrl: "https://res.cloudinary.com/demo-cloud/video/upload/v1/gadget69/community/videos/portrait.mp4",
      thumbnailUrl: "https://res.cloudinary.com/demo-cloud/video/upload/c_fill,g_auto,h_720,w_1280,so_0/gadget69/community/videos/portrait.jpg",
      videoPublicId: "gadget69/community/videos/portrait",
      videoWidth: 720,
      videoHeight: 1280,
      videoDuration: 12,
    });

    const onChange = vi.fn();
    render(<CloudinaryVideoUploadField value={{ mediaType: "VIDEO" }} onChange={onChange} />);

    const input = screen.getByLabelText("Upload community video");
    fireEvent.change(input, {
      target: {
        files: [new File(["portrait"], "portrait.mp4", { type: "video/mp4" })],
      },
    });

    await waitFor(() => expect(mockReadVideoMetadata).toHaveBeenCalled());
    expect(mockUploadCommunityVideo).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        videoUrl: "https://res.cloudinary.com/demo-cloud/video/upload/v1/gadget69/community/videos/portrait.mp4",
        videoWidth: 720,
        videoHeight: 1280,
        videoDuration: 12,
      })
    );
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it("populates the community media fields after a successful Cloudinary upload", async () => {
    mockReadVideoMetadata.mockResolvedValue({
      width: 1920,
      height: 1080,
      duration: 34,
    });
    mockUploadCommunityVideo.mockResolvedValue({
      videoUrl: "https://res.cloudinary.com/demo-cloud/video/upload/v1/gadget69/community/videos/launch.mp4",
      thumbnailUrl: "https://res.cloudinary.com/demo-cloud/video/upload/c_fill,g_auto,h_720,w_1280,so_0/gadget69/community/videos/launch.jpg",
      videoPublicId: "gadget69/community/videos/launch",
      videoWidth: 1920,
      videoHeight: 1080,
      videoDuration: 34,
    });

    const onChange = vi.fn();
    render(<CloudinaryVideoUploadField value={{ mediaType: "VIDEO" }} onChange={onChange} />);

    const input = screen.getByLabelText("Upload community video");
    fireEvent.change(input, {
      target: {
        files: [new File(["landscape"], "launch.mp4", { type: "video/mp4" })],
      },
    });

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: "",
          videoUrl: "https://res.cloudinary.com/demo-cloud/video/upload/v1/gadget69/community/videos/launch.mp4",
          thumbnailUrl:
            "https://res.cloudinary.com/demo-cloud/video/upload/c_fill,g_auto,h_720,w_1280,so_0/gadget69/community/videos/launch.jpg",
          videoPublicId: "gadget69/community/videos/launch",
          videoWidth: 1920,
          videoHeight: 1080,
          videoDuration: 34,
        })
      )
    );

    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it("renders pasted provider URLs in the preview frame", () => {
    const { container } = render(
      <CloudinaryVideoUploadField
        value={{ mediaType: "VIDEO", videoUrl: "https://www.instagram.com/reel/Cr12345xyz/" }}
        onChange={vi.fn()}
      />
    );

    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      "https://www.instagram.com/reel/Cr12345xyz/embed"
    );
  });
});
