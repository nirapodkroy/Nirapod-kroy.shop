import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { CartProvider, useCart } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { Product } from "./types";
import { DEFAULT_PRODUCTS } from "./data/defaultProducts";
import { safeGetLocalStorage, safeSetLocalStorage } from "./utils/storage";
import { getCategoryFromUrl, updateCategoryUrl, isReturnPolicyUrl, isPrivacyPolicyUrl, isDeliveryPolicyUrl, categoryToSlug } from "./utils/categoryRouting";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { ProductGrid } from "./components/ProductGrid";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutModal } from "./components/CheckoutModal";
import { CustomerAuthModal } from "./components/CustomerAuthModal";
import { CustomerProfileModal } from "./components/CustomerProfileModal";
import { TrackOrderModal } from "./components/TrackOrderModal";
import { WishlistDrawer } from "./components/WishlistDrawer";
import { ReturnPolicyModal } from "./components/ReturnPolicyModal";
import { PrivacyPolicyModal } from "./components/PrivacyPolicyModal";
import { DeliveryPolicyModal } from "./components/DeliveryPolicyModal";
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { SecretAdminModal } from "./components/SecretAdminModal";
import { Footer } from "./components/Footer";
import { ToastContainer } from "./components/ToastContainer";
import { BASE_CATEGORIES, getDynamicCategories } from "./data/categories";
import { trackPageView } from "./utils/tracker";

const PRODUCTS_CACHE_KEY = "nirapod_products_cache";
const WISHLIST_CACHE_KEY = "nirapod_wishlist_ids";

function mergeWithDefaultProducts(loadedList: Product[]): Product[] {
  if (!Array.isArray(loadedList) || loadedList.length === 0) return DEFAULT_PRODUCTS;
  const defaultsMap = new Map(DEFAULT_PRODUCTS.map((dp) => [dp.id, dp]));
  
  // Cleanly upgrade loaded items with updated data images and details from default products if available
  const upgradedList = loadedList.map((item) => {
    const defaultItem = defaultsMap.get(item.id);
    if (!defaultItem) return item;
    
    const needsImageUpgrade =
      !item.imageUrl ||
      !item.imageUrl.startsWith("data:") ||
      !Array.isArray(item.images) ||
      item.images.length === 0 ||
      !item.images[0]?.startsWith("data:");

    if (needsImageUpgrade && defaultItem.imageUrl?.startsWith("data:")) {
      return {
        ...item,
        imageUrl: defaultItem.imageUrl,
        images: defaultItem.images && defaultItem.images.length > 0 ? defaultItem.images : item.images
      };
    }
    return item;
  });

  const existingIds = new Set(upgradedList.map((p) => p.id));
  const missingFromDefaults = DEFAULT_PRODUCTS.filter((dp) => !existingIds.has(dp.id));
  return missingFromDefaults.length > 0 ? [...upgradedList, ...missingFromDefaults] : upgradedList;
}

