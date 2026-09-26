import React from "react";
import { Product } from "../types";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { Star, ShoppingCart, Zap, Eye, Check, ExternalLink, Images, Heart } from "lucide-react";
import { handleProductImageError } from "../utils/imageHelper";

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isWishlisted?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onProductClick,
  onToggleWishlist,
  isWishlisted = false
}) => {
  const { addItem, buyNow, items } = useCart();
  const { language, t, formatPrice, getCategoryName } = useLanguage();
  const inCartItem = items.find((i) => i.product.id === product.id);

  const discountPercent = product.regularPrice
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  const secondaryImage = product.images && product.images.length > 1 ? product.images[1] : null;
  const totalImages = product.images && product.images.length > 0 ? product.images.length : 1;

  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      onQuickView(product);
    }
  };

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      className="group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      {/* Product Image with Hover Zoom */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/60">
        {/* Primary Image */}
        <img
          src={product.imageUrl || (product.images && product.images[0]) || "/images/products/prod-shirt-0.jpg"}
          alt={product.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => handleProductImageError(e, product.imageUrl || (product.images && product.images[0]))}
          className={`h-full w-full object-cover object-center transition-all duration-500 ease-out ${
            secondaryImage
              ? "group-hover:opacity-0 group-hover:scale-105"
              : "group-hover:scale-110"
          }`}
        />

        {/* Secondary Alternate Image */}
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.title} - alternate view`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => handleProductImageError(e, secondaryImage)}
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

        {/* Top-Left Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.badge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white backdrop-blur-md shadow-xs">
              {product.badge}
            </span>
          )}
          {discountPercent && discountPercent > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Top-Right Action Buttons: Wishlist & Quick View */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
          {onToggleWishlist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(product);
              }}
              className={`p-2 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-110 shadow-md cursor-pointer ${
                isWishlisted
                  ? "bg-rose-500 text-white"
                  : "bg-white/85 dark:bg-zinc-900/85 text-zinc-700 dark:text-zinc-200 hover:text-rose-500"
              }`}
              title={isWishlisted ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় রাখুন"}
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="p-2 rounded-xl bg-white/85 dark:bg-zinc-900/85 text-zinc-700 dark:text-zinc-200 backdrop-blur-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-md cursor-pointer"
            title={language === "bn" ? "বিস্তারিত ছবি ও বিবরণ দেখুন" : "View all photos and details"}
            aria-label={`Quick view ${product.title}`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Low Stock Pill */}
        {!product.isAffiliate && product.stock <= 5 && product.stock > 0 && (
          <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-zinc-950 text-[10px] font-bold tracking-tight">
              {language === "bn" ? `আর মাত্র ${product.stock}টি বাকি!` : `Only ${product.stock} left!`}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-4 md:p-5">
        <div className="flex items-center justify-between gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 mb-1">
          {/* Category Tag & Product Code */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 sm:px-2 py-0.5 rounded-md truncate max-w-[110px] sm:max-w-none">
              {getCategoryName(product.category)}
            </span>
            {product.productCode && (
              <span className="font-mono font-bold text-[10px] text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                #{product.productCode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm">{product.rating.toFixed(1)}</span>
            <span className="text-[10px] sm:text-[11px] hidden xs:inline">({product.ratingCount})</span>
          </div>
        </div>

        <h3
          className="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm md:text-base line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
          title={product.title}
        >
          {product.title}
        </h3>

        <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Available Sizes Preview */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mt-1.5 sm:mt-2 flex items-center gap-1 flex-wrap">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
              সাইজ:
            </span>
            {product.sizes.slice(0, 5).map((s) => (
              <span
                key={s}
                className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold border border-zinc-200/80 dark:border-zinc-700/80"
              >
                {s}
              </span>
            ))}
            {product.sizes.length > 5 && (
              <span className="text-[10px] text-zinc-400">+{product.sizes.length - 5}</span>
            )}
          </div>
        )}

        {/* Pricing */}
        <div className="mt-2 sm:mt-4 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
          <span className="font-extrabold text-base sm:text-lg md:text-xl text-zinc-900 dark:text-zinc-50 font-display">
            {formatPrice(product.price)}
          </span>
          {product.regularPrice && product.regularPrice > product.price && (
            <span className="text-[11px] sm:text-xs md:text-sm text-zinc-400 dark:text-zinc-500 line-through">
              {formatPrice(product.regularPrice)}
            </span>
          )}
        </div>

        {/* Action Buttons: Add to Cart & Buy Now */}
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {/* Add to Cart Button (stopPropagation prevents card navigation) */}
            <button
              id={`add-to-cart-${product.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addItem(product);
              }}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-[10px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[38px] sm:min-h-[42px] ${
                inCartItem
                  ? "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {inCartItem ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{language === "bn" ? `কার্ট (${inCartItem.quantity})` : `In Cart (${inCartItem.quantity})`}</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t("add_to_cart")}</span>
                </>
              )}
            </button>

            {/* Buy Now Button (stopPropagation prevents card navigation, opens checkout directly) */}
            <button
              id={`buy-now-${product.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                buyNow(product);
              }}
              className="flex items-center justify-center gap-1 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:from-orange-700 active:to-amber-700 text-white font-extrabold text-[10px] sm:text-xs tracking-wide shadow-sm shadow-orange-500/30 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer min-h-[38px] sm:min-h-[42px]"
            >
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="truncate">{t("buy_now")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
