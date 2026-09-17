import React, { useState } from "react";
import { Home, Layers, Heart, Package, ShoppingCart, Lock, X, ChevronRight, Sparkles, Tag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { formatCategoryDisplayLabel } from "../data/categories";

interface MobileBottomNavProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenTrackOrder: () => void;
  onOpenWishlist: () => void;
  wishlistCount: number;
  categories: string[];
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenTrackOrder,
  onOpenWishlist,
  wishlistCount,
  categories
}) => {
  const { itemCount, setIsCartOpen, subtotal } = useCart();
  const { setIsAdminModalOpen } = useAuth();
  const { language, formatPrice, getCategoryName } = useLanguage();
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  // Discreet Admin access for Phone / Tablet users without keyboard
  const [adminTapCount, setAdminTapCount] = useState(0);

  const handleAdminTap = () => {
    setAdminTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setIsAdminModalOpen(true);
        return 0;
      }
      return next;
    });
    // Auto reset tap count if inactive for 3 seconds
    setTimeout(() => {
      setAdminTapCount(0);
    }, 3000);
  };

  const isHomeActive = selectedCategory === "All" && !isCategorySheetOpen;

  return (
    <>
      {/* Mobile Category Quick Sheet */}
      {isCategorySheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setIsCategorySheetOpen(false)}
          />
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl border-t border-zinc-200 dark:border-zinc-800 p-4 pb-safe max-h-[82dvh] flex flex-col shadow-2xl">
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
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
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
                aria-label="Close categories sheet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Categories List */}
            <div className="overflow-y-auto py-3 space-y-1.5 flex-1 -webkit-overflow-scrolling:touch">
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

      {/* Sticky Bottom Navigation Bar for Mobile Phones & Small Tablets */}
      <nav
        id="mobile-bottom-navigation"
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      >
        <div className="grid grid-cols-5 items-center h-15 px-1 max-w-lg mx-auto">
          {/* 1. Home Button */}
          <button
            type="button"
            onClick={() => {
              onSelectCategory("All");
              setIsCategorySheetOpen(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-colors cursor-pointer select-none active:scale-95 ${
              isHomeActive
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
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
            onClick={() => setIsCategorySheetOpen(!isCategorySheetOpen)}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-colors cursor-pointer select-none active:scale-95 ${
              isCategorySheetOpen || (selectedCategory !== "All")
                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <div className="relative">
              <Layers className={`w-5 h-5 ${selectedCategory !== "All" || isCategorySheetOpen ? "stroke-[2.5]" : "stroke-2"}`} />
              {selectedCategory !== "All" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </div>
            <span className="text-[10px] leading-none">{language === "bn" ? "ক্যাটাগরি" : "Categories"}</span>
          </button>

          {/* 3. Wishlist Button */}
          <button
            type="button"
            onClick={onOpenWishlist}
            className="flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer select-none active:scale-95 relative"
          >
            <div className="relative">
              <Heart className="w-5 h-5 stroke-2" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-none">{language === "bn" ? "পছন্দ" : "Wishlist"}</span>
          </button>

          {/* 4. Track Order Button */}
          <button
            type="button"
            onClick={onOpenTrackOrder}
            className="flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 transition-colors cursor-pointer select-none active:scale-95"
          >
            <div className="relative">
              <Package className="w-5 h-5 stroke-2" />
            </div>
            <span className="text-[10px] leading-none">{language === "bn" ? "ট্র্যাক" : "Track"}</span>
          </button>

          {/* 5. Cart Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 transition-colors cursor-pointer select-none active:scale-95 relative"
          >
            <div className="relative">
              <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
              </div>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-md animate-bounce animate-once">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-none font-bold text-emerald-600 dark:text-emerald-400">
              {itemCount > 0 ? formatPrice(subtotal) : (language === "bn" ? "কার্ট" : "Cart")}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
