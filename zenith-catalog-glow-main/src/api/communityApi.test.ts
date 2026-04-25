import apiClient from "@/api/client";
import { uploadCommunityVideo } from "@/api/communityApi";

vi.mock("@/api/client", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("communityApi upload fallbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to local admin storage when community video signatures are unavailable", async () => {
    const file = new File(["video"], "launch.webm", { type: "video/webm" });
    const progress = vi.fn();

    vi.mocked(apiClient.post)
      .mockRejectedValueOnce(new Error("Cloudinary unavailable"))
      .mockResolvedValueOnce({
        data: {
          url: "/uploads/videos/launch.webm",
          fileName: "launch.webm",
          mediaType: "VIDEOS",
        },
      });

    await expect(uploadCommunityVideo(file, progress)).resolves.toEqual({
      videoUrl: "/uploads/videos/launch.webm",
    });

    expect(progress).toHaveBeenCalledWith(100);
    expect(apiClient.post).toHaveBeenNthCalledWith(1, "/admin/community-media/upload-signature", {
      fileName: "launch.webm",
      contentType: "video/webm",
      fileSize: file.size,
    });
    expect(apiClient.post).toHaveBeenNthCalledWith(
      2,
      "/admin/upload",
      expect.any(FormData),
      expect.objectContaining({
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  });
});
