import React, { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { CartProvider, useCart } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Product } from "./types";
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

const StoreContent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const { isCheckoutOpen, setIsCheckoutOpen } = useCart();
  const { addToast } = useToast();

  // Load products from API
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      addToast("Failed to fetch latest catalog", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

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
