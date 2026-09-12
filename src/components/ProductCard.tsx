import React from "react";
import { Product } from "../types";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { Star, ShoppingCart, Zap, Eye, Check, ExternalLink, Images } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addItem, buyNow, items } = useCart();
  const { language, t, formatPrice, getCategoryName } = useLanguage();
  const inCartItem = items.find((i) => i.product.id === product.id);

  const discountPercent = product.regularPrice
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  const secondaryImage = product.images && product.images.length > 1 ? product.images[1] : null;
  const totalImages = product.images && product.images.length > 0 ? product.images.length : 1;

  return (
    <div
      id={`product-card-${product.id}`}
      className="group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Product Image with Hover Zoom and Smooth Hover Switch to 2nd Image */}
      <div
        onClick={() => onQuickView(product)}
        className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/60 cursor-pointer"
      >
        {/* Primary Image */}
        <img
          src={product.imageUrl}
          alt={product.title}
          loading="lazy"
          className={`h-full w-full object-cover object-center transition-all duration-500 ease-out ${
            secondaryImage
              ? "group-hover:opacity-0 group-hover:scale-105"
              : "group-hover:scale-110"
          }`}
        />

        {/* Secondary Alternate Image (revealed on mouse hover) */}
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.title} - alternate view`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-105 transition-all duration-500 ease-out"
          />
        )}

        {/* Multi-image Count Indicator Badge */}
        {totalImages > 1 && (
          <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold opacity-85 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Images className="w-3 h-3" />
            <span>
              {language === "bn" ? `${totalImages}টি ছবি` : `${totalImages} photos`}
            </span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.isAffiliate && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white backdrop-blur-md shadow-xs">
              <ExternalLink className="w-2.5 h-2.5" />
              <span>{product.affiliateSource || (language === "bn" ? "অ্যাফিলিয়েট" : "Partner")}</span>
            </span>
          )}
          {product.badge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-900/85 text-white dark:bg-white/90 dark:text-zinc-950 backdrop-blur-md shadow-xs">
              {product.badge}
            </span>
          )}
          {discountPercent && discountPercent > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Quick View Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute top-3 right-3 p-2 rounded-xl bg-white/85 dark:bg-zinc-900/85 text-zinc-700 dark:text-zinc-200 backdrop-blur-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-md cursor-pointer z-20"
          title={language === "bn" ? "বিস্তারিত ছবি ও বিবরণ দেখুন" : "View all photos and details"}
          aria-label={`Quick view ${product.title}`}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Low Stock Pill (Only for non-affiliate inventory) */}
        {!product.isAffiliate && product.stock <= 5 && product.stock > 0 && (
          <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-zinc-950 text-[10px] font-bold tracking-tight">
              {language === "bn" ? `আর মাত্র ${product.stock}টি বাকি!` : `Only ${product.stock} left!`}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-400 dark:text-zinc-500 mb-1.5">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-600 dark:text-emerald-400">
            {getCategoryName(product.category)}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-zinc-700 dark:text-zinc-300">{product.rating.toFixed(1)}</span>
            <span className="text-[11px]">({product.ratingCount})</span>
          </div>
        </div>

        <h3
          onClick={() => onQuickView(product)}
          className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base line-clamp-1 group-hover:text-emerald-500 transition-colors cursor-pointer"
          title={product.title}
        >
          {product.title}
        </h3>

        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Pricing */}
        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-extrabold text-lg sm:text-xl text-zinc-900 dark:text-zinc-50 font-display">
            {formatPrice(product.price)}
          </span>
          {product.regularPrice && product.regularPrice > product.price && (
            <span className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 line-through">
              {formatPrice(product.regularPrice)}
            </span>
          )}
        </div>

        {/* Action Buttons: Affiliate Direct Link vs Standard Store Checkout */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          {product.isAffiliate ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onQuickView(product)}
                className="flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1.5 sm:px-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="truncate">{language === "bn" ? "বিবরণ দেখুন" : "Details"}</span>
              </button>
              <a
                href={product.affiliateUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1.5 sm:px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-[11px] sm:text-xs font-bold tracking-wide shadow-sm shadow-indigo-600/30 hover:shadow-md transition-all active:scale-[0.98] text-center"
                title="Open partner store website in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {product.affiliateButtonText || (language === "bn" ? "কিনুন ↗" : "Buy Link ↗")}
                </span>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                id={`add-to-cart-${product.id}`}
                onClick={() => addItem(product)}
                className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  inCartItem
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {inCartItem ? (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{language === "bn" ? `কার্টে (${inCartItem.quantity})` : `In Cart (${inCartItem.quantity})`}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t("add_to_cart")}</span>
                  </>
                )}
              </button>

              <button
                id={`buy-now-${product.id}`}
                onClick={() => buyNow(product)}
                className="flex items-center justify-center gap-1 py-2.5 px-1.5 sm:px-2 rounded-xl bg-[#846F15] hover:bg-[#967F19] active:bg-[#6E5C0E] text-white text-[11px] sm:text-xs font-bold tracking-wide shadow-sm shadow-[#846F15]/30 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                <span className="truncate">{t("buy_now")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

