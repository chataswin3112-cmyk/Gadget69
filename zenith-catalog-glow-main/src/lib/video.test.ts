import { getVideoProvider, isVideoUrl, resolveVideoPosterUrl, resolveVideoSource } from "@/lib/video";

describe("video helpers", () => {
  it("detects direct and Cloudinary video URLs", () => {
    expect(getVideoProvider("https://cdn.example.com/demo.mp4")).toBe("direct");
    expect(
      getVideoProvider("https://res.cloudinary.com/demo-cloud/video/upload/v1/gadget69/community/videos/launch.mp4")
    ).toBe("cloudinary");
    expect(isVideoUrl("https://res.cloudinary.com/demo-cloud/video/upload/v1/gadget69/community/videos/launch.mp4")).toBe(true);
  });

  it("normalizes YouTube watch, share, and shorts URLs into nocookie embeds", () => {
    expect(resolveVideoSource({ url: "https://www.youtube.com/watch?v=abc123XYZ" })).toEqual(
      expect.objectContaining({
        kind: "embed",
        provider: "youtube",
        src: "https://www.youtube-nocookie.com/embed/abc123XYZ?rel=0&modestbranding=1",
      })
    );

    expect(resolveVideoSource({ url: "https://youtu.be/abc123XYZ?si=test" })).toEqual(
      expect.objectContaining({
        kind: "embed",
        provider: "youtube",
        src: "https://www.youtube-nocookie.com/embed/abc123XYZ?rel=0&modestbranding=1",
      })
    );

    expect(resolveVideoSource({ url: "https://www.youtube.com/shorts/abc123XYZ" })).toEqual(
      expect.objectContaining({
        kind: "embed",
        provider: "youtube",
        src: "https://www.youtube-nocookie.com/embed/abc123XYZ?rel=0&modestbranding=1",
      })
    );
  });

  it("normalizes Instagram reel and post URLs into embeds", () => {
    expect(resolveVideoSource({ url: "https://www.instagram.com/reel/Cr12345xyz/" })).toEqual(
      expect.objectContaining({
        kind: "embed",
        provider: "instagram",
        src: "https://www.instagram.com/reel/Cr12345xyz/embed",
      })
    );

    expect(resolveVideoSource({ url: "https://www.instagram.com/p/Cp98765abc/?img_index=1" })).toEqual(
      expect.objectContaining({
        kind: "embed",
        provider: "instagram",
        src: "https://www.instagram.com/p/Cp98765abc/embed",
      })
    );
  });

  it("keeps Cloudinary URLs native and builds transformed playback when a public id exists", () => {
    expect(
      resolveVideoSource({
        url: "https://res.cloudinary.com/demo-cloud/video/upload/v1/gadget69/community/videos/launch.mp4",
        videoPublicId: "gadget69/community/videos/launch",
      })
    ).toEqual(
      expect.objectContaining({
        kind: "native",
        provider: "cloudinary",
        src: "https://res.cloudinary.com/demo-cloud/video/upload/c_limit,f_auto,q_auto:good,w_1600/gadget69/community/videos/launch",
      })
    );
  });

  it("returns a YouTube poster fallback and ignores unsupported URLs", () => {
    expect(resolveVideoPosterUrl("https://www.youtube.com/watch?v=abc123XYZ")).toBe(
      "https://i.ytimg.com/vi/abc123XYZ/hqdefault.jpg"
    );
    expect(getVideoProvider("https://example.com/not-a-video")).toBe("none");
    expect(resolveVideoSource({ url: "https://example.com/not-a-video" })).toBeNull();
  });
});
