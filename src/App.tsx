import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { CartProvider, useCart } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { Product } from "./types";
import { DEFAULT_PRODUCTS } from "./data/defaultProducts";
import { safeGetLocalStorage, safeSetLocalStorage } from "./utils/storage";
import { getCategoryFromUrl, updateCategoryUrl } from "./utils/categoryRouting";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { CategoryPageBanner } from "./components/CategoryPageBanner";
import { ProductGrid } from "./components/ProductGrid";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutModal } from "./components/CheckoutModal";
import { CustomerAuthModal } from "./components/CustomerAuthModal";
import { CustomerProfileModal } from "./components/CustomerProfileModal";
import { TrackOrderModal } from "./components/TrackOrderModal";
import { WishlistDrawer } from "./components/WishlistDrawer";
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";
import { SecretAdminModal } from "./components/SecretAdminModal";
import { Footer } from "./components/Footer";
import { ToastContainer } from "./components/ToastContainer";
import { BASE_CATEGORIES, getDynamicCategories } from "./data/categories";

const PRODUCTS_CACHE_KEY = "nirapod_products_cache";
const WISHLIST_CACHE_KEY = "nirapod_wishlist_ids";

const StoreContent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = safeGetLocalStorage(PRODUCTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PRODUCTS;
  });

  const { language, getCategoryName } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Category state initialized directly from URL path, query (?category=), or hash
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return getCategoryFromUrl(BASE_CATEGORIES) || "All";
  });
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Modals & Drawers
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Wishlist persistence
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = safeGetLocalStorage(WISHLIST_CACHE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { isCheckoutOpen, setIsCheckoutOpen } = useCart();
  const { addToast } = useToast();

  // Dynamically include categories present in the active products and future additions
  const dynamicCategories = useMemo(() => {
    return getDynamicCategories(products);
  }, [products]);

  // Handle URL change when selecting a category (updates browser address bar)
  const handleSelectCategory = useCallback((cat: string, replace = false) => {
    const targetCat = cat || "All";
    setSelectedCategory(targetCat);
    updateCategoryUrl(targetCat, replace);

    // Scroll smoothly to top of page when changing category
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Listen for browser Back/Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const catFromUrl = getCategoryFromUrl(dynamicCategories);
      setSelectedCategory(catFromUrl || "All");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [dynamicCategories]);

  // Synchronize category if matching dynamic categories loaded from API/cache
  useEffect(() => {
    const catFromUrl = getCategoryFromUrl(dynamicCategories);
    if (catFromUrl) {
      if (catFromUrl !== selectedCategory) {
        setSelectedCategory(catFromUrl);
      }
      // If user landed via 404 redirect (?p=slug) or query (?category=slug), replace with clean slug in address bar
      if (typeof window !== "undefined") {
        const search = window.location.search;
        if (search.includes("p=") || search.includes("category=") || search.includes("c=")) {
          updateCategoryUrl(catFromUrl, true);
        }
      }
    }
  }, [dynamicCategories]);

  // Dynamically update document title to reflect category page
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (selectedCategory && selectedCategory !== "All") {
        const catName = getCategoryName(selectedCategory);
        document.title = `${catName} - নিরাপদ ক্রয় | Nirapod Kroy`;
      } else {
        document.title = "Nirapod Kroy | নিরাপদ ক্রয় - সব ধরনের বিশ্বস্ত পণ্য";
      }
    }
  }, [selectedCategory, language, getCategoryName]);

  // Load products from static products.json, API, or local storage cache
  const fetchProducts = useCallback(async () => {
    try {
      // 0. Check local storage cache first
      let localList: Product[] | null = null;
      try {
        const cached = safeGetLocalStorage(PRODUCTS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localList = parsed;
          }
        }
      } catch {}

      // 1. In static hosting (GitHub Pages), fetch live products.json with cache buster
      const isStatic = !window.location.port && !window.location.hostname.includes("run.app");
      if (isStatic) {
        try {
          const staticRes = await fetch(`./products.json?t=${Date.now()}`);
          if (staticRes.ok) {
            const list = await staticRes.json();
            if (Array.isArray(list) && list.length > 0) {
              setProducts(list);
              safeSetLocalStorage(PRODUCTS_CACHE_KEY, JSON.stringify(list));
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn("Could not load ./products.json:", e);
        }
      }

      // 2. Full-stack / development environment
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.products) && data.products.length > 0
          ? data.products
          : (localList || DEFAULT_PRODUCTS);
        setProducts(list);
        safeSetLocalStorage(PRODUCTS_CACHE_KEY, JSON.stringify(list));
      } else if (localList && localList.length > 0) {
        setProducts(localList);
      }
    } catch (err) {
      console.warn("Could not reach /api/products, using local catalog:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Toggle item in Wishlist
  const handleToggleWishlist = (product: Product) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(product.id);
      const next = exists ? prev.filter((id) => id !== product.id) : [...prev, product.id];
      safeSetLocalStorage(WISHLIST_CACHE_KEY, JSON.stringify(next));
      if (exists) {
        addToast(`"${product.title}" পছন্দের তালিকা থেকে সরানো হয়েছে`, "info");
      } else {
        addToast(`"${product.title}" পছন্দের তালিকায় যুক্ত করা হয়েছে!`, "success");
      }
      return next;
    });
  };

  const handleRemoveFromWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const next = prev.filter((id) => id !== productId);
      safeSetLocalStorage(WISHLIST_CACHE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const wishlistProducts = useMemo(() => {
    return products.filter((p) => wishlistIds.includes(p.id));
  }, [products, wishlistIds]);

  const handleExploreClick = () => {
    handleSelectCategory("All");
    const catalogEl = document.getElementById("catalog-section");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDealsClick = () => {
    handleSelectCategory("All");
    setSearchQuery("");
    const catalogEl = document.getElementById("catalog-section");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // When user clicks ANY product on the home page:
  // Open quick view details modal directly with all images and order options
  const handleProductClick = (product: Product) => {
    setQuickViewProduct(product);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Toast Notification Layer */}
      <ToastContainer />

      {/* Main Nirapod Kroy Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleSelectCategory}
        categories={dynamicCategories}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        wishlistCount={wishlistIds.length}
      />

      <main className="flex-1">
        {selectedCategory === "All" ? (
          /* Full Hero Carousel shown on Home Page */
          <HeroSection onExploreClick={handleExploreClick} onDealsClick={handleDealsClick} />
        ) : (
          /* Dedicated Category Page Banner with Breadcrumb, Title, Total Count & Share Link */
          <CategoryPageBanner
            category={selectedCategory}
            totalProducts={products.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase()).length}
            onBackToHome={() => handleSelectCategory("All")}
            onSelectCategory={handleSelectCategory}
            categories={dynamicCategories}
          />
        )}

        {/* Product Catalog Grid */}
        <ProductGrid
          products={products}
          isLoading={isLoading}
          selectedCategory={selectedCategory}
          setSelectedCategory={handleSelectCategory}
          categories={dynamicCategories}
          searchQuery={searchQuery}
          onQuickView={(prod) => setQuickViewProduct(prod)}
          onRefreshProducts={fetchProducts}
          onProductClick={handleProductClick}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
        />
      </main>

      {/* Footer */}
      <Footer
        onCategorySelect={(cat) => {
          handleSelectCategory(cat);
          if (cat === "All") {
            handleExploreClick();
          }
        }}
      />

      {/* Persistent Floating WhatsApp Support Button */}
      <FloatingWhatsApp />

      {/* Cart Slide-Over Drawer */}
      <CartDrawer />

      {/* Checkout Modal with Google Sheets Integration */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={() => {
          fetchProducts(); // Refresh inventory counts
        }}
      />

      {/* Track Order Modal */}
      <TrackOrderModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistProducts={wishlistProducts}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onNavigateToCategory={(cat) => {
          handleSelectCategory(cat);
        }}
      />

      {/* Customer Sign In / Sign Up Modal */}
      <CustomerAuthModal />

      {/* Customer Profile & Order History Modal */}
      <CustomerProfileModal />

      {/* Product Quick View Modal */}
      <ProductDetailModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* Secret Admin Panel (Triggered solely by Ctrl + Alt + Shift + T) */}
      <SecretAdminModal
        products={products}
        onProductsUpdated={fetchProducts}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <CartProvider>
            <AuthProvider>
              <StoreContent />
            </AuthProvider>
          </CartProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
