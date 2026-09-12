import React, { useState, useMemo } from "react";
import { Product } from "../types";
import { ProductCard } from "./ProductCard";
import { SlidersHorizontal, ArrowUpDown, RefreshCw, Sparkles } from "lucide-react";
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
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  selectedCategory,
  setSelectedCategory,
  categories,
  searchQuery,
  onQuickView,
  onRefreshProducts
}) => {
  const { language, t, getCategoryName } = useLanguage();
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");

  const filteredAndSorted = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory !== "All") {
      list = list.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        p =>
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
      // Default: featured first, then title
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <section id="catalog-section" className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {language === "bn" ? "যাচাইকৃত পণ্য সম্ভার" : "Verified Catalog"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 font-display">
              {language === "bn" ? "নিরাপদ শপিং কালেকশন" : "Curated Collection"}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {language === "bn"
                ? `${filteredAndSorted.length} টি মানসম্মত পণ্য অর্ডার করার জন্য প্রস্তুত`
                : `Showing ${filteredAndSorted.length} verified products ready for instant delivery`}
            </p>
          </div>

          {/* Sort selector & Reload */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300">
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
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-emerald-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={language === "bn" ? "পণ্য রিফ্রেশ করুন" : "Refresh Products"}
              aria-label="Refresh product catalog"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto py-5 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-md"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                {getCategoryName(cat)}
              </button>
            );
          })}
        </div>

        {/* Product Grid State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[380px] rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/40 animate-pulse border border-zinc-200/50 dark:border-zinc-800/50"
              />
            ))}
          </div>
        ) : filteredAndSorted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
            {filteredAndSorted.map((product) => (
              <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 mt-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 mb-4">
              <SlidersHorizontal className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {language === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {language === "bn"
                ? `আপনার নির্বাচিত ফিল্টার বা অনুসন্ধান "${searchQuery}" এর সাথে মিলে এমন কোনো পণ্য পাওয়া যায়নি।`
                : `We couldn't find any items matching your current filters or search term "${searchQuery}".`}
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                const input = document.getElementById("search-input") as HTMLInputElement;
                if (input) input.value = "";
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
            >
              {language === "bn" ? "ফিল্টার রিসেট করুন" : "Reset All Filters"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
