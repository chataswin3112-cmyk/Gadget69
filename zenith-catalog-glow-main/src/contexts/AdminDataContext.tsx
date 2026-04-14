import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Banner, CommunityMedia, Product, Review, Section, StoreSettings } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { getProducts, getAdminProducts, createProduct as createProductApi, updateProduct as updateProductApi, deleteProduct as deleteProductApi } from "@/api/productApi";
import { getSections, getAdminSections, createSection as createSectionApi, updateSection as updateSectionApi, deleteSection as deleteSectionApi } from "@/api/sectionApi";
import { getBanners, getAdminBanners, createBanner as createBannerApi, updateBanner as updateBannerApi, deleteBanner as deleteBannerApi } from "@/api/bannerApi";
import { getSettings, getAdminSettings, updateSettings as updateSettingsApi } from "@/api/settingsApi";
import { getCommunityMedia, getAdminCommunityMedia, createCommunityMedia as createCommunityMediaApi, updateCommunityMedia as updateCommunityMediaApi, deleteCommunityMedia as deleteCommunityMediaApi } from "@/api/communityApi";
import { mockBanners, mockCommunityMedia, mockProducts, mockReviews, mockSections, mockSettings } from "@/data/mockData";

interface AdminDataContextType {
  sections: Section[];
  products: Product[];
  banners: Banner[];
  settings: StoreSettings;
  communityMedia: CommunityMedia[];
  reviews: Review[];
  isLoading: boolean;
  refreshAll: () => Promise<void>;
  addSection: (section: Partial<Section>) => Promise<Section>;
  updateSection: (id: number, data: Partial<Section>) => Promise<Section>;
  deleteSection: (id: number) => Promise<void>;
  addProduct: (product: Partial<Product>) => Promise<Product>;
  updateProduct: (id: number, data: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
  addBanner: (banner: Partial<Banner>) => Promise<Banner>;
  updateBanner: (id: number, data: Partial<Banner>) => Promise<Banner>;
  deleteBanner: (id: number) => Promise<void>;
  updateSettings: (data: Partial<StoreSettings>) => Promise<StoreSettings>;
  addCommunityMedia: (item: Partial<CommunityMedia>) => Promise<CommunityMedia>;
  updateCommunityMedia: (id: number, data: Partial<CommunityMedia>) => Promise<CommunityMedia>;
  deleteCommunityMedia: (id: number) => Promise<void>;
  addReview: (review: Partial<Review>) => Promise<Review>;
  updateReview: (id: number, data: Partial<Review>) => Promise<Review>;
  deleteReview: (id: number) => Promise<void>;
}

const defaultSettings: StoreSettings = {
  id: 1,
  siteTitle: "Gadget69",
  announcementItems: [],
};

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

const sortSections = (items: Section[]) =>
  [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));

const sortProducts = (items: Product[]) =>
  [...items].sort(
    (a, b) =>
      (a.display_order ?? 0) - (b.display_order ?? 0) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

const sortBanners = (items: Banner[]) =>
  [...items].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);

const sortCommunity = (items: CommunityMedia[]) =>
  [...items].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);

const REVIEWS_STORAGE_KEY = "gadget69_admin_reviews";

const loadStoredReviews = (): Review[] | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.map((item, index) => ({
      id: Number(item?.id) || index + 1,
      name: typeof item?.name === "string" ? item.name : "Anonymous",
      rating: typeof item?.rating === "number" ? item.rating : 5,
      comment: typeof item?.comment === "string" ? item.comment : "",
      avatar: typeof item?.avatar === "string" ? item.avatar : undefined,
      date: typeof item?.date === "string" ? item.date : new Date().toISOString().slice(0, 10),
    }));
  } catch {
    return null;
  }
};

