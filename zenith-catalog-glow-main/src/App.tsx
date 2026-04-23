import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminDataProvider, useAdminData } from "@/contexts/AdminDataContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminSessionGuard from "@/components/AdminSessionGuard";
import ScrollToTop from "@/components/ScrollToTop";
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

// Premium loading fallback
const PageLoader = () => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
    <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Loading...</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mobile-optimized: keep data fresh for 5 min, GC after 10 min
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
    },
  },
});

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
    void ensureSettingsLoaded();
  }, [ensureSettingsLoaded]);

  return null;
};

const AdminSettingsBootstrap = PublicSettingsBootstrap;

const LazyPage = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
