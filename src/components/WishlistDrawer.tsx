import React from "react";
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { Product } from "../types";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistProducts: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onNavigateToCategory: (category: string) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistProducts,
  onRemoveFromWishlist,
  onNavigateToCategory
}) => {
  const { addItem, buyNow } = useCart();
  const { language, formatPrice, getCategoryName } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  {language === "bn" ? "পছন্দের পণ্য তালিকা" : "My Wishlist"}
                </h3>
                <p className="text-xs text-zinc-400">
                  {wishlistProducts.length} {language === "bn" ? "টি পণ্য সংরক্ষিত" : "items saved"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {wishlistProducts.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Heart className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                  {language === "bn" ? "আপনার পছন্দের তালিকা খালি" : "Your Wishlist is Empty"}
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                  {language === "bn"
                    ? "যেকোনো পণ্যের হৃদপিণ্ড (হার্ট) আইকনে চাপ দিয়ে আপনার পছন্দের তালিকায় যুক্ত করুন।"
                    : "Tap the heart icon on any product to save it here for later."}
                </p>
              </div>
            ) : (
              wishlistProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 group"
                >
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-20 h-20 rounded-xl object-cover bg-white dark:bg-zinc-900 shrink-0 cursor-pointer"
                    onClick={() => {
                      onNavigateToCategory(product.category);
                      onClose();
                    }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          {getCategoryName(product.category)}
                        </span>
                        <button
                          onClick={() => onRemoveFromWishlist(product.id)}
                          className="text-zinc-400 hover:text-rose-500 transition-colors p-0.5"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4
                        onClick={() => {
                          onNavigateToCategory(product.category);
                          onClose();
                        }}
                        className="font-bold text-xs text-zinc-900 dark:text-white line-clamp-1 hover:text-emerald-600 cursor-pointer"
                      >
                        {product.title}
                      </h4>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white font-display mt-0.5">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => {
                          addItem(product);
                        }}
                        className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>{language === "bn" ? "কার্টে নিন" : "Add to Cart"}</span>
                      </button>
                      <button
                        onClick={() => {
                          buyNow(product);
                          onClose();
                        }}
                        className="py-1.5 px-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-bold transition-colors"
                      >
                        {language === "bn" ? "কিনুন" : "Buy"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
