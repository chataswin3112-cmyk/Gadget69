import { Product } from "@/types";

export type OfferStatus = "active" | "upcoming" | "expired" | "no-offer";

const parseDateKey = (value?: string) => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return year * 10000 + month * 100 + day;
};

const getCurrentDateKey = (referenceDate: Date) =>
  referenceDate.getFullYear() * 10000
  + (referenceDate.getMonth() + 1) * 100
  + referenceDate.getDate();

const hasScheduledOffer = (product: Product) =>
  Boolean(
    product.offer
    && typeof product.offerPrice === "number"
    && Number.isFinite(product.offerPrice)
    && product.offerStartDate
    && product.offerEndDate
  );

export const isOfferActive = (product: Product, referenceDate = new Date()) => {
  if (!hasScheduledOffer(product)) {
    return false;
  }

  const startKey = parseDateKey(product.offerStartDate);
  const endKey = parseDateKey(product.offerEndDate);
  const currentKey = getCurrentDateKey(referenceDate);

  if (startKey === null || endKey === null || endKey < startKey) {
    return false;
  }

  return currentKey >= startKey && currentKey <= endKey;
};

export const getOfferStatus = (product: Product, referenceDate = new Date()): OfferStatus => {
  if (!hasScheduledOffer(product)) {
    return "no-offer";
  }

  const startKey = parseDateKey(product.offerStartDate);
  const endKey = parseDateKey(product.offerEndDate);
  const currentKey = getCurrentDateKey(referenceDate);

  if (startKey === null || endKey === null || endKey < startKey) {
    return "no-offer";
  }
  if (currentKey < startKey) {
    return "upcoming";
  }
  if (currentKey > endKey) {
    return "expired";
  }
  return "active";
};

export const getEffectivePrice = (product: Product, referenceDate = new Date()) =>
  isOfferActive(product, referenceDate) && typeof product.offerPrice === "number"
    ? product.offerPrice
    : product.price;

export const getDisplayMrp = (product: Product, referenceDate = new Date()) => {
  if (typeof product.mrp === "number") {
    return product.mrp;
  }
  return isOfferActive(product, referenceDate) ? product.price : undefined;
};