const persistReviews = (items: Review[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(items));
};

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [communityMedia, setCommunityMedia] = useState<CommunityMedia[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const nextReviewId = useCallback(
    () => Math.max(0, ...reviews.map((r) => r.id)) + 1,
    [reviews]
  );

  const refreshAll = useCallback(async () => {
    setIsLoading(true);

    const safeFetch = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
      try { return await fn(); } catch { return fallback; }
    };

    try {
      const [sectionsData, productsData, bannersData, settingsData, communityData] =
        await Promise.all([
          safeFetch(isAuthenticated ? getAdminSections : getSections, mockSections),
          safeFetch(isAuthenticated ? getAdminProducts : getProducts, mockProducts),
          safeFetch(isAuthenticated ? getAdminBanners : getBanners, mockBanners),
          safeFetch(isAuthenticated ? getAdminSettings : getSettings, mockSettings),
          safeFetch(isAuthenticated ? getAdminCommunityMedia : getCommunityMedia, mockCommunityMedia),
        ]);

      setSections(sortSections(sectionsData as Section[]));
      setProducts(sortProducts(productsData as Product[]));
      setBanners(sortBanners(bannersData as Banner[]));
      setSettings(settingsData as StoreSettings);
      setCommunityMedia(sortCommunity(communityData as CommunityMedia[]));
      setReviews(loadStoredReviews() ?? mockReviews);
    } catch (error) {
      console.warn("Unexpected error loading data — using full mock", error);
      setSections(sortSections(mockSections));
      setProducts(sortProducts(mockProducts));
      setBanners(sortBanners(mockBanners));
      setSettings(mockSettings);
      setCommunityMedia(sortCommunity(mockCommunityMedia));
      setReviews(loadStoredReviews() ?? mockReviews);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const addSection = useCallback(async (section: Partial<Section>) => {
    const created = await createSectionApi(section);
    setSections((prev) => sortSections([...prev, created]));
    return created;
  }, []);

  const updateSection = useCallback(async (id: number, data: Partial<Section>) => {
    const updated = await updateSectionApi(id, data);
    setSections((prev) => sortSections(prev.map((item) => (item.id === id ? updated : item))));
    return updated;
  }, []);

  const deleteSection = useCallback(async (id: number) => {
    await deleteSectionApi(id);
    setSections((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addProduct = useCallback(async (product: Partial<Product>) => {
    const created = await createProductApi(product);
    setProducts((prev) => sortProducts([...prev, created]));
    return created;
  }, []);

  const updateProduct = useCallback(async (id: number, data: Partial<Product>) => {
    const updated = await updateProductApi(id, data);
    setProducts((prev) => sortProducts(prev.map((item) => (item.id === id ? updated : item))));
    return updated;
  }, []);

  const deleteProduct = useCallback(async (id: number) => {
    await deleteProductApi(id);
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addBanner = useCallback(async (banner: Partial<Banner>) => {
    const created = await createBannerApi(banner);
    setBanners((prev) => sortBanners([...prev, created]));
    return created;
  }, []);

  const updateBanner = useCallback(async (id: number, data: Partial<Banner>) => {
    const updated = await updateBannerApi(id, data);
    setBanners((prev) => sortBanners(prev.map((item) => (item.id === id ? updated : item))));
    return updated;
  }, []);

  const deleteBanner = useCallback(async (id: number) => {
    await deleteBannerApi(id);
    setBanners((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateSettings = useCallback(async (data: Partial<StoreSettings>) => {
    const updated = await updateSettingsApi(data);
    setSettings(updated);
    return updated;
  }, []);

  const addCommunityMedia = useCallback(async (item: Partial<CommunityMedia>) => {
    const created = await createCommunityMediaApi(item);
    setCommunityMedia((prev) => sortCommunity([...prev, created]));
    return created;
  }, []);

  const updateCommunityMedia = useCallback(async (id: number, data: Partial<CommunityMedia>) => {
    const updated = await updateCommunityMediaApi(id, data);
    setCommunityMedia((prev) => sortCommunity(prev.map((item) => (item.id === id ? updated : item))));
    return updated;
  }, []);

  const deleteCommunityMedia = useCallback(async (id: number) => {
    await deleteCommunityMediaApi(id);
    setCommunityMedia((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // ── Reviews (local-only CRUD; wire to API when backend supports it) ──
  const addReview = useCallback(async (review: Partial<Review>): Promise<Review> => {
    const created: Review = {
      id: nextReviewId(),
      name: review.name || "Anonymous",
      rating: review.rating ?? 5,
      comment: review.comment || "",
      avatar: review.avatar,
      date: review.date || new Date().toISOString().slice(0, 10),
    };
    setReviews((prev) => {
      const next = [...prev, created];
      persistReviews(next);
      return next;
    });
    return created;
  }, [nextReviewId]);

  const updateReview = useCallback(async (id: number, data: Partial<Review>): Promise<Review> => {
    let updated!: Review;
    setReviews((prev) => {
      const next = prev.map((r) => {
        if (r.id === id) { updated = { ...r, ...data }; return updated; }
        return r;
      });
      persistReviews(next);
      return next;
    });
    return updated;
  }, []);

  const deleteReview = useCallback(async (id: number) => {
    setReviews((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persistReviews(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      sections,
      products,
      banners,
      settings,
      communityMedia,
      reviews,
      isLoading,
      refreshAll,
      addSection,
      updateSection,
      deleteSection,
      addProduct,
      updateProduct,
      deleteProduct,
      addBanner,
      updateBanner,
      deleteBanner,
      updateSettings,
      addCommunityMedia,
      updateCommunityMedia,
      deleteCommunityMedia,
      addReview,
      updateReview,
      deleteReview,
    }),
    [
      sections,
      products,
      banners,
      settings,
      communityMedia,
      reviews,
      isLoading,
      refreshAll,
      addSection,
      updateSection,
      deleteSection,
      addProduct,
      updateProduct,
      deleteProduct,
      addBanner,
      updateBanner,
      deleteBanner,
      updateSettings,
      addCommunityMedia,
      updateCommunityMedia,
      deleteCommunityMedia,
      addReview,
      updateReview,
      deleteReview,
    ]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
};

export const useAdminData = () => {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error("useAdminData must be used within AdminDataProvider");
  }
  return ctx;
};