const StoreContent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = safeGetLocalStorage(PRODUCTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter((p: any) => !p.id.startsWith("prod-groc-") && !p.id.startsWith("prod-elec-") && !p.id.startsWith("prod-sprt-") && !p.id.startsWith("prod-baby-") && !p.id.startsWith("prod-book-") && !p.id.startsWith("prod-home-") && !p.id.startsWith("prod-fas-"));
          if (cleaned.length > 0) return mergeWithDefaultProducts(cleaned);
        }
      }
    } catch {}
    return DEFAULT_PRODUCTS;
  });

  const { language, getCategoryName } = useLanguage();
  const { setIsAdminModalOpen } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Secret Admin Trigger: If phone/desktop search query is :86681134Tadminpanelopennow
  useEffect(() => {
    if (!searchQuery) return;
    const cleanVal = searchQuery.trim().toLowerCase();
    const normalized = cleanVal.replace(/^[:\s]+/, "");
    if (
      normalized === "86681134tadminpanelopennow" ||
      cleanVal.includes("86681134tadminpanelopennow") ||
      searchQuery.includes("86681134Tadminpanelopennow")
    ) {
      setSearchQuery("");
      setIsAdminModalOpen(true);
      addToast("অ্যাডমিন প্যানেল সক্রিয় হয়েছে (Admin Console Activated)", "info");
    }
  }, [searchQuery, setIsAdminModalOpen, addToast]);

  // Category state initialized directly from URL path, query (?category=), or hash
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return getCategoryFromUrl(BASE_CATEGORIES) || "All";
  });
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Modals & Drawers
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isReturnPolicyOpen, setIsReturnPolicyOpen] = useState<boolean>(() => {
    return isReturnPolicyUrl();
  });
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState<boolean>(() => {
    return isPrivacyPolicyUrl();
  });
  const [isDeliveryPolicyOpen, setIsDeliveryPolicyOpen] = useState<boolean>(() => {
    return isDeliveryPolicyUrl();
  });

  // Open Return & Refund Policy with URL synchronization (/return-refund)
  const openReturnPolicy = useCallback(() => {
    setIsReturnPolicyOpen(true);
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/return-refund" && window.location.hash !== "#return-refund") {
        const fullCurrentUrl = currentPath + window.location.search;
        window.history.pushState({ modal: "return-refund", previousUrl: fullCurrentUrl }, "", "/return-refund");
      }
    }
  }, []);

  // Close Return & Refund Policy and cleanly revert URL
  const closeReturnPolicy = useCallback(() => {
    setIsReturnPolicyOpen(false);
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/return-refund" || window.location.hash === "#return-refund") {
        const prevState = window.history.state;
        if (prevState && prevState.modal === "return-refund" && prevState.previousUrl) {
          window.history.pushState(null, "", prevState.previousUrl);
        } else {
          const fallbackUrl = selectedCategory && selectedCategory !== "All"
            ? `/${categoryToSlug(selectedCategory)}`
            : "/";
          window.history.pushState(null, "", fallbackUrl);
        }
      }
    }
  }, [selectedCategory]);

  // Open Privacy Policy with URL synchronization (/privacy-policy)
  const openPrivacyPolicy = useCallback(() => {
    setIsPrivacyPolicyOpen(true);
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/privacy-policy" && window.location.hash !== "#privacy-policy") {
        const fullCurrentUrl = currentPath + window.location.search;
        window.history.pushState({ modal: "privacy-policy", previousUrl: fullCurrentUrl }, "", "/privacy-policy");
      }
    }
  }, []);

  // Close Privacy Policy and cleanly revert URL
  const closePrivacyPolicy = useCallback(() => {
    setIsPrivacyPolicyOpen(false);
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/privacy-policy" || window.location.hash === "#privacy-policy") {
        const prevState = window.history.state;
        if (prevState && prevState.modal === "privacy-policy" && prevState.previousUrl) {
          window.history.pushState(null, "", prevState.previousUrl);
        } else {
          const fallbackUrl = selectedCategory && selectedCategory !== "All"
            ? `/${categoryToSlug(selectedCategory)}`
            : "/";
          window.history.pushState(null, "", fallbackUrl);
        }
      }
    }
  }, [selectedCategory]);

  // Open Delivery Policy with URL synchronization (/delivery-policy)
  const openDeliveryPolicy = useCallback(() => {
    setIsDeliveryPolicyOpen(true);
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/delivery-policy" && window.location.hash !== "#delivery-policy") {
        const fullCurrentUrl = currentPath + window.location.search;
        window.history.pushState({ modal: "delivery-policy", previousUrl: fullCurrentUrl }, "", "/delivery-policy");
      }
    }
  }, []);

  // Close Delivery Policy and cleanly revert URL
  const closeDeliveryPolicy = useCallback(() => {
    setIsDeliveryPolicyOpen(false);
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/delivery-policy" || window.location.hash === "#delivery-policy") {
        const prevState = window.history.state;
        if (prevState && prevState.modal === "delivery-policy" && prevState.previousUrl) {
          window.history.pushState(null, "", prevState.previousUrl);
        } else {
          const fallbackUrl = selectedCategory && selectedCategory !== "All"
            ? `/${categoryToSlug(selectedCategory)}`
            : "/";
          window.history.pushState(null, "", fallbackUrl);
        }
      }
    }
  }, [selectedCategory]);

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

  // Dynamically include categories present in the active products and future additions
  const dynamicCategories = useMemo(() => {
    return getDynamicCategories(products);
  }, [products]);

  // Handle URL change when selecting a category (updates browser address bar)
  const handleSelectCategory = useCallback((cat: string, replace = false) => {
    const targetCat = cat || "All";
    setSelectedCategory(targetCat);
    updateCategoryUrl(targetCat, replace);

    // Scroll cleanly to the top of the page when changing category
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  // Listen for browser Back/Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      // Check if user navigated to or from /return-refund, /privacy-policy, or /delivery-policy
      const isReturn = isReturnPolicyUrl();
      const isPrivacy = isPrivacyPolicyUrl();
      const isDelivery = isDeliveryPolicyUrl();
      setIsReturnPolicyOpen(isReturn);
      setIsPrivacyPolicyOpen(isPrivacy);
      setIsDeliveryPolicyOpen(isDelivery);

      const catFromUrl = getCategoryFromUrl(dynamicCategories);
      setSelectedCategory(catFromUrl || "All");
      if (typeof window !== "undefined" && !isReturn && !isPrivacy && !isDelivery) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [dynamicCategories]);

  // Whenever selectedCategory changes, always ensure viewport starts at the top of the category page
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [selectedCategory]);

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

  // Dynamically update document title to reflect category page, return policy, privacy policy, or delivery policy
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isDeliveryPolicyOpen) {
        document.title = language === "bn"
          ? "ডেলিভারি পলিসি (Delivery Policy) - ২-৫ কার্যদিবস | Nirapod Kroy"
          : "Delivery Policy - 2-5 Business Days | Nirapod Kroy";
      } else if (isPrivacyPolicyOpen) {
        document.title = language === "bn"
          ? "গোপনীয়তা নীতি (Privacy Policy) | Nirapod Kroy"
          : "Privacy Policy | Nirapod Kroy";
      } else if (isReturnPolicyOpen) {
        document.title = language === "bn"
          ? "রিটার্ন ও রিফান্ড পলিসি - ৭ দিন | Nirapod Kroy"
          : "Return & Refund Policy - 7 Days | Nirapod Kroy";
      } else if (selectedCategory && selectedCategory !== "All") {
        const catName = getCategoryName(selectedCategory);
        document.title = `${catName} - নিরাপদ ক্রয় | Nirapod Kroy`;
      } else {
        document.title = "Nirapod Kroy | নিরাপদ ক্রয় - সব ধরনের বিশ্বস্ত পণ্য";
      }
    }
  }, [isDeliveryPolicyOpen, isPrivacyPolicyOpen, isReturnPolicyOpen, selectedCategory, language, getCategoryName]);

  // Active page resolution for real-time user tracking
  const activePageInfo = useMemo(() => {
    if (isDeliveryPolicyOpen) return { title: "ডেলিভারি পলিসি (Delivery Policy)", slug: "delivery_policy" };
    if (isPrivacyPolicyOpen) return { title: "গোপনীয়তা নীতি (Privacy Policy)", slug: "privacy_policy" };
    if (isReturnPolicyOpen) return { title: "রিটার্ন ও রিফান্ড পলিসি (Return Policy)", slug: "return_refund" };
    if (isCheckoutOpen) return { title: "চেকআউট পেজ (Checkout)", slug: "checkout" };
    if (quickViewProduct) return { title: `পণ্য ভিউ: ${quickViewProduct.title.slice(0, 30)}`, slug: `product_${quickViewProduct.id}` };
    if (isTrackOrderOpen) return { title: "অর্ডার ট্র্যাকিং (Track Order)", slug: "track_order" };
    if (isWishlistOpen) return { title: "উইশলিস্ট (Wishlist)", slug: "wishlist" };
    if (selectedCategory && selectedCategory !== "All") {
      const catName = getCategoryName(selectedCategory);
      return { title: `ক্যাটাগরি: ${catName}`, slug: `cat_${selectedCategory.toLowerCase().replace(/\s+/g, '_')}` };
    }
    return { title: "হোমপেজ (Home)", slug: "home" };
  }, [isDeliveryPolicyOpen, isPrivacyPolicyOpen, isReturnPolicyOpen, isCheckoutOpen, quickViewProduct, isTrackOrderOpen, isWishlistOpen, selectedCategory, getCategoryName]);

  // Track page view and active visitor time
  useEffect(() => {
    const cleanup = trackPageView(activePageInfo.title, activePageInfo.slug);
    return () => cleanup();
  }, [activePageInfo.title, activePageInfo.slug]);

  // Load products from static products.json, API, or local storage cache
  const fetchProducts = useCallback(async () => {
    try {
      // 0. Check local storage cache first for instant initial paint
      let localList: Product[] | null = null;
      try {
        const cached = safeGetLocalStorage(PRODUCTS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleaned = parsed.filter((p: any) => !p.id.startsWith("prod-groc-") && !p.id.startsWith("prod-elec-") && !p.id.startsWith("prod-sprt-") && !p.id.startsWith("prod-baby-") && !p.id.startsWith("prod-book-") && !p.id.startsWith("prod-home-") && !p.id.startsWith("prod-fas-"));
            if (cleaned.length > 0) {
              const merged = mergeWithDefaultProducts(cleaned);
              localList = merged;
              setProducts(merged);
            }
          }
        }
      } catch {}

      // 1. In static hosting (GitHub Pages) or any static env, fetch live products.json with multiple candidate paths & cache buster
      const isStatic = !window.location.port && !window.location.hostname.includes("run.app");
      if (isStatic) {
        const candidatePaths = [
          `/products.json?t=${Date.now()}`,
          `/docs/products.json?t=${Date.now()}`,
          `/public/products.json?t=${Date.now()}`,
          `./products.json?t=${Date.now()}`
        ];
        for (const candidate of candidatePaths) {
          try {
            const staticRes = await fetch(candidate);
            const contentType = staticRes.headers.get("content-type") || "";
            if (staticRes.ok && !contentType.includes("text/html")) {
              const list = await staticRes.json();
              if (Array.isArray(list) && list.length > 0) {
                const merged = mergeWithDefaultProducts(list);
                setProducts(merged);
                safeSetLocalStorage(PRODUCTS_CACHE_KEY, JSON.stringify(merged));
                setIsLoading(false);
                return;
              }
            }
          } catch (e) {
            // Try next candidate
          }
        }
      }

      // 2. Full-stack / development environment
      try {
        const res = await fetch("/api/products");
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && !contentType.includes("text/html")) {
          const data = await res.json();
          const list = Array.isArray(data.products) && data.products.length > 0
            ? data.products
            : (localList || DEFAULT_PRODUCTS);
          const merged = mergeWithDefaultProducts(list);
          setProducts(merged);
          safeSetLocalStorage(PRODUCTS_CACHE_KEY, JSON.stringify(merged));
        } else if (localList && localList.length > 0) {
          setProducts(localList);
        } else {
          setProducts(DEFAULT_PRODUCTS);
        }
      } catch {
        if (localList && localList.length > 0) {
          setProducts(localList);
        } else {
          setProducts(DEFAULT_PRODUCTS);
        }
      }
    } catch (err) {
      console.warn("Could not reach /api/products, using fallback catalog:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    const handleCatalogUpdate = () => {
      fetchProducts();
    };
    window.addEventListener("nirapod-catalog-updated", handleCatalogUpdate);
    return () => {
      window.removeEventListener("nirapod-catalog-updated", handleCatalogUpdate);
    };
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

  const handleSelectCategoryFromHero = useCallback((cat: string) => {
    setSearchQuery("");
    if (!cat || cat === "All") {
      setSelectedCategory("All");
      updateCategoryUrl("All");
      setTimeout(() => {
        const catalogEl = document.getElementById("catalog-section");
        if (catalogEl) {
          catalogEl.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);
    } else {
      handleSelectCategory(cat);
    }
  }, [handleSelectCategory]);

  const handleExploreClick = useCallback((category?: string) => {
    setSearchQuery("");
    if (category && category !== "All") {
      handleSelectCategory(category);
    } else {
      setSelectedCategory("All");
      updateCategoryUrl("All");
      setTimeout(() => {
        const catalogEl = document.getElementById("catalog-section");
        if (catalogEl) {
          catalogEl.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);
    }
  }, [handleSelectCategory]);

  const handleDealsClick = useCallback((dealsCategory?: string) => {
    setSearchQuery("");
    handleSelectCategory(dealsCategory || "Offer Zone");
  }, [handleSelectCategory]);

  // When user clicks ANY product on the home page:
  // Open quick view details modal directly with all images and order options
  const handleProductClick = (product: Product) => {
    setQuickViewProduct(product);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-emerald-500 selection:text-white transition-colors duration-200">
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
        {selectedCategory === "All" && (
          /* Full Hero Carousel shown on Home Page */
          <HeroSection
            onSelectCategory={handleSelectCategoryFromHero}
            onExploreClick={handleExploreClick}
            onDealsClick={handleDealsClick}
            onOpenReturnPolicy={openReturnPolicy}
            onOpenPrivacyPolicy={openPrivacyPolicy}
            onOpenDeliveryPolicy={openDeliveryPolicy}
          />
        )}

        {/* Product Catalog Grid - Handles both Home and dedicated single Category Page seamlessly */}
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
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenReturnPolicy={openReturnPolicy}
        onOpenPrivacyPolicy={openPrivacyPolicy}
        onOpenDeliveryPolicy={openDeliveryPolicy}
      />

      {/* Persistent Floating WhatsApp Support Button */}
      <FloatingWhatsApp />

      {/* Mobile Bottom Navigation Bar (Phone & Tablet Friendly) */}
      <MobileBottomNav
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        wishlistCount={wishlistIds.length}
        categories={dynamicCategories}
      />

      {/* Cart Slide-Over Drawer */}
      <CartDrawer />

      {/* Checkout Modal with Google Sheets Integration */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={() => {
          fetchProducts(); // Refresh inventory counts
        }}
        onOpenReturnPolicy={openReturnPolicy}
        onOpenPrivacyPolicy={openPrivacyPolicy}
        onOpenDeliveryPolicy={openDeliveryPolicy}
      />

      {/* Track Order Modal */}
      <TrackOrderModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
      />

      {/* Return & Refund Policy Modal (7-Day Policy with clean URL /return-refund) */}
      <ReturnPolicyModal
        isOpen={isReturnPolicyOpen}
        onClose={closeReturnPolicy}
        onOpenTrackOrder={() => {
          closeReturnPolicy();
          setIsTrackOrderOpen(true);
        }}
        onOpenPrivacyPolicy={openPrivacyPolicy}
        onOpenDeliveryPolicy={openDeliveryPolicy}
      />

      {/* Privacy Policy Modal (with clean URL /privacy-policy) */}
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={closePrivacyPolicy}
        onOpenReturnPolicy={openReturnPolicy}
        onOpenDeliveryPolicy={openDeliveryPolicy}
      />

      {/* Delivery Policy Modal (with clean URL /delivery-policy) */}
      <DeliveryPolicyModal
        isOpen={isDeliveryPolicyOpen}
        onClose={closeDeliveryPolicy}
        onOpenTrackOrder={() => {
          closeDeliveryPolicy();
          setIsTrackOrderOpen(true);
        }}
        onOpenReturnPolicy={openReturnPolicy}
        onOpenPrivacyPolicy={openPrivacyPolicy}
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
        onOpenReturnPolicy={openReturnPolicy}
        onOpenPrivacyPolicy={openPrivacyPolicy}
        onOpenDeliveryPolicy={openDeliveryPolicy}
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
