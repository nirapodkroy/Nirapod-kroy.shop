import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Home,
  Layers,
  Heart,
  Package,
  ShoppingCart,
  X,
  ChevronRight,
  Sparkles,
  Tag,
  Search,
  ArrowRight,
  Check,
  Flame,
  ShoppingBag
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { Product } from "../types";
import { filterProductsBySearch } from "../utils/searchHelper";

export interface MobileBottomNavProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenTrackOrder: () => void;
  onOpenWishlist: () => void;
  wishlistCount: number;
  categories: string[];
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  products?: Product[];
  onProductClick?: (product: Product) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenTrackOrder,
  onOpenWishlist,
  wishlistCount,
  categories,
  searchQuery = "",
  onSearchQueryChange,
  products = [],
  onProductClick
}) => {
  const { itemCount, setIsCartOpen, subtotal, addItem, items } = useCart();
  const { language, formatPrice, getCategoryName } = useLanguage();
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);
  const [localSearchInput, setLocalSearchInput] = useState(searchQuery);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync external searchQuery to local input when opened
  useEffect(() => {
    setLocalSearchInput(searchQuery);
  }, [searchQuery]);

  // Auto-focus search input when quick search sheet opens
  useEffect(() => {
    if (isSearchSheetOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isSearchSheetOpen]);

  // Live filtered products inside the search sheet
  const matchingProducts = useMemo(() => {
    if (!localSearchInput.trim() || products.length === 0) return [];
    return filterProductsBySearch(products, localSearchInput).slice(0, 8);
  }, [products, localSearchInput]);

  const handleApplySearch = (queryText: string) => {
    const q = queryText.trim();
    if (onSearchQueryChange) {
      onSearchQueryChange(q);
    }
    setIsSearchSheetOpen(false);
    // Smooth scroll to catalog section
    setTimeout(() => {
      const catalog = document.getElementById("catalog-section");
      if (catalog) {
        catalog.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 350, behavior: "smooth" });
      }
    }, 100);
  };

  const isHomeActive =
    selectedCategory === "All" &&
    !isCategorySheetOpen &&
    !isSearchSheetOpen &&
    !searchQuery.trim();

  // Trending search suggestions
  const trendingSearches = [
    { label: language === "bn" ? "🔥 অফার জোন" : "🔥 Offer Zone", query: "Offer Zone", isCategory: true },
    { label: language === "bn" ? "🍯 সুন্দরবনের মধু" : "🍯 Pure Honey", query: "মধু" },
    { label: language === "bn" ? "🌴 মরিয়ম খেজুর" : "🌴 Premium Dates", query: "খেজুর" },
    { label: language === "bn" ? "🌾 সরিষার তেল" : "🌾 Mustard Oil", query: "সরিষার তেল" },
    { label: language === "bn" ? "🧈 গাওয়া ঘি" : "🧈 Pure Ghee", query: "ঘি" },
    { label: language === "bn" ? "🧥 উইন্টার হুডি" : "🧥 Winter Hoodie", query: "Hoodie" },
    { label: language === "bn" ? "👔 প্রিমিয়াম শার্ট" : "👔 Formal Shirt", query: "Shirt" },
    { label: language === "bn" ? "👶 বেবি ও খেলনা" : "👶 Baby & Kids", query: "Baby" }
  ];

  return (
    <>
      {/* 1. Mobile Quick Search Bottom Sheet */}
      {isSearchSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setIsSearchSheetOpen(false)}
          />
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl border-t border-zinc-200 dark:border-zinc-800 p-4 pb-safe max-h-[88dvh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250">
            {/* Search Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                  <Search className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {language === "bn" ? "পণ্য অনুসন্ধান করুন" : "Search Products"}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {language === "bn" ? "যেকোনো পণ্য সহজে খুঁজুন" : "Find items across all categories"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchSheetOpen(false)}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer active:scale-95"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prominent Search Input Box */}
            <div className="pt-3 pb-2 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleApplySearch(localSearchInput);
                }}
                className="relative flex items-center"
              >
                <Search className="absolute left-3.5 w-4 h-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={localSearchInput}
                  onChange={(e) => setLocalSearchInput(e.target.value)}
                  placeholder={
                    language === "bn"
                      ? "পণ্য বা ব্র্যান্ড খুঁজুন... (উদাঃ মধু, খেজুর, হুডি)"
                      : "Search by title, category, or code..."
                  }
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  className="w-full pl-10 pr-20 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700 rounded-2xl text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-inner"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {localSearchInput && (
                    <button
                      type="button"
                      onClick={() => setLocalSearchInput("")}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full cursor-pointer"
                      aria-label="Clear query"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="py-1 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    {language === "bn" ? "খুঁজুন" : "Go"}
                  </button>
                </div>
              </form>
            </div>

            {/* Scrollable Content: Trending Tags & Live Results */}
            <div className="overflow-y-auto flex-1 space-y-4 py-2 -webkit-overflow-scrolling:touch">
              {/* Quick Trending Searches */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{language === "bn" ? "জনপ্রিয় অনুসন্ধান (Trending Searches):" : "Popular Searches:"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {trendingSearches.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (item.isCategory) {
                          onSelectCategory(item.query);
                          setIsSearchSheetOpen(false);
                        } else {
                          setLocalSearchInput(item.query);
                          handleApplySearch(item.query);
                        }
                      }}
                      className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-zinc-100 hover:bg-emerald-50 dark:bg-zinc-800 dark:hover:bg-emerald-950/40 text-zinc-700 dark:text-zinc-200 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-medium border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer active:scale-95"
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Matching Products Preview */}
              {localSearchInput.trim() && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      {language === "bn"
                        ? `ফলাফল (${matchingProducts.length}টি পণ্য)`
                        : `Matching Products (${matchingProducts.length})`}
                    </span>
                    {matchingProducts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleApplySearch(localSearchInput)}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 cursor-pointer hover:underline"
                      >
                        <span>{language === "bn" ? "সবগুলো দেখুন" : "View all in grid"}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {matchingProducts.length === 0 ? (
                    <div className="p-6 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
                      <p className="text-xs text-zinc-500">
                        {language === "bn"
                          ? `"${localSearchInput}" এর জন্য কোনো পণ্য পাওয়া যায়নি। অন্য বানান দিয়ে চেষ্টা করুন।`
                          : `No items found matching "${localSearchInput}". Try another term.`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {matchingProducts.map((prod) => {
                        const inCart = items.find((i) => i.product.id === prod.id);
                        return (
                          <div
                            key={prod.id}
                            onClick={() => {
                              if (onProductClick) {
                                onProductClick(prod);
                                setIsSearchSheetOpen(false);
                              }
                            }}
                            className="flex items-center gap-3 p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800 hover:border-emerald-500/40 transition-all cursor-pointer active:scale-[0.99]"
                          >
                            <img
                              src={prod.imageUrl || (prod.images && prod.images[0]) || "/images/products/prod-shirt-0.jpg"}
                              alt={prod.title}
                              className="w-13 h-13 rounded-xl object-cover bg-zinc-200 shrink-0 border border-zinc-200 dark:border-zinc-700"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                {prod.category}
                              </span>
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {prod.title}
                              </h4>
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="font-extrabold text-xs text-zinc-900 dark:text-white">
                                  {formatPrice(prod.price)}
                                </span>
                                {prod.regularPrice && prod.regularPrice > prod.price && (
                                  <span className="text-[10px] text-zinc-400 line-through">
                                    {formatPrice(prod.regularPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addItem(prod);
                              }}
                              className={`p-2 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 cursor-pointer ${
                                inCart
                                  ? "bg-orange-500 text-white shadow-xs"
                                  : "bg-emerald-600 text-white hover:bg-emerald-500"
                              }`}
                              title={language === "bn" ? "কার্টে যোগ করুন" : "Add to Cart"}
                            >
                              {inCart ? (
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            {localSearchInput.trim() && (
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => handleApplySearch(localSearchInput)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 active:scale-98 transition-all cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>
                    {language === "bn"
                      ? `"${localSearchInput}" এর সকল পণ্য দেখুন (${matchingProducts.length}টি)`
                      : `View all results for "${localSearchInput}"`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Mobile Category Quick Sheet */}
      {isCategorySheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setIsCategorySheetOpen(false)}
          />
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl border-t border-zinc-200 dark:border-zinc-800 p-4 pb-safe max-h-[82dvh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250">
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {language === "bn" ? "পণ্য ক্যাটাগরি ব্রাউজ করুন" : "Browse Categories"}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {language === "bn" ? "যেকোনো ক্যাটাগরিতে সরাসরি যান" : "Select a category to view products"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategorySheetOpen(false)}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer active:scale-95"
                aria-label="Close categories sheet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Shortcuts inside Category Sheet */}
            <div className="grid grid-cols-2 gap-2 py-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsCategorySheetOpen(false);
                  onOpenTrackOrder();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20 active:scale-95 cursor-pointer"
              >
                <Package className="w-3.5 h-3.5" />
                <span>{language === "bn" ? "অর্ডার ট্র্যাক করুন" : "Track Order"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCategorySheetOpen(false);
                  onOpenWishlist();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-500/20 active:scale-95 cursor-pointer relative"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>{language === "bn" ? "পছন্দের পণ্য" : "Wishlist"}</span>
                {wishlistCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ml-0.5">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </div>

            {/* Categories List */}
            <div className="overflow-y-auto py-2 space-y-1.5 flex-1 -webkit-overflow-scrolling:touch">
              {/* All Products */}
              <button
                type="button"
                onClick={() => {
                  onSelectCategory("All");
                  setIsCategorySheetOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === "All"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{language === "bn" ? "সকল পণ্য (All Products)" : "All Products"}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </button>

              {/* Offer Zone */}
              <button
                type="button"
                onClick={() => {
                  onSelectCategory("Offer Zone");
                  setIsCategorySheetOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory.toLowerCase() === "offer zone" || selectedCategory.toLowerCase() === "offer-zone"
                    ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{language === "bn" ? "🔥 অফার জোন ও স্পেশাল ছাড় (Offer Zone)" : "🔥 Offer Zone & Deals"}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </button>

              {/* Dynamic Categories */}
              {categories
                .filter((c) => c !== "All" && c.toLowerCase() !== "offer zone" && c.toLowerCase() !== "offer-zone")
                .map((cat) => {
                  const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat);
                        setIsCategorySheetOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20"
                          : "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Tag className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{getCategoryName(cat)}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Sticky Bottom Navigation Bar for Mobile Phones & Tablets (Always fixed at bottom) */}
      <nav
        id="mobile-bottom-navigation"
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-emerald-900/10 dark:border-zinc-800/80 pb-safe shadow-[0_-4px_25px_rgba(0,0,0,0.08)]"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1.5 max-w-xl mx-auto relative">
          {/* 1. Home Button */}
          <button
            type="button"
            id="mobile-nav-home"
            onClick={() => {
              onSelectCategory("All");
              if (onSearchQueryChange) onSearchQueryChange("");
              setIsCategorySheetOpen(false);
              setIsSearchSheetOpen(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-colors cursor-pointer select-none active:scale-95 ${
              isHomeActive
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
            title={language === "bn" ? "হোমপেজ" : "Home"}
            aria-label="Home"
          >
            <div className="relative">
              <Home className={`w-5 h-5 ${isHomeActive ? "stroke-[2.5]" : "stroke-2"}`} />
              {isHomeActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </div>
            <span className="text-[10px] leading-none">{language === "bn" ? "হোম" : "Home"}</span>
          </button>

          {/* 2. Categories Button */}
          <button
            type="button"
            id="mobile-nav-categories"
            onClick={() => {
              setIsSearchSheetOpen(false);
              setIsCategorySheetOpen(!isCategorySheetOpen);
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-colors cursor-pointer select-none active:scale-95 ${
              isCategorySheetOpen || (selectedCategory !== "All" && !isSearchSheetOpen)
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
            title={language === "bn" ? "ক্যাটাগরি ব্রাউজ করুন" : "Browse Categories"}
            aria-label="Categories"
          >
            <div className="relative">
              <Layers
                className={`w-5 h-5 ${
                  selectedCategory !== "All" || isCategorySheetOpen ? "stroke-[2.5]" : "stroke-2"
                }`}
              />
              {selectedCategory !== "All" && !isCategorySheetOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </div>
            <span className="text-[10px] leading-none">{language === "bn" ? "ক্যাটাগরি" : "Categories"}</span>
          </button>

          {/* 3. PROMINENT SEARCH BUTTON (Center Elevated Action FAB) */}
          <button
            type="button"
            id="mobile-nav-search"
            onClick={() => {
              setIsCategorySheetOpen(false);
              setIsSearchSheetOpen(true);
            }}
            className="relative flex flex-col items-center justify-center group -mt-4.5 cursor-pointer select-none active:scale-90 transition-all"
            title={language === "bn" ? "পণ্য অনুসন্ধান করুন" : "Search Products"}
            aria-label="Search"
          >
            {/* Elevated Circular Icon with Emerald Glow */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ring-4 ring-[#f2f7f4] dark:ring-zinc-950 ${
                searchQuery.trim() || isSearchSheetOpen
                  ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-600/45 scale-105"
                  : "bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-emerald-600/35 group-hover:scale-105"
              }`}
            >
              <Search className="w-5 h-5 stroke-[2.5] text-white transition-transform group-hover:rotate-12" />
              {/* Active Search Dot Indicator */}
              {searchQuery.trim() && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-amber-400 border-2 border-white dark:border-zinc-950 rounded-full animate-ping" />
              )}
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 leading-none tracking-tight">
              {language === "bn" ? "অনুসন্ধান" : "Search"}
            </span>
          </button>

          {/* 4. Track Order & Wishlist Button */}
          <div className="relative flex flex-col items-center justify-center">
            <button
              type="button"
              id="mobile-nav-track"
              onClick={onOpenTrackOrder}
              className="flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer select-none active:scale-95"
              title={language === "bn" ? "অর্ডার ট্র্যাক করুন" : "Track Order"}
              aria-label="Track Order"
            >
              <div className="relative">
                <Package className="w-5 h-5 stroke-2" />
              </div>
              <span className="text-[10px] leading-none">{language === "bn" ? "ট্র্যাক" : "Track"}</span>
            </button>

            {/* Quick Heart Badge on Track Tab if user has Wishlisted Items */}
            {wishlistCount > 0 && (
              <button
                type="button"
                id="mobile-nav-wishlist-badge"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenWishlist();
                }}
                className="absolute -top-1 -right-0.5 bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-xs ring-1 ring-white dark:ring-zinc-900 cursor-pointer active:scale-90 transition-transform"
                title={language === "bn" ? `পছন্দের তালিকা (${wishlistCount})` : `Wishlist (${wishlistCount})`}
                aria-label="View Wishlist"
              >
                <Heart className="w-2.5 h-2.5 fill-current mr-0.5" />
                <span>{wishlistCount > 9 ? "9+" : wishlistCount}</span>
              </button>
            )}
          </div>

          {/* 5. VISUALLY DISTINCT 'CART' BUTTON WITH BADGE */}
          <button
            type="button"
            id="mobile-nav-cart"
            onClick={() => setIsCartOpen(true)}
            className={`relative flex flex-col items-center justify-center py-1 px-1.5 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
              itemCount > 0
                ? "bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/30 ring-1.5 ring-orange-400/40 hover:shadow-lg"
                : "bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
            }`}
            title={language === "bn" ? "শপিং কার্ট দেখুন" : "View Shopping Cart"}
            aria-label="Shopping Cart"
          >
            <div className="relative">
              <ShoppingCart
                className={`w-5 h-5 ${
                  itemCount > 0 ? "stroke-[2.4] text-white drop-shadow-xs" : "stroke-2 text-amber-600 dark:text-amber-400"
                }`}
              />
              {/* High-Contrast Vibrant Item Count Badge */}
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-red-600 dark:bg-red-500 text-white text-[10px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-zinc-900 animate-bounce animate-once">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </div>

            {/* Label or Live Subtotal Price */}
            <span
              className={`text-[10px] leading-tight font-black tracking-tight mt-0.5 truncate max-w-[62px] ${
                itemCount > 0 ? "text-white drop-shadow-xs" : "text-amber-800 dark:text-amber-300"
              }`}
            >
              {itemCount > 0 ? formatPrice(subtotal) : (language === "bn" ? "কার্ট" : "Cart")}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
