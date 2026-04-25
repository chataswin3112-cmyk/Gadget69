import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminDataProvider, useAdminData } from "@/contexts/AdminDataContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminSessionGuard from "@/components/AdminSessionGuard";
import ScrollToTop from "@/components/ScrollToTop";
import { scheduleAfterPaint } from "@/lib/idle";
import Index from "./pages/Index";
import AdminLogin from "./pages/admin/AdminLogin";

// Lazy-loaded components for better mobile performance
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryDetails = lazy(() => import("./pages/CategoryDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutFailure = lazy(() => import("./pages/CheckoutFailure"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOffers = lazy(() => import("./pages/admin/AdminOffers"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminSpeedTest = lazy(() => import("./pages/admin/AdminSpeedTest"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Sonner = lazy(async () => {
  const module = await import("@/components/ui/sonner");
  return { default: module.Toaster };
});
const LegacyToaster = lazy(async () => {
  const module = await import("@/components/ui/toaster");
  return { default: module.Toaster };
});

// Premium loading fallback
const PageLoader = () => (
  <div
    role="status"
    aria-live="polite"
    className="flex h-screen w-full flex-col items-center justify-center bg-background/50 backdrop-blur-sm"
  >
    <div
      aria-hidden="true"
      className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent"
    ></div>
    <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Loading...</p>
  </div>
);

const PublicRouteShell = () => (
  <AdminDataProvider eager={false}>
    <CartProvider>
      <PublicSettingsBootstrap />
      <Outlet />
    </CartProvider>
  </AdminDataProvider>
);

const PublicSettingsBootstrap = () => {
  const { ensureSettingsLoaded } = useAdminData();

  useEffect(() => {
    const cancel = scheduleAfterPaint(() => {
      void ensureSettingsLoaded();
    }, 120);

    return cancel;
  }, [ensureSettingsLoaded]);

  return null;
};

const AdminSettingsBootstrap = PublicSettingsBootstrap;

const LazyPage = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const DeferredSonner = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => scheduleAfterPaint(() => setIsReady(true), 350), []);

  if (!isReady) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Sonner />
    </Suspense>
  );
};

const AdminRouteShell = () => (
  <ProtectedRoute>
    <AdminSessionGuard>
      <AdminDataProvider eager={false}>
        <AdminSettingsBootstrap />
        <Outlet />
      </AdminDataProvider>
    </AdminSessionGuard>
  </ProtectedRoute>
);

const RouteAwareLegacyToaster = () => {
  const location = useLocation();
  const needsLegacyToasts =
    location.pathname === "/checkout" ||
    location.pathname === "/track-order" ||
    location.pathname === "/admin/orders";

  return needsLegacyToasts ? (
    <Suspense fallback={null}>
      <LegacyToaster />
    </Suspense>
  ) : null;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RouteAwareLegacyToaster />
      <DeferredSonner />
      <ScrollToTop />
      <Routes>
        <Route element={<PublicRouteShell />}>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<LazyPage><Products /></LazyPage>} />
          <Route path="/products/:id" element={<LazyPage><ProductDetails /></LazyPage>} />
          <Route path="/categories" element={<LazyPage><Categories /></LazyPage>} />
          <Route path="/categories/:id" element={<LazyPage><CategoryDetails /></LazyPage>} />
          <Route path="/cart" element={<LazyPage><Cart /></LazyPage>} />
          <Route path="/checkout" element={<LazyPage><Checkout /></LazyPage>} />
          <Route path="/checkout/success" element={<LazyPage><CheckoutSuccess /></LazyPage>} />
          <Route path="/checkout/failure" element={<LazyPage><CheckoutFailure /></LazyPage>} />
          <Route path="/track-order" element={<LazyPage><TrackOrder /></LazyPage>} />
          <Route path="/contact" element={<LazyPage><Contact /></LazyPage>} />
          <Route path="/privacy-policy" element={<LazyPage><PrivacyPolicy /></LazyPage>} />
          <Route path="/refund-policy" element={<LazyPage><RefundPolicy /></LazyPage>} />
          <Route path="/shipping-policy" element={<LazyPage><ShippingPolicy /></LazyPage>} />
          <Route path="/terms-and-conditions" element={<LazyPage><TermsOfService /></LazyPage>} />
          <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
        </Route>

        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<AdminRouteShell />}>
          <Route path="/admin/dashboard" element={<LazyPage><AdminDashboard /></LazyPage>} />
          <Route path="/admin/categories" element={<LazyPage><AdminCategories /></LazyPage>} />
          <Route path="/admin/products" element={<LazyPage><AdminProducts /></LazyPage>} />
          <Route path="/admin/offers" element={<LazyPage><AdminOffers /></LazyPage>} />
          <Route path="/admin/orders" element={<LazyPage><AdminOrders /></LazyPage>} />
          <Route path="/admin/banners" element={<LazyPage><AdminBanners /></LazyPage>} />
          <Route path="/admin/media" element={<LazyPage><AdminMedia /></LazyPage>} />
          <Route path="/admin/speed-test" element={<LazyPage><AdminSpeedTest /></LazyPage>} />
          <Route path="/admin/settings" element={<LazyPage><AdminSettings /></LazyPage>} />
          <Route path="/admin/reviews" element={<LazyPage><AdminReviews /></LazyPage>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
