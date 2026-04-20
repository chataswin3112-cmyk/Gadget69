import type { MediaType, Product, ProductMedia, ProductVariant, VariantMedia } from "@/types";

const sortMedia = <T extends { displayOrder: number; id?: number | null }>(media: T[]) =>
  [...media].sort((left, right) => {
    const byOrder = left.displayOrder - right.displayOrder;
    if (byOrder !== 0) {
      return byOrder;
    }
    return (left.id ?? 0) - (right.id ?? 0);
  });

export const getProductMedia = (product?: Product | null): ProductMedia[] => {
  if (!product) {
    return [];
  }

  if (product.media && product.media.length > 0) {
    return sortMedia(product.media);
  }

  const fallbackMedia: ProductMedia[] = [];
  let displayOrder = 0;

  if (product.imageUrl) {
    fallbackMedia.push({
      id: null,
      mediaUrl: product.imageUrl,
      mediaType: "IMAGE",
      mediaRole: "MAIN",
      displayOrder: displayOrder++,
      isPrimary: true,
    });
  }

  if (product.videoUrl) {
    fallbackMedia.push({
      id: null,
      mediaUrl: product.videoUrl,
      mediaType: "VIDEO",
      mediaRole: "ADDITIONAL",
      displayOrder: displayOrder++,
      isPrimary: false,
    });
  }

  for (const galleryImage of product.galleryImages || []) {
    if (!galleryImage) {
      continue;
    }
    fallbackMedia.push({
      id: null,
      mediaUrl: galleryImage,
      mediaType: "IMAGE",
      mediaRole: "ADDITIONAL",
      displayOrder: displayOrder++,
      isPrimary: false,
    });
  }

  return fallbackMedia;
};

export const getVariantMedia = (variant?: ProductVariant | null): VariantMedia[] =>
  sortMedia(variant?.media || []);

export const getPrimaryImageUrl = <T extends { mediaType: MediaType; mediaUrl: string; isPrimary: boolean }>(
  media: T[]
) =>
  media.find((item) => item.mediaType === "IMAGE" && item.isPrimary)?.mediaUrl
  || media.find((item) => item.mediaType === "IMAGE")?.mediaUrl
  || media[0]?.mediaUrl
  || "";

export const getPrimaryMediaUrl = <T extends { mediaUrl: string; isPrimary: boolean }>(media: T[]) =>
  media.find((item) => item.isPrimary)?.mediaUrl || media[0]?.mediaUrl || "";

export const getCartLineId = (productId: number, variantId?: number) =>
  `${productId}:${variantId ?? "base"}`;

export const describeVariant = (variantColor?: string, variantSize?: string) =>
  [variantColor, variantSize].filter(Boolean).join(" / ");
