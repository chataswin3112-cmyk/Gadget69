import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminDataProvider } from "@/contexts/AdminDataContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminSessionGuard from "@/components/AdminSessionGuard";
import ScrollToTop from "@/components/ScrollToTop";

// Lazy-loaded components for better mobile performance
const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryDetails = lazy(() => import("./pages/CategoryDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutFailure = lazy(() => import("./pages/CheckoutFailure"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
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


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AdminDataProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ScrollToTop />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetails />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/categories/:id" element={<CategoryDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/checkout/success" element={<CheckoutSuccess />} />
                  <Route path="/checkout/failure" element={<CheckoutFailure />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  <Route path="/terms-and-conditions" element={<TermsOfService />} />
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<ProtectedRoute><AdminSessionGuard><AdminDashboard /></AdminSessionGuard></ProtectedRoute>} />
                  <Route path="/admin/categories" element={<ProtectedRoute><AdminSessionGuard><AdminCategories /></AdminSessionGuard></ProtectedRoute>} />
                  <Route path="/admin/products" element={<ProtectedRoute><AdminSessionGuard><AdminProducts /></AdminSessionGuard></ProtectedRoute>} />
                  <Route path="/admin/offers" element={<ProtectedRoute><AdminSessionGuard><AdminOffers /></AdminSessionGuard></ProtectedRoute>} />
                  <Route path="/admin/orders" element={<ProtectedRoute><AdminSessionGuard><AdminOrders /></AdminSessionGuard></ProtectedRoute>} />
                  <Route path="/admin/banners" element={<ProtectedRoute><AdminSessionGuard><AdminBanners /></AdminSessionGuard></ProtectedRoute>} />
                  <Route path="/admin/media" element={<ProtectedRoute><AdminSessionGuard><AdminMedia /></AdminSessionGuard></ProtectedRoute>} />
                  <Route path="/admin/speed-test" element={<ProtectedRoute><AdminSessionGuard><AdminSpeedTest /></AdminSessionGuard></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute><AdminSessionGuard><AdminSettings /></AdminSessionGuard></ProtectedRoute>} />
                  <Route path="/admin/reviews" element={<ProtectedRoute><AdminSessionGuard><AdminReviews /></AdminSessionGuard></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </AdminDataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
