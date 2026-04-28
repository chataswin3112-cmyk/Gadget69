import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { getStorefrontBootstrap } from "@/api/storefrontApi";
import { scheduleIdleTask } from "@/lib/idle";
import { resolveMediaUrl } from "@/lib/media";

type AdminDataResourceKey =
  | "sections"
  | "products"
  | "banners"
  | "settings"
  | "communityMedia"
  | "reviews";

type ResourceLoadMap = Record<AdminDataResourceKey, boolean>;

interface AdminDataContextType {
  sections: Section[];
  products: Product[];
  banners: Banner[];
  settings: StoreSettings;
  communityMedia: CommunityMedia[];
  reviews: Review[];
  isLoading: boolean;
  refreshAll: () => Promise<void>;
  ensureSectionsLoaded: () => Promise<void>;
  ensureProductsLoaded: () => Promise<void>;
  ensureBannersLoaded: () => Promise<void>;
  ensureSettingsLoaded: () => Promise<void>;
  ensureCommunityMediaLoaded: () => Promise<void>;
  ensureReviewsLoaded: () => Promise<void>;
  ensureStorefrontBootstrapLoaded: () => Promise<void>;
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

const ADMIN_DATA_RESOURCES: AdminDataResourceKey[] = [
  "sections",
  "products",
  "banners",
  "settings",
  "communityMedia",
  "reviews",
];

const STOREFRONT_BOOTSTRAP_RESOURCES: AdminDataResourceKey[] = [
  "sections",
  "products",
  "banners",
  "settings",
];

const defaultSettings: StoreSettings = {
  id: 1,
  siteTitle: "Gadget69",
  announcementItems: [
    "FREE SHIPPING ON ORDERS OVER RS. 999",
    "NEW ARRIVALS EVERY WEEK",
    "EASY ADMIN UPDATES FOR PRODUCTS, BANNERS, AND MEDIA",
  ],
  instagramUrl: "https://www.instagram.com/gadget69_tuty/",
  whatsappNumber: "919361586278",
  shopPhone: "9361586278",
  supportEmail: "natrajganesh2000@gmail.com",
  contactUrl: "/contact",
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
const CATALOG_CACHE_VERSION = 4;

interface CatalogCacheSnapshot {
  banners: Banner[];
  communityMedia: CommunityMedia[];
  loadedResources: AdminDataResourceKey[];
  products: Product[];
  reviews: Review[];
  sections: Section[];
  settings: StoreSettings;
  timestamp: number;
  version: number;
}

const emptyLoadedResourceMap = (): ResourceLoadMap => ({
  sections: false,
  products: false,
  banners: false,
  settings: false,
  communityMedia: false,
  reviews: false,
});

const buildLoadedResourceMap = (resources: AdminDataResourceKey[] = []): ResourceLoadMap => {
  const next = emptyLoadedResourceMap();
  resources.forEach((resource) => {
    next[resource] = true;
  });
  return next;
};

const getLoadedResourceList = (state: ResourceLoadMap) =>
  ADMIN_DATA_RESOURCES.filter((resource) => state[resource]);

const getCatalogCacheKey = (isAuthenticated: boolean) =>
  `gadget69_catalog_cache_${isAuthenticated ? "admin" : "public"}`;

const isUnauthorizedError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "response" in error &&
  (error as { response?: { status?: number } }).response?.status === 401;

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

    const loadedResources = Array.isArray(parsed.loadedResources)
      ? parsed.loadedResources.filter((value): value is AdminDataResourceKey =>
          ADMIN_DATA_RESOURCES.includes(value as AdminDataResourceKey)
        )
      : [];

    return {
      banners: Array.isArray(parsed.banners) ? parsed.banners : [],
      communityMedia: Array.isArray(parsed.communityMedia) ? parsed.communityMedia : [],
      loadedResources,
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

interface AdminDataProviderProps {
  children: React.ReactNode;
  eager?: boolean;
}

export const AdminDataProvider: React.FC<AdminDataProviderProps> = ({
  children,
  eager = true,
}) => {
  const { isAuthenticated } = useAuth();
  const initialCache = useMemo(() => loadCatalogCache(isAuthenticated), [isAuthenticated]);
  const initialLoadedResources = useMemo(
    () => buildLoadedResourceMap(initialCache?.loadedResources),
    [initialCache?.loadedResources]
  );
  const [sections, setSections] = useState<Section[]>(initialCache?.sections ?? []);
  const [products, setProducts] = useState<Product[]>(initialCache?.products ?? []);
  const [banners, setBanners] = useState<Banner[]>(initialCache?.banners ?? []);
  const [settings, setSettings] = useState<StoreSettings>(initialCache?.settings ?? defaultSettings);
  const [communityMedia, setCommunityMedia] = useState<CommunityMedia[]>(
    initialCache?.communityMedia ?? []
  );
  const [reviews, setReviews] = useState<Review[]>(initialCache?.reviews ?? []);
  const [loadedResources, setLoadedResources] = useState<ResourceLoadMap>(initialLoadedResources);
  const [activeLoads, setActiveLoads] = useState(0);
  const inFlightLoadsRef = useRef<Partial<Record<AdminDataResourceKey, Promise<void>>>>({});
  const storefrontBootstrapRef = useRef<Promise<void> | null>(null);
  const loadedResourcesRef = useRef<ResourceLoadMap>(initialLoadedResources);

  useEffect(() => {
    loadedResourcesRef.current = loadedResources;
  }, [loadedResources]);

  const applyCache = useCallback((cache: CatalogCacheSnapshot | null) => {
    const nextLoadedResources = buildLoadedResourceMap(cache?.loadedResources);
    loadedResourcesRef.current = nextLoadedResources;

    startTransition(() => {
      setSections(cache?.sections ?? []);
      setProducts(cache?.products ?? []);
      setBanners(cache?.banners ?? []);
      setSettings(cache?.settings ?? defaultSettings);
      setCommunityMedia(cache?.communityMedia ?? []);
      setReviews(cache?.reviews ?? []);
      setLoadedResources(nextLoadedResources);
      setActiveLoads(0);
    });
  }, []);

  const updateLoadedState = useCallback((resource: AdminDataResourceKey) => {
    loadedResourcesRef.current = {
      ...loadedResourcesRef.current,
      [resource]: true,
    };
    setLoadedResources((current) =>
      current[resource] ? current : { ...current, [resource]: true }
    );
  }, []);

  const updateLoadedStates = useCallback((resources: AdminDataResourceKey[]) => {
    loadedResourcesRef.current = resources.reduce<ResourceLoadMap>(
      (current, resource) => ({
        ...current,
        [resource]: true,
      }),
      loadedResourcesRef.current
    );

    setLoadedResources((current) => {
      let changed = false;
      const next = { ...current };
      resources.forEach((resource) => {
        if (!next[resource]) {
          next[resource] = true;
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, []);

  const runWithLoader = useCallback(async <T,>(showLoader: boolean, task: () => Promise<T>) => {
    if (showLoader) {
      setActiveLoads((current) => current + 1);
    }

    try {
      return await task();
    } finally {
      if (showLoader) {
        setActiveLoads((current) => Math.max(0, current - 1));
      }
    }
  }, []);

  const loadResource = useCallback(
    async (
      resource: AdminDataResourceKey,
      options: {
        force?: boolean;
        showLoader?: boolean;
      } = {}
    ) => {
      const { force = false, showLoader = !loadedResourcesRef.current[resource] } = options;

      if (!force && loadedResourcesRef.current[resource]) {
        return;
      }

      if (
        !force &&
        !isAuthenticated &&
        STOREFRONT_BOOTSTRAP_RESOURCES.includes(resource) &&
        storefrontBootstrapRef.current
      ) {
        return storefrontBootstrapRef.current;
      }

      const existingRequest = inFlightLoadsRef.current[resource];
      if (existingRequest) {
        return existingRequest;
      }

      const request = runWithLoader(showLoader, async () => {
        try {
          switch (resource) {
            case "sections": {
              const data = await (isAuthenticated ? getAdminSections : getSections)();
              startTransition(() => setSections(sortSections(data)));
              break;
            }
            case "products": {
              const data = await (isAuthenticated ? getAdminProducts : getProducts)();
              startTransition(() => setProducts(sortProducts(data)));
              break;
            }
            case "banners": {
              const data = await (isAuthenticated ? getAdminBanners : getBanners)();
              startTransition(() => setBanners(sortBanners(data)));
              break;
            }
            case "settings": {
              const data = await (isAuthenticated ? getAdminSettings : getSettings)();
              startTransition(() => setSettings(data));
              break;
            }
            case "communityMedia": {
              const data = await (
                isAuthenticated ? getAdminCommunityMedia : getCommunityMedia
              )();
              startTransition(() => setCommunityMedia(sortCommunity(data)));
              break;
            }
            case "reviews": {
              const data = await (isAuthenticated ? getAdminReviews : getReviews)();
              startTransition(() => setReviews(sortReviews(data)));
              break;
            }
          }

          updateLoadedState(resource);
        } catch (error) {
          if (!isUnauthorizedError(error)) {
            console.warn(`Failed to load ${resource}`, error);
          }
          throw error;
        } finally {
          delete inFlightLoadsRef.current[resource];
        }
      });

      inFlightLoadsRef.current[resource] = request;
      return request;
    },
    [isAuthenticated, runWithLoader, updateLoadedState]
  );

  const ensureStorefrontBootstrapLoaded = useCallback(async () => {
    if (isAuthenticated) {
      await Promise.all(
        STOREFRONT_BOOTSTRAP_RESOURCES.map((resource) =>
          loadResource(resource, {
            showLoader: false,
          })
        )
      );
      return;
    }

    if (
      STOREFRONT_BOOTSTRAP_RESOURCES.every((resource) => loadedResourcesRef.current[resource])
    ) {
      return;
    }

    if (storefrontBootstrapRef.current) {
      return storefrontBootstrapRef.current;
    }

    const request = runWithLoader(false, async () => {
      try {
        const data = await getStorefrontBootstrap();
        startTransition(() => {
          setSections(sortSections(data.sections));
          setProducts(sortProducts(data.products));
          setBanners(sortBanners(data.banners));
          setSettings({ ...defaultSettings, ...data.settings });
        });
        updateLoadedStates(STOREFRONT_BOOTSTRAP_RESOURCES);
      } catch (error) {
        if (!isUnauthorizedError(error)) {
          console.warn("Failed to load storefront bootstrap", error);
        }
        storefrontBootstrapRef.current = null;
        await Promise.all(
          STOREFRONT_BOOTSTRAP_RESOURCES.map((resource) =>
            loadResource(resource, {
              showLoader: false,
            })
          )
        );
      } finally {
        storefrontBootstrapRef.current = null;
      }
    });

    storefrontBootstrapRef.current = request;
    return request;
  }, [isAuthenticated, loadResource, runWithLoader, updateLoadedStates]);

  const ensureSectionsLoaded = useCallback(
    () => loadResource("sections"),
    [loadResource]
  );
  const ensureProductsLoaded = useCallback(
    () => loadResource("products"),
    [loadResource]
  );
  const ensureBannersLoaded = useCallback(
    () => loadResource("banners"),
    [loadResource]
  );
  const ensureSettingsLoaded = useCallback(
    () => loadResource("settings"),
    [loadResource]
  );
  const ensureCommunityMediaLoaded = useCallback(
    () => loadResource("communityMedia"),
    [loadResource]
  );
  const ensureReviewsLoaded = useCallback(
    () => loadResource("reviews"),
    [loadResource]
  );

  const refreshAll = useCallback(async () => {
    await Promise.all(
      ADMIN_DATA_RESOURCES.map((resource) =>
        loadResource(resource, {
          force: true,
          showLoader: true,
        })
      )
    );
  }, [loadResource]);

  useEffect(() => {
    const cached = loadCatalogCache(isAuthenticated);
    applyCache(cached);

    if (!eager) {
      return;
    }

    void Promise.all(
      ADMIN_DATA_RESOURCES.map((resource) =>
        loadResource(resource, {
          force: Boolean(cached),
          showLoader: !cached,
        })
      )
    );
  }, [applyCache, eager, isAuthenticated, loadResource]);

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
    const loadedResourceList = getLoadedResourceList(loadedResources);
    if (!loadedResourceList.length) {
      return;
    }

    const cancelPersist = scheduleIdleTask(() => {
      persistCatalogCache(isAuthenticated, {
        banners,
        communityMedia,
        loadedResources: loadedResourceList,
        products,
        reviews,
        sections,
        settings,
      });
    }, 1200);

    return cancelPersist;
  }, [
    banners,
    communityMedia,
    isAuthenticated,
    loadedResources,
    products,
    reviews,
    sections,
    settings,
  ]);

  const addSection = useCallback(async (section: Partial<Section>) => {
    const created = await createSectionApi(section);
    updateLoadedState("sections");
    setSections((prev) => sortSections([...prev, created]));
    return created;
  }, [updateLoadedState]);

  const updateSection = useCallback(async (id: number, data: Partial<Section>) => {
    const updated = await updateSectionApi(id, data);
    updateLoadedState("sections");
    setSections((prev) => sortSections(prev.map((item) => (item.id === id ? updated : item))));
    return updated;
  }, [updateLoadedState]);

  const deleteSection = useCallback(async (id: number) => {
    await deleteSectionApi(id);
    updateLoadedState("sections");
    setSections((prev) => prev.filter((item) => item.id !== id));
  }, [updateLoadedState]);

  const addProduct = useCallback(async (product: Partial<Product>) => {
    const created = await createProductApi(product);
    updateLoadedState("products");
    setProducts((prev) => sortProducts([...prev, created]));
    return created;
  }, [updateLoadedState]);

  const updateProduct = useCallback(async (id: number, data: Partial<Product>) => {
    const updated = await updateProductApi(id, data);
    updateLoadedState("products");
    setProducts((prev) => sortProducts(prev.map((item) => (item.id === id ? updated : item))));
    return updated;
  }, [updateLoadedState]);

  const deleteProduct = useCallback(async (id: number) => {
    await deleteProductApi(id);
    updateLoadedState("products");
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }, [updateLoadedState]);

  const addBanner = useCallback(async (banner: Partial<Banner>) => {
    const created = await createBannerApi(banner);
    updateLoadedState("banners");
    setBanners((prev) => sortBanners([...prev, created]));
    return created;
  }, [updateLoadedState]);

  const updateBanner = useCallback(async (id: number, data: Partial<Banner>) => {
    const updated = await updateBannerApi(id, data);
    updateLoadedState("banners");
    setBanners((prev) => sortBanners(prev.map((item) => (item.id === id ? updated : item))));
    return updated;
  }, [updateLoadedState]);

  const deleteBanner = useCallback(async (id: number) => {
    await deleteBannerApi(id);
    updateLoadedState("banners");
    setBanners((prev) => prev.filter((item) => item.id !== id));
  }, [updateLoadedState]);

  const updateSettings = useCallback(async (data: Partial<StoreSettings>) => {
    const updated = await updateSettingsApi(data);
    updateLoadedState("settings");
    setSettings(updated);
    return updated;
  }, [updateLoadedState]);

  const addCommunityMedia = useCallback(async (item: Partial<CommunityMedia>) => {
    const created = await createCommunityMediaApi(item);
    updateLoadedState("communityMedia");
    setCommunityMedia((prev) => sortCommunity([...prev, created]));
    return created;
  }, [updateLoadedState]);

  const updateCommunityMedia = useCallback(async (id: number, data: Partial<CommunityMedia>) => {
    const updated = await updateCommunityMediaApi(id, data);
    updateLoadedState("communityMedia");
    setCommunityMedia((prev) => sortCommunity(prev.map((item) => (item.id === id ? updated : item))));
    return updated;
  }, [updateLoadedState]);

  const deleteCommunityMedia = useCallback(async (id: number) => {
    await deleteCommunityMediaApi(id);
    updateLoadedState("communityMedia");
    setCommunityMedia((prev) => prev.filter((item) => item.id !== id));
  }, [updateLoadedState]);

  const addReview = useCallback(async (review: Partial<Review>): Promise<Review> => {
    const created = await createReviewApi(review);
    updateLoadedState("reviews");
    setReviews((prev) => sortReviews([...prev, created]));
    return created;
  }, [updateLoadedState]);

  const updateReview = useCallback(async (id: number, data: Partial<Review>): Promise<Review> => {
    const updated = await updateReviewApi(id, data);
    updateLoadedState("reviews");
    setReviews((prev) => sortReviews(prev.map((item) => (item.id === id ? updated : item))));
    return updated;
  }, [updateLoadedState]);

  const deleteReview = useCallback(async (id: number) => {
    await deleteReviewApi(id);
    updateLoadedState("reviews");
    setReviews((prev) => prev.filter((item) => item.id !== id));
  }, [updateLoadedState]);

  const value = useMemo(
    () => ({
      sections,
      products,
      banners,
      settings,
      communityMedia,
      reviews,
      isLoading: activeLoads > 0,
      refreshAll,
      ensureSectionsLoaded,
      ensureProductsLoaded,
      ensureBannersLoaded,
      ensureSettingsLoaded,
      ensureCommunityMediaLoaded,
      ensureReviewsLoaded,
      ensureStorefrontBootstrapLoaded,
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
      activeLoads,
      refreshAll,
      ensureSectionsLoaded,
      ensureProductsLoaded,
      ensureBannersLoaded,
      ensureSettingsLoaded,
      ensureCommunityMediaLoaded,
      ensureReviewsLoaded,
      ensureStorefrontBootstrapLoaded,
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
