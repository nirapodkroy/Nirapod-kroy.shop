import React, { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { CartProvider, useCart } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Product } from "./types";
import { DEFAULT_PRODUCTS } from "./data/defaultProducts";
import { safeGetLocalStorage, safeSetLocalStorage } from "./utils/storage";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { ProductGrid } from "./components/ProductGrid";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutModal } from "./components/CheckoutModal";
import { CustomerAuthModal } from "./components/CustomerAuthModal";
import { CustomerProfileModal } from "./components/CustomerProfileModal";
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";
import { SecretAdminModal } from "./components/SecretAdminModal";
import { Footer } from "./components/Footer";
import { ToastContainer } from "./components/ToastContainer";

const CATEGORIES = [
  "All",
  "Groceries",
  "Electronics",
  "Fashion",
  "Health & Beauty",
  "Home & Kitchen",
  "Baby & Kids",
  "Sports",
  "Books"
];

const PRODUCTS_CACHE_KEY = "nirapod_products_cache";

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
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const { isCheckoutOpen, setIsCheckoutOpen } = useCart();
  const { addToast } = useToast();

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

      const hasLocalEdits = Boolean(safeGetLocalStorage("nirapod_products_modified"));

      // 1. In static hosting (GitHub Pages), fetch live products.json with cache buster
      const isStatic = !window.location.port && !window.location.hostname.includes("run.app");
      if (isStatic) {
        try {
          const staticRes = await fetch(`./products.json?t=${Date.now()}`);
          if (staticRes.ok) {
            const list = await staticRes.json();
            if (Array.isArray(list) && list.length > 0) {
              // If user has locally added/edited products, preserve them so their changes are not lost
              if (hasLocalEdits && localList && localList.length > 0) {
                setProducts(localList);
              } else {
                setProducts(list);
                safeSetLocalStorage(PRODUCTS_CACHE_KEY, JSON.stringify(list));
              }
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

  const handleExploreClick = () => {
    const catalogEl = document.getElementById("catalog-section");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDealsClick = () => {
    setSelectedCategory("All");
    setSearchQuery("");
    const catalogEl = document.getElementById("catalog-section");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Toast Notification Layer */}
      <ToastContainer />

      {/* Main Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={CATEGORIES}
      />

      <main className="flex-1">
        {/* Sliding Hero Banner */}
        <HeroSection onExploreClick={handleExploreClick} onDealsClick={handleDealsClick} />

        {/* Product Catalog Grid */}
        <ProductGrid
          products={products}
          isLoading={isLoading}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={CATEGORIES}
          searchQuery={searchQuery}
          onQuickView={(prod) => setQuickViewProduct(prod)}
          onRefreshProducts={fetchProducts}
        />
      </main>

      {/* Footer */}
      <Footer onCategorySelect={(cat) => {
        setSelectedCategory(cat);
        handleExploreClick();
      }} />

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
