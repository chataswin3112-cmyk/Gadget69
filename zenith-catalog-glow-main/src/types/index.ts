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
}

export interface VariantMedia {
  id: number;
  variantId?: number;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
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
  stockQuantity: number;
  sectionId: number;
  sectionName?: string;
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
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariantId?: number;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
}

export type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | string;
export type OrderStatus = "PLACED" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | string;

export interface Order {
  id?: number;
  customerName: string;
  phone: string;
  address: string;
  pincode: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus?: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpayKeyId?: string;
  currency?: string;
  amountPaise?: number;
  createdAt?: string;
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
  facebookUrl?: string;
  whatsappNumber?: string;
  catalogueUrl?: string;
  contactUrl?: string;
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
