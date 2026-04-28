import apiClient from "@/api/client";
import { uploadCatalogMediaFile } from "@/api/productApi";

vi.mock("@/api/client", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("productApi upload fallbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to local admin storage when the catalog media signature request fails", async () => {
    const file = new File(["video"], "clip.mov", { type: "video/quicktime" });

    vi.mocked(apiClient.post)
      .mockRejectedValueOnce(new Error("Cloudinary unavailable"))
      .mockResolvedValueOnce({
        data: {
          url: "/uploads/videos/clip.mov",
          fileName: "clip.mov",
          mediaType: "VIDEOS",
        },
      });

    await expect(uploadCatalogMediaFile(file, "PRODUCT")).resolves.toEqual({
      secureUrl: "/uploads/videos/clip.mov",
      mediaType: "VIDEO",
    });

    expect(apiClient.post).toHaveBeenNthCalledWith(1, "/admin/catalog-media/upload-signature", {
      fileName: "clip.mov",
      contentType: "video/quicktime",
      fileSize: file.size,
      target: "PRODUCT",
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

  it("passes the category target when uploading category images", async () => {
    const file = new File(["image"], "subcategory.png", { type: "image/png" });

    vi.mocked(apiClient.post)
      .mockRejectedValueOnce(new Error("Cloudinary unavailable"))
      .mockResolvedValueOnce({
        data: {
          url: "/uploads/images/subcategory.png",
          fileName: "subcategory.png",
          mediaType: "IMAGES",
        },
      });

    await expect(uploadCatalogMediaFile(file, "CATEGORY")).resolves.toEqual({
      secureUrl: "/uploads/images/subcategory.png",
      mediaType: "IMAGE",
    });

    expect(apiClient.post).toHaveBeenNthCalledWith(1, "/admin/catalog-media/upload-signature", {
      fileName: "subcategory.png",
      contentType: "image/png",
      fileSize: file.size,
      target: "CATEGORY",
    });
  });
});
