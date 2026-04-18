import { useState, useMemo, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import ProductCard from "@/components/storefront/ProductCard";
import SectionHeader from "@/components/storefront/SectionHeader";
import { useAdminData } from "@/contexts/AdminDataContext";

const filterTabs = [
  { key: "all", label: "All Products" },
  { key: "new", label: "New Launches" },
  { key: "best", label: "Best Sellers" },
];

const sortOptions = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "name", label: "Name A-Z" },
];

const Products = () => {
  const { products: allProducts, sections } = useAdminData();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("filter") || "all";

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(() => {
    let products = [...allProducts];

    // Tab filter
    if (activeFilter === "new") {
      products = products.filter((p) => p.is_new_launch);
    } else if (activeFilter === "best") {
      products = products.filter((p) => p.is_best_seller);
    }

    // Category filter
    if (categoryFilter !== "all") {
      products = products.filter((p) => p.sectionId === Number(categoryFilter));
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.model_number?.toLowerCase().includes(q) ||
          p.sectionName?.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        products.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        products.sort((a, b) => b.price - a.price);
        break;
      case "name":
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return products;
  }, [allProducts, search, activeFilter, sortBy, categoryFilter]);

  const handleFilterChange = (key: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (key === "all") {
      nextSearchParams.delete("filter");
    } else {
      nextSearchParams.set("filter", key);
    }

    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="section-container pt-8 pb-4">
        <SectionHeader title="Products" subtitle={`${filtered.length} products`} />

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-body"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-input bg-card text-sm font-body"
          >
            <option value="all">All Categories</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-input bg-card text-sm font-body"
          >
            {sortOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product grid */}
      <div className="section-container pb-16">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg font-body">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
            {filtered.map((product, i) => (
              <div
                key={product.id}
                className="enter-fade-up"
                style={
                  {
                    "--enter-delay": `${Math.min(i * 30, 180)}ms`,
                  } as CSSProperties
                }
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>

      <FloatingContactActions />
      <Footer />
    </div>
  );
};

export default Products;
