import apiClient from "@/api/client";
import { uploadCatalogAssetFile, uploadCatalogMediaFile } from "@/api/productApi";

vi.mock("@/api/client", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("productApi persistent uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uploads catalog product media directly to Cloudinary when configured", async () => {
    const file = new File(["video"], "clip.mov", { type: "video/quicktime" });

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        cloudName: "demo-cloud",
        apiKey: "demo-key",
        timestamp: 123,
        signature: "signed",
        folder: "gadget69/products/videos",
        resourceType: "video",
      },
    });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        secure_url: "https://res.cloudinary.com/demo-cloud/video/upload/gadget69/products/videos/clip.mov",
        public_id: "gadget69/products/videos/clip",
        duration: 4.2,
      }),
    } as Response);

    await expect(uploadCatalogMediaFile(file, "PRODUCT")).resolves.toEqual({
      secureUrl: "https://res.cloudinary.com/demo-cloud/video/upload/gadget69/products/videos/clip.mov",
      mediaType: "VIDEO",
      publicId: "gadget69/products/videos/clip",
      width: undefined,
      height: undefined,
      duration: 4.2,
    });

    expect(apiClient.post).toHaveBeenCalledTimes(1);
    expect(apiClient.post).toHaveBeenCalledWith("/admin/catalog-media/upload-signature", {
      fileName: "clip.mov",
      contentType: "video/quicktime",
      fileSize: file.size,
      target: "PRODUCT",
    });
    expect(apiClient.post).not.toHaveBeenCalledWith(
      "/admin/upload",
      expect.any(FormData),
      expect.anything()
    );
  });

  it("passes the category target when uploading category images", async () => {
    const file = new File(["image"], "subcategory.png", { type: "image/png" });

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        cloudName: "demo-cloud",
        apiKey: "demo-key",
        timestamp: 123,
        signature: "signed",
        folder: "gadget69/categories/images",
        resourceType: "image",
      },
    });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        secure_url: "https://res.cloudinary.com/demo-cloud/image/upload/gadget69/categories/images/subcategory.png",
        public_id: "gadget69/categories/images/subcategory",
        width: 1200,
        height: 800,
      }),
    } as Response);

    await expect(uploadCatalogMediaFile(file, "CATEGORY")).resolves.toEqual({
      secureUrl: "https://res.cloudinary.com/demo-cloud/image/upload/gadget69/categories/images/subcategory.png",
      mediaType: "IMAGE",
      publicId: "gadget69/categories/images/subcategory",
      width: 1200,
      height: 800,
      duration: undefined,
    });

    expect(apiClient.post).toHaveBeenCalledWith("/admin/catalog-media/upload-signature", {
      fileName: "subcategory.png",
      contentType: "image/png",
      fileSize: file.size,
      target: "CATEGORY",
    });
  });

  it("supports persistent settings PDF uploads through Cloudinary raw assets", async () => {
    const file = new File(["pdf"], "catalogue.pdf", { type: "application/pdf" });

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        cloudName: "demo-cloud",
        apiKey: "demo-key",
        timestamp: 123,
        signature: "signed",
        folder: "gadget69/settings/files",
        resourceType: "raw",
      },
    });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        secure_url: "https://res.cloudinary.com/demo-cloud/raw/upload/gadget69/settings/files/catalogue.pdf",
      }),
    } as Response);

    await expect(uploadCatalogAssetFile(file, "SETTINGS")).resolves.toEqual({
      secureUrl: "https://res.cloudinary.com/demo-cloud/raw/upload/gadget69/settings/files/catalogue.pdf",
      resourceType: "raw",
      publicId: undefined,
      width: undefined,
      height: undefined,
      duration: undefined,
    });
  });

  it("falls back to local admin storage when Cloudinary is unavailable", async () => {
    const file = new File(["image"], "banner.png", { type: "image/png" });

    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Cloudinary unavailable"));
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        url: "/uploads/images/banner.png",
        fileName: "banner.png",
        mediaType: "IMAGES",
      },
    });

    await expect(uploadCatalogMediaFile(file, "BANNER")).resolves.toEqual({
      secureUrl: "/uploads/images/banner.png",
      mediaType: "IMAGE",
      publicId: "banner.png",
      width: undefined,
      height: undefined,
      duration: undefined,
    });

    expect(apiClient.post).toHaveBeenCalledTimes(2);
    expect(apiClient.post).toHaveBeenLastCalledWith(
      "/admin/upload",
      expect.any(FormData),
      expect.anything()
    );
  });

  it("does not bypass catalog validation errors with local fallback", async () => {
    const file = new File(["pdf"], "subcategory.pdf", { type: "application/pdf" });

    await expect(uploadCatalogMediaFile(file, "CATEGORY")).rejects.toThrow(
      "Category uploads only support images"
    );

    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
