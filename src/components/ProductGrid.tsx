import React, { useState, useMemo, useRef } from "react";
import { Product } from "../types";
import { ProductCard } from "./ProductCard";
import {
  ArrowUpDown,
  RefreshCw,
  ShoppingBag,
  Layers,
  Filter,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Home,
  Share2,
  ArrowLeft,
  CheckCircle,
  Search,
  X
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import {
  GROCERIES_PARENT,
  GROCERY_SUBCATEGORIES,
  isGrocerySubcategory,
  isGroceryRelatedCategory,
  FASHION_PARENT,
  FASHION_SUBCATEGORIES,
  isFashionSubcategory,
  isFashionRelatedCategory
} from "../data/categories";
import { filterProductsBySearch } from "../utils/searchHelper";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: string[];
  searchQuery: string;
  setSearchQuery?: (q: string) => void;
  onQuickView: (product: Product) => void;
  onRefreshProducts: () => void;
  onProductClick: (product: Product) => void;
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  selectedCategory,
  setSelectedCategory,
  categories,
  searchQuery,
  setSearchQuery,
  onQuickView,
  onRefreshProducts,
  onProductClick,
  wishlistIds = [],
  onToggleWishlist
}) => {
  const { language, t, getCategoryName } = useLanguage();
  const { addToast } = useToast();
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");

  const handleShareUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      addToast(
        language === "bn"
          ? "ক্যাটাগরি পেজের লিংক কপি করা হয়েছে!"
          : "Category page URL copied to clipboard!",
        "success"
      );
    }
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory && selectedCategory !== "All") {
      const catLower = selectedCategory.toLowerCase().trim();
      const isOfferZone =
        catLower === "offer zone" ||
        catLower === "offers" ||
        catLower === "offer-zone";
      const isGroceriesParent =
        catLower === "groceries & food" ||
        catLower === "groceries" ||
        catLower === "grocery" ||
        catLower === "food" ||
        catLower === "মুদি ও খাদ্য" ||
        catLower === "মুদি";

      if (isOfferZone) {
        list = list.filter(
          (p) =>
            p.isOfferZone ||
            p.category.toLowerCase() === "offer zone" ||
            (p.regularPrice && p.regularPrice > p.price) ||
            (p.badge &&
              (p.badge.toLowerCase().includes("off") ||
                p.badge.toLowerCase().includes("ছাড়") ||
                p.badge.toLowerCase().includes("offer") ||
                p.badge.toLowerCase().includes("deal")))
        );
      } else if (isGroceriesParent) {
        list = list.filter((p) => {
          const pCat = p.category.toLowerCase().trim();
          const pParent = (p.parentCategory || "").toLowerCase().trim();
          return (
            pCat === "groceries & food" ||
            pCat === "groceries" ||
            isGrocerySubcategory(p.category) ||
            pParent === "groceries & food" ||
            pParent === "groceries"
          );
        });
      } else {
        const isShareeFilter = catLower === "sharee" || catLower === "saree" || catLower === "shari" || catLower === "sari" || catLower === "শাড়ি" || catLower === "শাড়ী";
        const isPanjabiFilter = catLower === "panjabi" || catLower === "punjabi" || catLower === "পাঞ্জাবি" || catLower === "পাঞ্জাবী";
        const isShirtFilter = catLower === "shirt" || catLower === "shart" || catLower === "shirts" || catLower === "শার্ট";
        const isHoodieFilter =
          catLower === "ladies hoodie" ||
          catLower === "ladies  hoodie" ||
          catLower === "ladies-hoodie" ||
          catLower === "hoodie" ||
          catLower === "hoodies" ||
          catLower === "hudie" ||
          catLower === "hudies" ||
          catLower === "ladies-hudie" ||
          catLower === "লেডিস হুডি" ||
          catLower === "লেডিস-হুডি" ||
          catLower === "হুডি" ||
          catLower.includes("hoodie") ||
          catLower.includes("hudie") ||
          catLower.includes("হুডি");
        const isThreePieceFilter =
          catLower === "three piece" ||
          catLower === "three-piece" ||
          catLower === "three_piece" ||
          catLower === "থ্রি-পিস" ||
          catLower === "থ্রি পিস";
        const isGownFilter =
          catLower === "one piece gown" ||
          catLower === "one-piece-gown" ||
          catLower === "gown" ||
          catLower === "পরী গাউন" ||
          catLower === "গাউন";
        const isFashionParent = catLower === "fashion" || catLower === "পোশাক" || catLower === "পোশাক-ও-ফ্যাশন" || catLower === "পোশাক ও ফ্যাশন";

        list = list.filter((p) => {
          const pCat = p.category.toLowerCase().trim();
          const normCat = pCat.replace(/\s+/g, " ");
          const pParent = (p.parentCategory || "").toLowerCase().trim();
          const pTitle = (p.title || "").toLowerCase();

          if (isHoodieFilter) {
            return (
              normCat === "ladies hoodie" ||
              normCat === "hoodie" ||
              normCat.includes("hoodie") ||
              normCat.includes("hudie") ||
              normCat.includes("হুডি") ||
              pTitle.includes("hoodie") ||
              pTitle.includes("hudie") ||
              pTitle.includes("হুডি")
            );
          }

          if (isShirtFilter) {
            return (
              pCat === "shirt" ||
              pCat === "shart" ||
              pCat === "shirts" ||
              pCat === "শার্ট" ||
              pParent === "shirt" ||
              pTitle.includes("shirt") ||
              pTitle.includes("shart") ||
              pTitle.includes("শার্ট")
            );
          }

          if (isShareeFilter) {
            return (
              pCat === "sharee" ||
              pCat === "saree" ||
              pCat === "shari" ||
              pCat === "শাড়ি" ||
              pCat === "শাড়ী" ||
              pParent === "sharee" ||
              pTitle.includes("sharee") ||
              pTitle.includes("saree") ||
              pTitle.includes("শাড়ি") ||
              pTitle.includes("শাড়ী")
            );
          }

          if (isPanjabiFilter) {
            return (
              pCat === "panjabi" ||
              pCat === "punjabi" ||
              pCat === "পাঞ্জাবি" ||
              pParent === "panjabi" ||
              pTitle.includes("panjabi") ||
              pTitle.includes("punjabi") ||
              pTitle.includes("পাঞ্জাবি")
            );
          }

          if (isThreePieceFilter) {
            return (
              normCat === "three piece" ||
              normCat.includes("three") ||
              normCat.includes("piece") ||
              normCat.includes("থ্রি") ||
              pTitle.includes("three piece") ||
              pTitle.includes("থ্রি-পিস") ||
              pTitle.includes("থ্রি পিস")
            );
          }

          if (isGownFilter) {
            return (
              normCat === "one piece gown" ||
              normCat.includes("gown") ||
              normCat.includes("গাউন") ||
              pTitle.includes("gown") ||
              pTitle.includes("গাউন")
            );
          }

          if (isFashionParent) {
            return (
              pParent === "fashion" ||
              normCat === "fashion" ||
              normCat === "shirt" ||
              normCat === "shart" ||
              normCat === "sharee" ||
              normCat === "panjabi" ||
              normCat === "ladies hoodie" ||
              normCat === "three piece" ||
              normCat === "one piece gown" ||
              normCat === "women hijab" ||
              normCat.includes("hoodie") ||
              pTitle.includes("shirt") ||
              pTitle.includes("shart") ||
              pTitle.includes("শার্ট") ||
              pTitle.includes("sharee") ||
              pTitle.includes("শাড়ি") ||
              pTitle.includes("panjabi") ||
              pTitle.includes("hoodie") ||
              pTitle.includes("hudie") ||
              pTitle.includes("হুডি")
            );
          }

          const normSelected = catLower.replace(/\s+/g, " ");
          return normCat === normSelected || pParent === catLower;
        });
      }
    }

    // Search query filter: Uses smart bilingual, phonetic, and alias-expanded matching
    if (searchQuery.trim()) {
      const searchMatches = filterProductsBySearch(list, searchQuery);
      // If category filter returned 0 items but the query matches products across the catalog,
      // fallback to searching all products so the user is never stuck with empty results!
      if (searchMatches.length === 0 && selectedCategory && selectedCategory !== "All") {
        list = filterProductsBySearch(products, searchQuery);
      } else {
        list = searchMatches;
      }
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  };

  // Drag-to-scroll & Arrow navigation for categories
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftState(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.6;
    if (Math.abs(walk) > 6) {
      setHasMoved(true);
    }
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleArrowScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="catalog-section" className="py-8 sm:py-12 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {searchQuery.trim() ? (
          /* Dedicated Search Results Header (Instantly shows search results with counts & clear actions) */
          <div className="space-y-4 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (setSearchQuery) setSearchQuery("");
                    handleCategorySelect("All");
                  }}
                  className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>{language === "bn" ? "হোম" : "Home"}</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {language === "bn" ? "অনুসন্ধান ফলাফল" : "Search Results"}
                </span>
              </nav>

              <div className="flex items-center gap-2">
                {setSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-xs transition-colors cursor-pointer shadow-xs"
                    title={language === "bn" ? "অনুসন্ধান মুছুন" : "Clear search"}
                  >
                    <X className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{language === "bn" ? "অনুসন্ধান মুছুন" : "Clear Search"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (setSearchQuery) setSearchQuery("");
                    handleCategorySelect("All");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === "bn" ? "সব পণ্য দেখুন" : "All Products"}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 mb-2">
                  <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {language === "bn"
                      ? `অনুসন্ধান: "${searchQuery}"`
                      : `Search: "${searchQuery}"`}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
                  <span>{language === "bn" ? "অনুসন্ধানের ফলাফল" : "Search Results"}</span>
                  <span className="text-base sm:text-lg font-bold text-zinc-500 dark:text-zinc-400">
                    ({filteredAndSorted.length})
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {filteredAndSorted.length > 0
                    ? language === "bn"
                      ? `"${searchQuery}" এর সাথে মিল রেখে মোট ${filteredAndSorted.length}টি পণ্য পাওয়া গেছে।`
                      : `Found ${filteredAndSorted.length} matching products for "${searchQuery}".`
                    : language === "bn"
                    ? `"${searchQuery}" এর জন্য কোনো পণ্য পাওয়া যায়নি। সঠিক বানান দিয়ে আবার অনুসন্ধান করুন।`
                    : `No products matched "${searchQuery}". Please check your spelling and try again.`}
                </p>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 shadow-xs self-start sm:self-auto">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline font-medium text-zinc-400">{t("sort_label")}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none focus:outline-none font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  aria-label="Sort products"
                >
                  <option value="featured">{t("sort_featured")}</option>
                  <option value="price-asc">{t("sort_price_low")}</option>
                  <option value="price-desc">{t("sort_price_high")}</option>
                  <option value="rating">{t("sort_rating")}</option>
                </select>
              </div>
            </div>
          </div>
        ) : selectedCategory !== "All" ? (
          /* Single Direct Category Page Section:
             Includes breadcrumbs, title, category pills, and sorting toolbar in ONE clean section without duplicate stacked banners! */
          <div className="space-y-4 mb-8">
            {/* Breadcrumb & Navigation Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleCategorySelect("All")}
                  className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>{language === "bn" ? "হোম" : "Home"}</span>
                </button>
                {isGrocerySubcategory(selectedCategory) ? (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <button
                      type="button"
                      onClick={() => handleCategorySelect(GROCERIES_PARENT)}
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                    >
                      {getCategoryName(GROCERIES_PARENT)}
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {getCategoryName(selectedCategory)}
                    </span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {getCategoryName(selectedCategory)}
                    </span>
                  </>
                )}
              </nav>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium text-xs transition-colors cursor-pointer shadow-xs"
                  title={language === "bn" ? "পেজ লিংক শেয়ার করুন" : "Share page link"}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{language === "bn" ? "লিংক কপি" : "Share URL"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategorySelect("All")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === "bn" ? "সব পণ্য দেখুন" : "All Products"}</span>
                </button>
              </div>
            </div>

            {/* Direct Category Title & Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
              <div>
                {selectedCategory === "Offer Zone" ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 mb-2 animate-pulse">
                    <span>🔥</span>
                    <span>{language === "bn" ? "স্পেশাল অফার ও ডিসকাউন্ট জোন" : "Exclusive Offer & Deal Zone"}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 mb-2">
                    <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>{language === "bn" ? "ক্যাটাগরি পেজ" : "Category Page"}</span>
                  </div>
                )}
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
                  <span>{getCategoryName(selectedCategory)}</span>
                  <span className="text-base sm:text-lg font-bold text-zinc-500 dark:text-zinc-400">
                    ({filteredAndSorted.length})
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
                  {selectedCategory === "Offer Zone"
                    ? (language === "bn"
                      ? `নিরাপদ ক্রয়ের স্পেশাল অফার জোনে সীমিত সময়ের জন্য আকর্ষণীয় ছাড়ে ${filteredAndSorted.length}টি প্রিমিয়াম পণ্য রয়েছে!`
                      : `Explore ${filteredAndSorted.length} limited-time special deals and discounted authentic products with cash on delivery.`)
                    : (language === "bn"
                      ? `নিরাপদ ক্রয়ে ${getCategoryName(selectedCategory)} ক্যাটাগরির ${filteredAndSorted.length}টি আসল ও বিশ্বস্ত পণ্য সমগ্র।`
                      : `Showing ${filteredAndSorted.length} authentic products in ${selectedCategory}. Order with cash on delivery.`)}
                </p>
              </div>

              {/* Sorting & Filter Controls Toolbar */}
              <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 shadow-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline font-medium text-zinc-400">{t("sort_label")}</span>
                  <select
                    id="product-sort-select-category"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent border-none focus:outline-none font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer text-xs"
                    aria-label="Sort products"
                  >
                    <option value="featured">{t("sort_featured")}</option>
                    <option value="price-asc">{t("sort_price_low")}</option>
                    <option value="price-desc">{t("sort_price_high")}</option>
                    <option value="rating">{t("sort_rating")}</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={onRefreshProducts}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
                  title={language === "bn" ? "পণ্য রিফ্রেশ করুন" : "Refresh Products"}
                  aria-label="Refresh product catalog"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
                </button>
              </div>
            </div>

            {/* If inside Groceries & Food or any grocery subcategory, show interactive Subcategories Strip */}
            {isGroceryRelatedCategory(selectedCategory) && (
              <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 category-scrollbar select-none">
                  <div className="flex items-center gap-1 text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0 mr-1">
                    <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{language === "bn" ? "সাব-ক্যাটাগরি:" : "Sub-categories:"}</span>
                  </div>

                  {/* All Groceries Parent Pill */}
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(GROCERIES_PARENT)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                      selectedCategory.toLowerCase() === GROCERIES_PARENT.toLowerCase() ||
                      selectedCategory.toLowerCase() === "groceries"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm ring-2 ring-orange-500/30 font-bold"
                        : "bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-orange-500 hover:text-orange-600"
                    }`}
                  >
                    <span>{language === "bn" ? "সকল মুদি ও খাদ্য" : "All Groceries"}</span>
                  </button>

                  {/* 8 Grocery Subcategory Pills */}
                  {GROCERY_SUBCATEGORIES.map((sub) => {
                    const isCurrent = selectedCategory.toLowerCase() === sub.toLowerCase();
                    const subCount = products.filter(
                      (p) => p.category.toLowerCase() === sub.toLowerCase()
                    ).length;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleCategorySelect(sub)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                          isCurrent
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm ring-2 ring-orange-500/30 font-bold"
                            : "bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-orange-500 hover:text-orange-600"
                        }`}
                      >
                        <span>{getCategoryName(sub)}</span>
                        {subCount > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isCurrent
                                ? "bg-white/25 text-white"
                                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                            }`}
                          >
                            {subCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If inside Fashion or any fashion subcategory, show interactive Fashion Subcategories Strip */}
            {isFashionRelatedCategory(selectedCategory) && (
              <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 category-scrollbar select-none">
                  <div className="flex items-center gap-1 text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0 mr-1">
                    <Filter className="w-3.5 h-3.5 text-[#d38f18] dark:text-amber-400" />
                    <span>{language === "bn" ? "সাব-ক্যাটাগরি:" : "Sub-categories:"}</span>
                  </div>

                  {/* All Fashion Parent Pill */}
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(FASHION_PARENT)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                      selectedCategory.toLowerCase() === FASHION_PARENT.toLowerCase() ||
                      selectedCategory.toLowerCase() === "fashion"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm ring-2 ring-orange-500/30 font-bold"
                        : "bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-orange-500 hover:text-orange-600"
                    }`}
                  >
                    <span>{language === "bn" ? "সকল পোশাক ও ফ্যাশন" : "All Fashion"}</span>
                  </button>

                  {/* Fashion Subcategory Pills */}
                  {FASHION_SUBCATEGORIES.map((sub) => {
                    const normSelected = selectedCategory.toLowerCase().replace(/\s+/g, " ");
                    const normSub = sub.toLowerCase().replace(/\s+/g, " ");
                    const isCurrent =
                      normSelected === normSub ||
                      (normSub === "ladies hoodie" &&
                        (normSelected === "hoodie" ||
                          normSelected === "hudie" ||
                          normSelected === "hoodies" ||
                          normSelected === "হুডি" ||
                          normSelected === "ladies-hoodie" ||
                          normSelected === "ladies  hoodie"));
                    const subCount = products.filter((p) => {
                      const pCatNorm = (p.category || "").toLowerCase().replace(/\s+/g, " ");
                      if (normSub === "ladies hoodie") {
                        return (
                          pCatNorm === "ladies hoodie" ||
                          pCatNorm.includes("hoodie") ||
                          pCatNorm.includes("hudie") ||
                          pCatNorm.includes("হুডি")
                        );
                      }
                      return pCatNorm === normSub;
                    }).length;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleCategorySelect(sub)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs ${
                          isCurrent
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm ring-2 ring-orange-500/30 font-bold"
                            : "bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-orange-500 hover:text-orange-600"
                        }`}
                      >
                        <span>{getCategoryName(sub)}</span>
                        {subCount > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isCurrent
                                ? "bg-white/25 text-white"
                                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                            }`}
                          >
                            {subCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Home page: Full Section Header & Category Navigation Track */
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80 mb-6">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-2">
                  <span>
                    {language === "bn" ? "আসল ও বিশ্বস্ত পণ্য সম্ভার" : "Verified Marketplace Catalog"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 font-display">
                  {language === "bn" ? "নিরাপদ কেনাকাটা সম্ভার" : "Shop Pure & Safe Products"}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  {language === "bn"
                    ? `মোট ${filteredAndSorted.length}টি পণ্য রয়েছে। পছন্দের পণ্য নির্বাচন করে সহজেই অর্ডার করুন।`
                    : `Showing ${filteredAndSorted.length} products. Browse, click for details, and order with cash on delivery.`}
                </p>
              </div>

              {/* Sort selector & Reload */}
              <div className="flex items-center gap-3 self-start md:self-auto">
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 shadow-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline font-medium text-zinc-400">{t("sort_label")}</span>
                  <select
                    id="product-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent border-none focus:outline-none font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                    aria-label="Sort products"
                  >
                    <option value="featured">{t("sort_featured")}</option>
                    <option value="price-asc">{t("sort_price_low")}</option>
                    <option value="price-desc">{t("sort_price_high")}</option>
                    <option value="rating">{t("sort_rating")}</option>
                  </select>
                </div>

                <button
                  onClick={onRefreshProducts}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-xs"
                  title={language === "bn" ? "পণ্য রিফ্রেশ করুন" : "Refresh Products"}
                  aria-label="Refresh product catalog"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
                </button>
              </div>
            </div>

            {/* Category Filter Bar with Fixed "All Products" and Draggable/Scrollable Category Pills */}
            <div className="mb-8">
              <div className="flex items-center gap-2">
                {/* Pinned "All Products" button that NEVER moves */}
                <div className="shrink-0 z-10">
                  <button
                    type="button"
                    id="catalog-all-products-fixed-btn"
                    onClick={() => handleCategorySelect("All")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      selectedCategory === "All"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/20"
                        : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/90 dark:border-zinc-800 hover:border-orange-500/50 hover:text-orange-600"
                    }`}
                    title={language === "bn" ? "সকল পণ্য" : "All Products"}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{language === "bn" ? "সকল পণ্য" : "All Products"}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === "All" ? "bg-white/20 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium"
                    }`}>
                      {products.length}
                    </span>
                  </button>
                </div>

                {/* Subtle Divider between Fixed All Products and Scrollable Categories */}
                <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800 shrink-0 mx-0.5" />

                {/* Scroll Left Button */}
                <button
                  type="button"
                  onClick={() => handleArrowScroll("left")}
                  aria-label="Scroll categories left"
                  className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 shrink-0 shadow-xs cursor-pointer transition-colors"
                  title={language === "bn" ? "বামে স্ক্রোল করুন" : "Scroll left"}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Scrollable & Draggable Categories Track with visible scrollbar along yellow line */}
                <div
                  ref={scrollContainerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  className="flex items-center gap-2 overflow-x-auto pb-2.5 pt-1 category-scrollbar select-none cursor-grab active:cursor-grabbing flex-1 scroll-smooth"
                >
                  {categories
                    .filter((c) => c !== "All")
                    .map((cat) => {
                      const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                      const isOfferZoneCat = cat.toLowerCase() === "offer zone" || cat.toLowerCase() === "offer-zone";
                      const count = isOfferZoneCat
                        ? products.filter((p) => p.isOfferZone || p.category.toLowerCase() === "offer zone" || (p.regularPrice && p.regularPrice > p.price) || (p.badge && (p.badge.toLowerCase().includes("off") || p.badge.toLowerCase().includes("ছাড়") || p.badge.toLowerCase().includes("offer") || p.badge.toLowerCase().includes("deal")))).length
                        : products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            if (!hasMoved) {
                              handleCategorySelect(cat);
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
                            isSelected
                              ? isOfferZoneCat
                                ? "bg-amber-600 text-white font-bold shadow-md shadow-amber-600/30 ring-1 ring-amber-400"
                                : "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/25"
                              : isOfferZoneCat
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-bold"
                                : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 hover:border-orange-500/50 hover:text-orange-600"
                          }`}
                        >
                          <span>{getCategoryName(cat)}</span>
                          {count > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isSelected ? "bg-white/20 text-white" : isOfferZoneCat ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>

                {/* Scroll Right Button */}
                <button
                  type="button"
                  onClick={() => handleArrowScroll("right")}
                  aria-label="Scroll categories right"
                  className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 shrink-0 shadow-xs cursor-pointer transition-colors"
                  title={language === "bn" ? "ডানে স্ক্রোল করুন" : "Scroll right"}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Product Grid State */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5 md:gap-6 pt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[280px] sm:h-[380px] rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/40 animate-pulse border border-zinc-200/50 dark:border-zinc-800/50"
              />
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 max-w-lg mx-auto shadow-xs">
            <ShoppingBag className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {searchQuery.trim()
                ? language === "bn"
                  ? `"${searchQuery}" এর জন্য কোনো পণ্য পাওয়া যায়নি`
                  : `No products found for "${searchQuery}"`
                : selectedCategory !== "All"
                ? language === "bn"
                  ? `"${getCategoryName(selectedCategory)}" ক্যাটাগরিতে পণ্য পাওয়া যায়নি`
                  : `No products found in ${getCategoryName(selectedCategory)}`
                : language === "bn"
                ? "কোনো পণ্য খুঁজে পাওয়া যায়নি"
                : "No products found"}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {searchQuery.trim()
                ? language === "bn"
                  ? "বানান যাচাই করে আবার চেষ্টা করুন অথবা সম্পূর্ণ ক্যাটালগ ঘুরে দেখুন।"
                  : "Check spelling or explore our complete catalog."
                : language === "bn"
                ? "খুব শীঘ্রই এই ক্যাটাগরিতে নতুন পণ্য যুক্ত করা হবে।"
                : "New products are being added to this category soon."}
            </p>
            <button
              onClick={() => {
                if (setSearchQuery) setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <span>{language === "bn" ? "সকল পণ্য দেখতে ফিরে যান" : "Back to All Products"}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-5 md:gap-6">
            {filteredAndSorted.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={onQuickView}
                onProductClick={onProductClick}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={wishlistIds.includes(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
