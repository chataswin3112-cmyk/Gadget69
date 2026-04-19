import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Banner, CommunityMedia, Product, Review, Section, StoreSettings } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  getProducts,
  getAdminProducts,
  createProduct as createProductApi,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi,
} from "@/api/productApi";
import {
  getSections,
  getAdminSections,
  createSection as createSectionApi,
  updateSection as updateSectionApi,
  deleteSection as deleteSectionApi,
} from "@/api/sectionApi";
import {
  getBanners,
  getAdminBanners,
  createBanner as createBannerApi,
  updateBanner as updateBannerApi,
  deleteBanner as deleteBannerApi,
} from "@/api/bannerApi";
import { getSettings, getAdminSettings, updateSettings as updateSettingsApi } from "@/api/settingsApi";
import {
  getCommunityMedia,
  getAdminCommunityMedia,
  createCommunityMedia as createCommunityMediaApi,
  updateCommunityMedia as updateCommunityMediaApi,
  deleteCommunityMedia as deleteCommunityMediaApi,
} from "@/api/communityApi";
import {
  getReviews,
  getAdminReviews,
  createReview as createReviewApi,
  updateReview as updateReviewApi,
  deleteReview as deleteReviewApi,
} from "@/api/reviewApi";
import { resolveMediaUrl } from "@/lib/media";

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

const sortReviews = (items: Review[]) =>
  [...items].sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id - a.id);

const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
const CATALOG_CACHE_VERSION = 1;

interface CatalogCacheSnapshot {
  banners: Banner[];
  communityMedia: CommunityMedia[];
  products: Product[];
  reviews: Review[];
  sections: Section[];
  settings: StoreSettings;
  timestamp: number;
  version: number;
}

const getCatalogCacheKey = (isAuthenticated: boolean) =>
  `gadget69_catalog_cache_${isAuthenticated ? "admin" : "public"}`;

const loadCatalogCache = (isAuthenticated: boolean): CatalogCacheSnapshot | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getCatalogCacheKey(isAuthenticated));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<CatalogCacheSnapshot>;
    if (
      parsed.version !== CATALOG_CACHE_VERSION ||
      typeof parsed.timestamp !== "number" ||
      Date.now() - parsed.timestamp > CATALOG_CACHE_TTL_MS
    ) {
      return null;
    }

    return {
      banners: Array.isArray(parsed.banners) ? parsed.banners : [],
      communityMedia: Array.isArray(parsed.communityMedia) ? parsed.communityMedia : [],
      products: Array.isArray(parsed.products) ? parsed.products : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      settings:
        parsed.settings && typeof parsed.settings === "object"
          ? ({ ...defaultSettings, ...parsed.settings } as StoreSettings)
          : defaultSettings,
      timestamp: parsed.timestamp,
      version: CATALOG_CACHE_VERSION,
    };
  } catch {
    return null;
  }
};

