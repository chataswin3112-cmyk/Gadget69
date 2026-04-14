import { Section, Product, Banner, StoreSettings, Review, CommunityMedia } from "@/types";
import { INSTAGRAM_URL, WHATSAPP_NUMBER } from "@/lib/social-links";

export const mockSections: Section[] = [
  { id: 1, name: "Smartphones", description: "Premium flagship smartphones", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600", is_active: true, show_in_explore: true, show_in_top_category: true },
  { id: 2, name: "Laptops", description: "Ultra-thin powerhouse laptops", imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600", is_active: true, show_in_explore: true, show_in_top_category: true },
  { id: 3, name: "Audio", description: "Hi-fi headphones & speakers", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", is_active: true, show_in_explore: true, show_in_top_category: true },
  { id: 4, name: "Wearables", description: "Smartwatches & fitness trackers", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", is_active: true, show_in_explore: true, show_in_top_category: true },
  { id: 5, name: "Accessories", description: "Cases, chargers & more", imageUrl: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600", is_active: true, show_in_explore: true, show_in_top_category: false },
  { id: 6, name: "Gaming", description: "Controllers, consoles & gear", imageUrl: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600", is_active: true, show_in_explore: true, show_in_top_category: false },
];

export const mockProducts: Product[] = [

  // ── Smartphones (sectionId: 1) ──────────────────────────────────────────
  { id: 1,  name: "Gadget Pro Max",         description: "The ultimate flagship smartphone with titanium body, 6.9\" OLED display, triple 200MP camera system, and all-day adaptive battery.",  price: 129999, mrp: 139999, stockQuantity: 25, sectionId: 1, sectionName: "Smartphones", imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600", createdAt: "2024-01-15", offer: true, offerPrice: 114999, is_new_launch: true, model_number: "G69-PM-001",
    variants: [
      { id: 1, productId: 1, colorName: "Midnight Black", hexCode: "#1a1a2e", sku: "G69-PM-BLK", stock: 10, priceAdjustment: 0,    isDefault: true,  images: [{ id: 1, variantId: 1, imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600", displayOrder: 0, isPrimary: true }] },
      { id: 2, productId: 1, colorName: "Rose Gold",     hexCode: "#b76e79", sku: "G69-PM-RSG", stock: 8,  priceAdjustment: 2000, isDefault: false, images: [{ id: 2, variantId: 2, imageUrl: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600", displayOrder: 0, isPrimary: true }] },
    ]
  },
  { id: 2,  name: "Gadget Ultra Fold",      description: "Next-gen foldable smartphone with 7.8\" inner AMOLED display, S-Pen support, and AI-powered camera.",                                 price: 179999, mrp: 199999, stockQuantity: 18, sectionId: 1, sectionName: "Smartphones", imageUrl: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600", createdAt: "2024-02-10", offer: true, offerPrice: 164999, is_new_launch: true, model_number: "G69-UF-002" },
  { id: 3,  name: "Gadget Lite 5G",         description: "Affordable 5G smartphone with 6.5\" Super AMOLED, 108MP camera, and 5000mAh fast-charge battery.",                                    price: 29999,  mrp: 34999,  stockQuantity: 80, sectionId: 1, sectionName: "Smartphones", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",      createdAt: "2024-03-01", is_best_seller: true, model_number: "G69-L5-003" },
  { id: 4,  name: "Gadget Edge Pro",        description: "Curved-edge display, Snapdragon 8 Gen 3, 144Hz refresh rate, and the fastest under-display fingerprint sensor.",                      price: 79999,  mrp: 89999,  stockQuantity: 35, sectionId: 1, sectionName: "Smartphones", imageUrl: "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600",      createdAt: "2024-02-25", model_number: "G69-EP-004" },
  { id: 5,  name: "Gadget Mini X",          description: "Compact powerhouse—5.8\" OLED, 50MP camera, 256GB storage in a palm-sized design.",                                                   price: 54999,  mrp: 59999,  stockQuantity: 45, sectionId: 1, sectionName: "Smartphones", imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600",      createdAt: "2024-01-20", is_new_launch: true, model_number: "G69-MX-005" },

  // ── Laptops (sectionId: 2) ──────────────────────────────────────────────
  { id: 6,  name: "Gadget Book Air",        description: "Ultra-thin laptop with M3 chip, 15\" Liquid Retina display, 18-hour battery, and fanless silent design.",                             price: 149999, mrp: 159999, stockQuantity: 15, sectionId: 2, sectionName: "Laptops", imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600",      createdAt: "2024-01-20", offer: true, offerPrice: 134999, is_best_seller: true, model_number: "G69-BA-006" },
  { id: 7,  name: "Gadget Book Pro 16",     description: "Powerhouse creator laptop—M3 Max chip, 16\" ProMotion display, dedicated GPU, 64GB unified RAM.",                                     price: 219999, mrp: 239999, stockQuantity: 10, sectionId: 2, sectionName: "Laptops", imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600",           createdAt: "2024-03-05", model_number: "G69-BP-007" },
  { id: 8,  name: "Gadget ChromeBook 14",   description: "Lightweight Chromebook with 14\" FHD display, Intel Core i5, perfect for students and remote workers.",                               price: 49999,  mrp: 54999,  stockQuantity: 60, sectionId: 2, sectionName: "Laptops", imageUrl: "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=600",      createdAt: "2024-02-15", is_new_launch: true, model_number: "G69-CB-008" },
  { id: 9,  name: "Gadget ThinkPad X",      description: "Business ultrabook—13\" 2K OLED display, Intel Evo certification, MIL-SPEC durability, Thunderbolt 4.",                               price: 99999,  mrp: 109999, stockQuantity: 22, sectionId: 2, sectionName: "Laptops", imageUrl: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600",      createdAt: "2024-01-30", model_number: "G69-TX-009" },
  { id: 10, name: "Gadget ROG Gaming Laptop",description: "16\" QHD 240Hz gaming display, RTX 4070, AMD Ryzen 9, vapor chamber cooling—built for champions.",                                   price: 179999, mrp: 199999, stockQuantity: 12, sectionId: 2, sectionName: "Laptops", imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600",      createdAt: "2024-03-10", is_new_launch: true, model_number: "G69-RL-010" },

  // ── Audio (sectionId: 3) ────────────────────────────────────────────────
  { id: 11, name: "Gadget Pods Elite",      description: "Wireless earbuds with spatial audio, adaptive ANC, 36-hour battery, and IPX5 water resistance.",                                      price: 24999,  mrp: 29999,  stockQuantity: 100,sectionId: 3, sectionName: "Audio", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",      createdAt: "2024-02-01", offer: true, offerPrice: 19999, is_new_launch: true, model_number: "G69-PE-011",
    variants: [
      { id: 3, productId: 11, colorName: "Pearl White", hexCode: "#f5f5f0", sku: "G69-PE-WHT", stock: 50, priceAdjustment: 0, isDefault: true,  images: [{ id: 3, variantId: 3, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", displayOrder: 0, isPrimary: true }] },
      { id: 4, productId: 11, colorName: "Space Gray",  hexCode: "#4a4a4a", sku: "G69-PE-GRY", stock: 30, priceAdjustment: 0, isDefault: false, images: [{ id: 4, variantId: 4, imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600", displayOrder: 0, isPrimary: true }] },
    ]
  },
  { id: 12, name: "Gadget Studio Cans",     description: "Over-ear headphones with 40-hour battery, lossless Hi-Res audio, and plush memory foam ear cushions.",                                price: 39999,  mrp: 44999,  stockQuantity: 50, sectionId: 3, sectionName: "Audio", imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600",      createdAt: "2024-01-25", is_best_seller: true, model_number: "G69-SC-012" },
  { id: 13, name: "Gadget SoundBar 2.1",    description: "Dolby Atmos soundbar with dedicated subwoofer, 120W output, HDMI eARC, and Bluetooth 5.3.",                                           price: 19999,  mrp: 24999,  stockQuantity: 35, sectionId: 3, sectionName: "Audio", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",           createdAt: "2024-02-20", is_new_launch: true, model_number: "G69-SB-013" },
  { id: 14, name: "Gadget Neckband Pro",    description: "Magnetic neckband earphones with 24-hour battery, PureSound ANC, and USB-C quick charge.",                                            price: 5999,   mrp: 7999,   stockQuantity: 150,sectionId: 3, sectionName: "Audio", imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600",      createdAt: "2024-03-12", model_number: "G69-NB-014" },
  { id: 15, name: "Gadget BT Speaker 360", "description": "360° surround sound portable speaker, IPX7 waterproof, 20-hour playtime, RGB glow ring.",                                            price: 8999,   mrp: 10999,  stockQuantity: 75, sectionId: 3, sectionName: "Audio", imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600",      createdAt: "2024-01-28", is_best_seller: true, model_number: "G69-BS-015" },

  // ── Wearables (sectionId: 4) ────────────────────────────────────────────
  { id: 16, name: "Gadget Watch Ultra",     description: "Premium smartwatch with titanium case, dual-band GPS, blood oxygen, ECG, and 60-hour battery life.",                                  price: 49999,  mrp: 54999,  stockQuantity: 30, sectionId: 4, sectionName: "Wearables", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",  createdAt: "2024-03-01", is_new_launch: true, model_number: "G69-WU-016" },
  { id: 17, name: "Gadget Band Pro",        description: "Slim fitness band with 1.8\" AMOLED display, 100+ sport modes, and 14-day battery.",                                                  price: 9999,   mrp: 12999,  stockQuantity: 200,sectionId: 4, sectionName: "Wearables", imageUrl: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600",  createdAt: "2024-02-20", is_best_seller: true, model_number: "G69-FT-017" },
  { id: 18, name: "Gadget Smart Ring",      description: "Titanium health-tracking ring—sleep, HRV, stress score, and temperature monitoring, 7-day battery.",                                  price: 19999,  mrp: 22999,  stockQuantity: 40, sectionId: 4, sectionName: "Wearables", imageUrl: "https://images.unsplash.com/photo-1545289414-1c3cb1c06238?w=600",  createdAt: "2024-02-05", is_new_launch: true, model_number: "G69-SR-018" },
  { id: 19, name: "Gadget Watch SE",        description: "Everyday smartwatch with bright always-on display, crash detection, and Siri/Google Assistant.",                                      price: 24999,  mrp: 27999,  stockQuantity: 55, sectionId: 4, sectionName: "Wearables", imageUrl: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=600",  createdAt: "2024-01-15", model_number: "G69-WS-019" },
  { id: 20, name: "Gadget Kids Band",       description: "Safe, colorful kids fitness band with GPS tracking, SOS button, school mode, and parental app.",                                      price: 4999,   mrp: 5999,   stockQuantity: 120,sectionId: 4, sectionName: "Wearables", imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600",  createdAt: "2024-03-08", model_number: "G69-KB-020" },

  // ── Accessories (sectionId: 5) ──────────────────────────────────────────
  { id: 21, name: "Gadget MagCharge 15W",   description: "Magnetic wireless charger pad with 15W fast charging, LED status ring, and over-charge protection.",                                  price: 3999,   mrp: 4999,   stockQuantity: 150,sectionId: 5, sectionName: "Accessories", imageUrl: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600",    createdAt: "2024-01-10", is_best_seller: true, model_number: "G69-MC-021" },
  { id: 22, name: "Gadget Shield Case",     description: "Military-grade drop protection case with MagSafe ring, raised camera lip, raised bezel, clear back.",                                 price: 2999,   mrp: 3499,   stockQuantity: 300,sectionId: 5, sectionName: "Accessories", imageUrl: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600",    createdAt: "2024-03-15", model_number: "G69-SC-022" },
  { id: 23, name: "Gadget 65W GaN Charger", description: "Compact 65W GaN USB-C charger with 3-port simultaneous charging for phone + laptop + tablet.",                                       price: 2499,   mrp: 2999,   stockQuantity: 200,sectionId: 5, sectionName: "Accessories", imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600",    createdAt: "2024-02-10", is_new_launch: true, model_number: "G69-GN-023" },
  { id: 24, name: "Gadget Power Bank 20K",  description: "20,000mAh slim power bank with 65W PD, 22.5W Warp charge, dual USB-A + USB-C output.",                                               price: 3499,   mrp: 4499,   stockQuantity: 180,sectionId: 5, sectionName: "Accessories", imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600",    createdAt: "2024-01-22", model_number: "G69-PB-024" },
  { id: 25, name: "Gadget Smart Hub USB4",  description: "7-in-1 USB-C hub—4K HDMI, 100W PD passthrough, SD/TF reader, Gigabit Ethernet, dual USB 3.2.",                                       price: 4999,   mrp: 5999,   stockQuantity: 90, sectionId: 5, sectionName: "Accessories", imageUrl: "https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=600",    createdAt: "2024-03-20", is_new_launch: true, model_number: "G69-HB-025" },

  // ── Gaming (sectionId: 6) ───────────────────────────────────────────────
  { id: 26, name: "Gadget Controller Pro",  description: "Wireless game controller with Hall-effect triggers, back paddles, RGB, and 20-hour battery for PC & mobile.",                         price: 7999,   mrp: 9999,   stockQuantity: 60, sectionId: 6, sectionName: "Gaming", imageUrl: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600",      createdAt: "2024-02-14", is_new_launch: true, model_number: "G69-CP-026" },
  { id: 27, name: "Gadget Gaming Headset",  description: "7.1 surround sound gaming headset, 50mm drivers, noise-cancelling boom mic, memory foam ear pads.",                                  price: 5999,   mrp: 7499,   stockQuantity: 85, sectionId: 6, sectionName: "Gaming", imageUrl: "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=600",      createdAt: "2024-01-18", is_best_seller: true, model_number: "G69-GH-027" },
  { id: 28, name: "Gadget Mech Keyboard",   description: "TKL mechanical keyboard with Red switches, RGB per-key backlight, PBT keycaps, and USB-C detachable cable.",                          price: 8999,   mrp: 10999,  stockQuantity: 45, sectionId: 6, sectionName: "Gaming", imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",      createdAt: "2024-03-02", is_new_launch: true, model_number: "G69-KB-028" },
  { id: 29, name: "Gadget Gaming Mouse",    description: "25,600 DPI optical gaming mouse, 9 programmable buttons, 95g ultralight, 60-hour wireless battery.",                                 price: 4999,   mrp: 5999,   stockQuantity: 110,sectionId: 6, sectionName: "Gaming", imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600",      createdAt: "2024-02-08", model_number: "G69-GM-029" },
  { id: 30, name: "Gadget Capture Card 4K", description: "4K60 HDMI capture card for streaming & recording—plug-and-play, zero-latency passthrough, OBS ready.",                               price: 6999,   mrp: 8499,   stockQuantity: 30, sectionId: 6, sectionName: "Gaming", imageUrl: "https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=600",      createdAt: "2024-01-30", model_number: "G69-CC-030" },
];

export const mockBanners: Banner[] = [
  { id: 1, title: "New MZ Pro Max — Redefine Premium", desktopImageUrl: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1400&h=500&fit=crop", ctaText: "Shop Now", ctaLink: "/products/1", displayOrder: 0, isActive: true },
  { id: 2, title: "MZ Pods Elite — Pure Sound", desktopImageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&h=500&fit=crop", ctaText: "Explore Audio", ctaLink: "/categories/3", displayOrder: 1, isActive: true },
  { id: 3, title: "MZ Book Air — Impossibly Thin", desktopImageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1400&h=500&fit=crop", ctaText: "Discover", ctaLink: "/products/3", displayOrder: 2, isActive: true },
];

export const mockSettings: StoreSettings = {
  id: 1,
  siteTitle: "Gadget69",
  metaDescription: "Premium electronics crafted for those who demand excellence. Shop smartphones, laptops, audio & more.",
  announcementItems: [
    "Free shipping on orders over ₹999",
    "New arrivals every week — stay tuned!",
    "2-year warranty on all products",
  ],
  instagramUrl: INSTAGRAM_URL,
  facebookUrl: "https://facebook.com",
  whatsappNumber: WHATSAPP_NUMBER,
  catalogueUrl: "#",
  contactUrl: "/contact",
  footerText: "Premium electronics crafted for those who demand excellence. Experience luxury technology.",
};

export const mockCommunityMedia: CommunityMedia[] = [
  {
    id: 1,
    title: "Join The Clan 🔥",
    caption: "See how the Gadget69 community unboxes, reviews, and creates with the latest drops.",
    mediaType: "VIDEO",
    // Direct MP4 — always plays, no YouTube restrictions
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1593640408182-31c228cc32d2?w=960&h=540&fit=crop",
    displayOrder: 0,
    isActive: true,
  },
  {
    id: 2,
    title: "Desk Setup Goals",
    caption: "A clean creator desk built around the latest Gadget69 picks.",
    mediaType: "IMAGE",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&h=1200&fit=crop",
    displayOrder: 1,
    isActive: true,
    actionLink: "/products?filter=new",
  },
  {
    id: 3,
    title: "Pocket-Ready Power",
    caption: "Flagship phones and accessories styled for everyday carry.",
    mediaType: "IMAGE",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&h=1200&fit=crop",
    displayOrder: 2,
    isActive: true,
    actionLink: "/categories/1",
  },
  {
    id: 4,
    title: "Sound On",
    caption: "Wireless audio essentials that look as sharp as they sound.",
    mediaType: "IMAGE",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&h=1200&fit=crop",
    displayOrder: 3,
    isActive: true,
    actionLink: "/categories/3",
  },
  {
    id: 5,
    title: "Work Anywhere",
    caption: "Portable laptops and wearables ready for travel days and deep focus.",
    mediaType: "IMAGE",
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&h=1200&fit=crop",
    displayOrder: 4,
    isActive: true,
    actionLink: "/categories/2",
  },
];

export const mockReviews: Review[] = [
  { id: 1, name: "Arjun Mehta", rating: 5, comment: "The Gadget Pro Max is absolutely stunning. The build quality and camera are on another level — feels premium in every way.", date: "2024-03-10" },
  { id: 2, name: "Priya Sharma", rating: 5, comment: "Ordered the Book Air and it arrived beautifully packaged. Performance is incredible for everyday work and creative tasks.", date: "2024-02-28" },
  { id: 3, name: "Rahul Verma", rating: 4, comment: "The Pods Elite sound amazing. Noise cancellation is top-tier and the battery easily lasts a full day.", date: "2024-03-05" },
  { id: 4, name: "Sneha Nair", rating: 5, comment: "Got the Watch Ultra last month — the GPS accuracy and sleep tracking are genuinely life-changing. Love every feature.", date: "2024-03-18" },
  { id: 5, name: "Karthik Rajan", rating: 5, comment: "Delivery was super fast and the product was exactly as described. Gadget69 is my go-to store for premium electronics.", date: "2024-03-22" },
  { id: 6, name: "Divya Krishnan", rating: 4, comment: "The ROG Gaming Laptop handles AAA titles at ultra settings without breaking a sweat. Seriously impressed with the cooling.", date: "2024-03-14" },
  { id: 7, name: "Mohammed Irfan", rating: 5, comment: "Customer service is exceptional. Had a small issue with my order and it was resolved same-day. Will absolutely buy again.", date: "2024-03-25" },
  { id: 8, name: "Ananya Patel", rating: 5, comment: "The GaN 65W charger is tiny but powerful. Charges my laptop, phone and earbuds all at once. Highly recommend.", date: "2024-02-20" },
  { id: 9, name: "Vikram Suresh", rating: 4, comment: "Gaming headset audio clarity is phenomenal. The boom mic picks up every word clearly, even in loud rooms.", date: "2024-03-08" },
];
