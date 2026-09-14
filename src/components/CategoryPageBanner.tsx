import React from "react";
import { Home, ChevronRight, CheckCircle, Share2, ArrowLeft, Layers } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";

interface CategoryPageBannerProps {
  category: string;
  totalProducts: number;
  onBackToHome: () => void;
  onSelectCategory: (cat: string) => void;
  categories: string[];
}

export const CategoryPageBanner: React.FC<CategoryPageBannerProps> = ({
  category,
  totalProducts,
  onBackToHome,
  onSelectCategory,
  categories
}) => {
  const { language, getCategoryName } = useLanguage();
  const { addToast } = useToast();

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

  return (
    <div className="bg-gradient-to-b from-emerald-500/10 via-zinc-50 to-transparent dark:from-emerald-950/20 dark:via-zinc-950 dark:to-transparent border-b border-zinc-200/80 dark:border-zinc-800/80 pt-6 pb-6 sm:pb-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Breadcrumb & Navigation Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{language === "bn" ? "হোম" : "Home"}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {getCategoryName(category)}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium text-xs transition-colors cursor-pointer shadow-xs"
              title={language === "bn" ? "পেজ লিংক শেয়ার করুন" : "Share page link"}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{language === "bn" ? "লিংক কপি" : "Share URL"}</span>
            </button>

            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === "bn" ? "সব পণ্য দেখুন" : "All Products"}</span>
            </button>
          </div>
        </div>

        {/* Title, Badge & Product Count */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 mb-2">
              <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>
                {language === "bn" ? "ক্যাটাগরি পেজ" : "Category Page"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight font-display">
              {getCategoryName(category)}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {language === "bn"
                ? `নিরাপদ ক্রয়ে ${getCategoryName(category)} ক্যাটাগরির ${totalProducts}টি ভেরিফাইড আসল ও প্রিমিয়াম পণ্য রয়েছে।`
                : `Showing ${totalProducts} verified authentic products in ${category}. Fast delivery across Bangladesh.`}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 shadow-xs">
              {language === "bn" ? `মোট পণ্য: ${totalProducts}টি` : `Total: ${totalProducts} Items`}
            </span>
          </div>
        </div>

        {/* Quick Category Hopping Pills */}
        <div className="pt-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 category-scrollbar">
            <button
              onClick={onBackToHome}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <Layers className="w-3 h-3 text-zinc-400" />
              <span>{language === "bn" ? "সব ক্যাটাগরি" : "All"}</span>
            </button>
            {categories
              .filter(c => c !== "All")
              .map(cat => {
                const isActive = cat.toLowerCase() === category.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-xs ${
                      isActive
                        ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20"
                        : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 hover:text-emerald-600"
                    }`}
                  >
                    {getCategoryName(cat)}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
