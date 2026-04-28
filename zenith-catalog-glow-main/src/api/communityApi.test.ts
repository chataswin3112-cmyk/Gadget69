import axios from "axios";
import apiClient from "@/api/client";
import { uploadCommunityVideo } from "@/api/communityApi";

vi.mock("axios", () => ({
  default: {
    isAxiosError: vi.fn(() => false),
    post: vi.fn(),
  },
}));

vi.mock("@/api/client", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("communityApi persistent uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads community videos to Cloudinary and returns the poster payload", async () => {
    const file = new File(["video"], "launch.webm", { type: "video/webm" });
    const progress = vi.fn();

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        cloudName: "demo-cloud",
        apiKey: "demo-key",
        timestamp: 123,
        signature: "signed",
        folder: "gadget69/community/videos",
        resourceType: "video",
      },
    });
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        secure_url: "https://res.cloudinary.com/demo-cloud/video/upload/gadget69/community/videos/launch.webm",
        public_id: "gadget69/community/videos/launch",
        width: 1080,
        height: 1920,
        duration: 6.5,
      },
    });

    await expect(uploadCommunityVideo(file, progress)).resolves.toEqual({
      videoUrl: "https://res.cloudinary.com/demo-cloud/video/upload/gadget69/community/videos/launch.webm",
      thumbnailUrl:
        "https://res.cloudinary.com/demo-cloud/video/upload/c_fill,g_auto,h_720,w_1280,so_0/gadget69/community/videos/launch.jpg",
      videoPublicId: "gadget69/community/videos/launch",
      videoWidth: 1080,
      videoHeight: 1920,
      videoDuration: 6.5,
    });

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith("/admin/community-media/upload-signature", {
      fileName: "launch.webm",
      contentType: "video/webm",
      fileSize: file.size,
    });
    expect(apiClient.post).not.toHaveBeenCalledWith(
      "/admin/upload",
      expect.any(FormData),
      expect.anything()
    );
  });

  it("does not fall back to redeploy-unsafe local storage when video signatures are unavailable", async () => {
    const file = new File(["video"], "launch.webm", { type: "video/webm" });

    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Cloudinary unavailable"));

    await expect(uploadCommunityVideo(file)).rejects.toThrow("Cloudinary unavailable");

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).not.toHaveBeenCalledWith(
      "/admin/upload",
      expect.any(FormData),
      expect.anything()
    );
  });
});
