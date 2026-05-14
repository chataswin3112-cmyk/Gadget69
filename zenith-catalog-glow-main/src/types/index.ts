export type MediaType = "IMAGE" | "VIDEO";
export type MediaRole = "MAIN" | "SIDE" | "BACK" | "ADDITIONAL";

export interface Section {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  is_active?: boolean;
  show_in_explore?: boolean;
  show_in_top_category?: boolean;
  accent_tone?: string;
  sort_order?: number;
  parentSectionId?: number | null;
  parentSectionName?: string | null;
}

export interface ProductMedia {
  id?: number | null;
  productId?: number;
  mediaUrl: string;
  mediaType: MediaType;
  mediaRole: MediaRole;
  displayOrder: number;
  isPrimary: boolean;
}

export interface VariantMedia {
  id: number;
  variantId?: number;
  mediaUrl: string;
  mediaType: MediaType;
  mediaRole: MediaRole;
  displayOrder: number;
  isPrimary: boolean;
}

/** @deprecated use VariantMedia */
export interface ProductVariantImage {
  id: number;
  variantId: number;
  imageUrl: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: number;
  productId: number;
  colorName: string;
  hexCode: string;
  size?: string;
  price?: number;
  priceAdjustment: number;
  stock: number;
  sku?: string;
  isDefault: boolean;
  displayOrder: number;
  media: VariantMedia[];
  /** @deprecated mapped from media for backward compat */
  images?: ProductVariantImage[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  shippingCharge?: number;
  stockQuantity: number;
  sectionId: number;
  sectionName?: string;
  parentSectionId?: number | null;
  parentSectionName?: string | null;
  imageUrl: string;
  videoUrl?: string;
  createdAt: string;
  offer?: boolean;
  offerPrice?: number;
  offerStartDate?: string;
  offerEndDate?: string;
  slug?: string;
  model_number?: string;
  short_description?: string;
  mrp?: number;
  display_order?: number;
  is_new_launch?: boolean;
  is_best_seller?: boolean;
  is_featured?: boolean;
  is_hero_featured?: boolean;
  status?: string;
  default_thumbnail_url?: string;
  galleryImages?: string[];
  specifications?: Record<string, string>;
  variants?: ProductVariant[];
  media?: ProductMedia[];
}

export interface CartItem {
  lineId: string;
  product: Product;
  quantity: number;
  variantId?: number;
  variantColor?: string;
  variantSize?: string;
  selectedVariantId?: number;
  unitPrice: number;
  mediaUrl?: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  variantId?: number;
  variantColor?: string;
  variantSize?: string;
  quantity: number;
  price: number;
}

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | string;
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | string;

export interface OrderFilters {
  orderStatus?: string;
  paymentStatus?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AdminOrdersResponse {
  items: Order[];
  total: number;
  appliedFilters: OrderFilters;
}

export interface ApiErrorResponse {
  code?: string;
  message?: string;
  requestId?: string;
}

export type AdminOrdersLoadStatus = "loading" | "success" | "empty" | "error";

export interface AdminOrdersPageState {
  status: AdminOrdersLoadStatus;
  items: Order[];
  total: number;
  filters: OrderFilters;
  errorMessage: string | null;
  requestId: string | null;
}

export interface Order {
  id?: number;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  specialInstructions?: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus?: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpayKeyId?: string;
  currency?: string;
  amountPaise?: number;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  items: OrderItem[];
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  message: string;
}

export interface OtpDispatchResponse {
  message: string;
  recipient: string;
}

export interface Banner {
  id: number;
  title?: string;
  desktopImageUrl: string;
  mobileImageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  linkedProductId?: number;
  displayOrder: number;
  isActive: boolean;
}

export interface StoreSettings {
  id: number;
  siteTitle: string;
  metaDescription?: string;
  logoUrl?: string;
  faviconUrl?: string;
  footerText?: string;
  announcementItems: string[];
  instagramUrl?: string;
  whatsappNumber?: string;
  shopPhone?: string;
  supportEmail?: string;
  catalogueUrl?: string;
  contactUrl?: string;
}

export interface StorefrontBootstrap {
  sections: Section[];
  products: Product[];
  banners: Banner[];
  settings: StoreSettings;
}

export interface CatalogMediaUploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: "image" | "video" | "raw";
}

export interface CommunityMedia {
  id: number;
  title?: string;
  caption?: string;
  mediaType: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  videoPublicId?: string;
  videoWidth?: number;
  videoHeight?: number;
  videoDuration?: number;
  actionLink?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  avatar?: string;
  date: string;
}

export interface DashboardStats {
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  conversionRate: number;
  totalProducts: number;
  totalSections: number;
  totalBanners?: number;
  totalCommunityMedia?: number;
  topSellingProducts: TopSellingProduct[];
}

export interface TopSellingProduct {
  productId: number;
  productName: string;
  unitsSold: number;
  revenue: number;
}
