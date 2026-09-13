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
  ChevronRight
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: string[];
  searchQuery: string;
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
  onQuickView,
  onRefreshProducts,
  onProductClick,
  wishlistIds = [],
  onToggleWishlist
}) => {
  const { language, t, getCategoryName } = useLanguage();
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");

  const filteredAndSorted = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory && selectedCategory !== "All") {
      list = list.filter(
        (p) => p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
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
    const catalogEl = document.getElementById("catalog-section");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
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
        {/* Section Header & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80 mb-6">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-2">
              <span>
                {selectedCategory === "All"
                  ? language === "bn" ? "আসল ও বিশ্বস্ত পণ্য সম্ভার" : "Verified Marketplace Catalog"
                  : getCategoryName(selectedCategory)}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 font-display">
              {selectedCategory === "All"
                ? language === "bn" ? "নিরাপদ কেনাকাটা সম্ভার" : "Shop Pure & Safe Products"
                : `${getCategoryName(selectedCategory)} (${filteredAndSorted.length})`}
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
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/20"
                    : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/90 dark:border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-600"
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
                  const count = products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
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
                          ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20"
                          : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-600"
                      }`}
                    >
                      <span>{getCategoryName(cat)}</span>
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? "bg-white/20 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
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

        {/* Product Grid State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[380px] rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/40 animate-pulse border border-zinc-200/50 dark:border-zinc-800/50"
              />
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 max-w-lg mx-auto shadow-xs">
            <ShoppingBag className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {language === "bn"
                ? selectedCategory !== "All"
                  ? `"${getCategoryName(selectedCategory)}" ক্যাটাগরিতে পণ্য পাওয়া যায়নি`
                  : "কোনো পণ্য খুঁজে পাওয়া যায়নি"
                : "No products found"}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {language === "bn"
                ? "খুব শীঘ্রই এই ক্যাটাগরিতে নতুন পণ্য যুক্ত করা হবে।"
                : "New products are being added to this category soon."}
            </p>
            <button
              onClick={() => setSelectedCategory("All")}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <span>{language === "bn" ? "সকল পণ্য দেখতে ফিরে যান" : "Back to All Products"}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
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