const persistCatalogCache = (
  isAuthenticated: boolean,
  snapshot: Omit<CatalogCacheSnapshot, "timestamp" | "version">
) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload: CatalogCacheSnapshot = {
    ...snapshot,
    timestamp: Date.now(),
    version: CATALOG_CACHE_VERSION,
  };

  window.localStorage.setItem(getCatalogCacheKey(isAuthenticated), JSON.stringify(payload));
};

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const initialCache = useMemo(() => loadCatalogCache(isAuthenticated), [isAuthenticated]);
  const [sections, setSections] = useState<Section[]>(initialCache?.sections ?? []);
  const [products, setProducts] = useState<Product[]>(initialCache?.products ?? []);
  const [banners, setBanners] = useState<Banner[]>(initialCache?.banners ?? []);
  const [settings, setSettings] = useState<StoreSettings>(initialCache?.settings ?? defaultSettings);
  const [communityMedia, setCommunityMedia] = useState<CommunityMedia[]>(
    initialCache?.communityMedia ?? []
  );
  const [reviews, setReviews] = useState<Review[]>(initialCache?.reviews ?? []);
  const [isLoading, setIsLoading] = useState(!initialCache);

  const applySnapshot = useCallback(
    (snapshot: Omit<CatalogCacheSnapshot, "timestamp" | "version">) => {
      startTransition(() => {
        setSections(snapshot.sections);
        setProducts(snapshot.products);
        setBanners(snapshot.banners);
        setSettings(snapshot.settings);
        setCommunityMedia(snapshot.communityMedia);
        setReviews(snapshot.reviews);
        setIsLoading(false);
      });
    },
    []
  );

  const loadAll = useCallback(async (showLoader: boolean) => {
    if (showLoader) {
      setIsLoading(true);
    }

    const safeFetch = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await fn();
      } catch {
        return fallback;
      }
    };

    try {
      const [sectionsData, productsData, bannersData, settingsData, communityData, reviewsData] =
        await Promise.all([
          safeFetch(isAuthenticated ? getAdminSections : getSections, [] as Section[]),
          safeFetch(isAuthenticated ? getAdminProducts : getProducts, [] as Product[]),
          safeFetch(isAuthenticated ? getAdminBanners : getBanners, [] as Banner[]),
          safeFetch(isAuthenticated ? getAdminSettings : getSettings, defaultSettings),
          safeFetch(isAuthenticated ? getAdminCommunityMedia : getCommunityMedia, [] as CommunityMedia[]),
          safeFetch(isAuthenticated ? getAdminReviews : getReviews, [] as Review[]),
        ]);

      const snapshot = {
        sections: sortSections(sectionsData as Section[]),
        products: sortProducts(productsData as Product[]),
        banners: sortBanners(bannersData as Banner[]),
        settings: settingsData as StoreSettings,
        communityMedia: sortCommunity(communityData as CommunityMedia[]),
        reviews: sortReviews(reviewsData as Review[]),
      };

      persistCatalogCache(isAuthenticated, snapshot);
      applySnapshot(snapshot);
    } catch (error) {
      console.warn("Unexpected error loading catalog data", error);
      applySnapshot({
        sections: [],
        products: [],
        banners: [],
        settings: defaultSettings,
        communityMedia: [],
        reviews: [],
      });
    } finally {
      if (!showLoader) {
        setIsLoading(false);
      }
    }
  }, [applySnapshot, isAuthenticated]);

  const refreshAll = useCallback(async () => {
    await loadAll(true);
  }, [loadAll]);

  useEffect(() => {
    const cached = loadCatalogCache(isAuthenticated);
    if (cached) {
      applySnapshot({
        sections: cached.sections,
        products: cached.products,
        banners: cached.banners,
        settings: cached.settings,
        communityMedia: cached.communityMedia,
        reviews: cached.reviews,
      });
      void loadAll(false);
      return;
    }

    setIsLoading(true);
    void loadAll(true);
  }, [applySnapshot, isAuthenticated, loadAll]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.title = `${settings.siteTitle || "Gadget69"} - Premium Electronics`;

    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      "content",
      settings.metaDescription ||
        "Premium electronics crafted for those who demand excellence. Experience luxury technology at Gadget69."
    );

    const iconHref = resolveMediaUrl(settings.faviconUrl) || "/favicon.svg";
    const iconSelectors = ['link[rel="icon"]', 'link[rel="apple-touch-icon"]'] as const;

    iconSelectors.forEach((selector) => {
      let link = document.querySelector(selector) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = selector.includes("apple-touch-icon") ? "apple-touch-icon" : "icon";
        document.head.appendChild(link);
      }
      link.href = iconHref;
    });
  }, [settings.faviconUrl, settings.metaDescription, settings.siteTitle]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    persistCatalogCache(isAuthenticated, {
      sections,
      products,
      banners,
      settings,
      communityMedia,
      reviews,
    });
  }, [banners, communityMedia, isAuthenticated, isLoading, products, reviews, sections, settings]);

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

  const addReview = useCallback(async (review: Partial<Review>): Promise<Review> => {
    const created = await createReviewApi(review);
    setReviews((prev) => sortReviews([...prev, created]));
    return created;
  }, []);

  const updateReview = useCallback(async (id: number, data: Partial<Review>): Promise<Review> => {
    const updated = await updateReviewApi(id, data);
    setReviews((prev) => sortReviews(prev.map((item) => (item.id === id ? updated : item))));
    return updated;
  }, []);

  const deleteReview = useCallback(async (id: number) => {
    await deleteReviewApi(id);
    setReviews((prev) => prev.filter((item) => item.id !== id));
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
