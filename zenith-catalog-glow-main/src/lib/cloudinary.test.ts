import {
  buildCloudinaryPosterUrl,
  buildCloudinaryVideoUrl,
  extractCloudinaryCloudName,
  resolveCommunityVideoPoster,
  resolveCommunityVideoUrl,
} from "@/lib/cloudinary";

describe("cloudinary helpers", () => {
  it("extracts the cloud name from a Cloudinary URL", () => {
    expect(
      extractCloudinaryCloudName(
        "https://res.cloudinary.com/demo-cloud/video/upload/v1/gadget69/community/videos/launch.mp4"
      )
    ).toBe("demo-cloud");
  });

  it("builds optimized delivery URLs for posters and videos", () => {
    expect(
      buildCloudinaryPosterUrl({
        publicId: "gadget69/community videos/launch reel",
        cloudName: "demo-cloud",
        width: 960,
        height: 540,
      })
    ).toBe(
      "https://res.cloudinary.com/demo-cloud/video/upload/c_fill,g_auto,h_540,w_960,so_0/gadget69/community%20videos/launch%20reel.jpg"
    );

    expect(
      buildCloudinaryVideoUrl({
        publicId: "gadget69/community videos/launch reel",
        cloudName: "demo-cloud",
        width: 1440,
      })
    ).toBe(
      "https://res.cloudinary.com/demo-cloud/video/upload/c_limit,f_auto,q_auto:good,w_1440/gadget69/community%20videos/launch%20reel"
    );
  });

  it("prefers the Cloudinary optimized URL when a public ID exists", () => {
    expect(
      resolveCommunityVideoPoster({
        videoPublicId: "gadget69/community/videos/launch",
        videoUrl: "https://res.cloudinary.com/demo-cloud/video/upload/v1/gadget69/community/videos/launch.mp4",
      })
    ).toContain("/video/upload/c_fill,g_auto,h_720,w_1280,so_0/gadget69/community/videos/launch.jpg");

    expect(
      resolveCommunityVideoUrl({
        videoPublicId: "gadget69/community/videos/launch",
        videoUrl: "https://res.cloudinary.com/demo-cloud/video/upload/v1/gadget69/community/videos/launch.mp4",
      })
    ).toContain("/video/upload/c_limit,f_auto,q_auto:good,w_1600/gadget69/community/videos/launch");
  });

  it("falls back to the stored thumbnail, image, or placeholder when Cloudinary data is missing", () => {
    expect(
      resolveCommunityVideoPoster({
        thumbnailUrl: "https://cdn.example.com/thumb.jpg",
        imageUrl: "https://cdn.example.com/image.jpg",
      })
    ).toBe("https://cdn.example.com/thumb.jpg");

    expect(
      resolveCommunityVideoPoster({
        imageUrl: "https://cdn.example.com/image.jpg",
      })
    ).toBe("https://cdn.example.com/image.jpg");

    expect(resolveCommunityVideoPoster({})).toBe("/placeholder.svg");
  });
});
