import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CircleDollarSign, FolderOpen, Package, Percent, ShoppingBag, TrendingUp } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/api/adminApi";
import { DashboardStats } from "@/types";

const metricCards = (stats: DashboardStats) => [
  { label: "Total Revenue", value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: CircleDollarSign },
  { label: "Paid Orders", value: stats.paidOrders.toLocaleString(), icon: ShoppingBag },
  { label: "Conversion Rate", value: `${stats.conversionRate.toFixed(2)}%`, icon: Percent },
  { label: "Total Orders", value: stats.totalOrders.toLocaleString(), icon: TrendingUp },
  { label: "Total Products", value: stats.totalProducts.toLocaleString(), icon: Package },
  { label: "Categories", value: stats.totalSections.toLocaleString(), icon: FolderOpen },
];

const normalizeDashboardStats = (stats: Partial<DashboardStats>): DashboardStats => ({
  totalOrders: stats.totalOrders ?? 0,
  paidOrders: stats.paidOrders ?? 0,
  totalRevenue: stats.totalRevenue ?? 0,
  conversionRate: stats.conversionRate ?? 0,
  totalProducts: stats.totalProducts ?? 0,
  totalSections: stats.totalSections ?? 0,
  totalBanners: stats.totalBanners ?? 0,
  totalCommunityMedia: stats.totalCommunityMedia ?? 0,
  topSellingProducts: stats.topSellingProducts ?? [],
});

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDashboardStats();
        if (active) {
          setStats(normalizeDashboardStats(data));
        }
      } catch {
        if (active) {
          setError("Failed to load dashboard analytics.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm font-body text-muted-foreground">
              Revenue, order conversion, and top-selling products in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/admin/products">Manage Products</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/offers">Manage Offers</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/orders">View Orders</Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-body text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(stats ? metricCards(stats) : Array.from({ length: 6 })).map((card, index) => (
            <div key={card?.label || index} className="rounded-xl bg-card p-5 shadow-premium">
              {card ? (
                <>
                  <div className="mb-3 flex items-center gap-3">
                    <card.icon className="h-5 w-5 text-accent" />
                    <span className="text-sm font-body text-muted-foreground">{card.label}</span>
                  </div>
                  <p className="font-heading text-3xl font-bold">{card.value}</p>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="h-5 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl bg-card shadow-premium">
          <div className="border-b border-border p-5">
            <h2 className="font-heading text-lg font-semibold">Top Selling Products</h2>
            <p className="mt-1 text-sm font-body text-muted-foreground">
              Ranked by paid-order units sold.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : stats?.topSellingProducts.length ? (
            <div className="divide-y divide-border">
              {stats.topSellingProducts.slice(0, 5).map((item, index) => (
                <div key={item.productId} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      #{index + 1}
                    </p>
                    <p className="truncate text-sm font-medium font-body">{item.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold font-body">{item.unitsSold} sold</p>
                    <p className="text-xs text-muted-foreground">Rs. {item.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm font-body text-muted-foreground">
              No paid orders yet, so top-selling products will appear here once sales start coming in.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
