import React, { useState, useEffect } from "react";
import { Product } from "../types";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { getProductImagesWithCodes } from "../utils/productCodeHelper";
import {
  X,
  Star,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ExternalLink,
  Link2,
  ChevronLeft,
  ChevronRight,
  Images,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addItem, buyNow, items } = useCart();
  const { language, t, formatPrice, getCategoryName } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Extract all gallery images with their assigned/auto-generated codes
  const imageItems = getProductImagesWithCodes(product);
  const galleryImages = imageItems.map((item) => item.url);
  const activeImageItem = imageItems[currentImageIndex] || imageItems[0];

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?.id]);

  // Keyboard navigation between pictures
  useEffect(() => {
    if (!product || galleryImages.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [product, galleryImages.length]);

  if (!product) return null;

  const inCartItem = items.find((i) => i.product.id === product.id);
  const discountPercent = product.regularPrice
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : null;

  const handleCopyLink = () => {
    const url = product.affiliateUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 my-auto max-h-[92dvh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-2 rounded-full bg-white/90 dark:bg-zinc-800/90 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white shadow-md backdrop-blur-md transition-colors cursor-pointer"
            aria-label="Close product view"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto">
            {/* Image Gallery Column */}
            <div className="flex flex-col bg-zinc-100 dark:bg-zinc-800/60 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800">
              {/* Main Photo Display */}
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/60">
                <motion.img
                  key={currentImageIndex}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  src={galleryImages[currentImageIndex] || product.imageUrl}
                  alt={`${product.title} - photo ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
                  {product.badge && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-900/90 text-white dark:bg-white dark:text-zinc-900 backdrop-blur-md shadow-sm">
                      {product.badge}
                    </span>
                  )}
                  {discountPercent && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm">
                      -{discountPercent}% {language === "bn" ? "ছাড়" : "OFF"}
                    </span>
                  )}
                </div>

                {/* Picture Code Tag Overlay */}
                {activeImageItem && (
                  <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md pointer-events-none">
                    <Tag className="w-3 h-3 text-emerald-400" />
                    <span>{language === "bn" ? "কোড" : "Code"}: {activeImageItem.code}</span>
                  </div>
                )}

                {/* Image Counter Badge: 1 / 4 */}
                {galleryImages.length > 1 && (
                  <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-md pointer-events-none">
                    <Images className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentImageIndex + 1} / {galleryImages.length}</span>
                  </div>
                )}

                {/* Next / Prev Carousel Arrows */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 dark:bg-zinc-900/85 text-zinc-800 dark:text-zinc-100 shadow-lg hover:bg-white dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer z-10"
                      title={language === "bn" ? "পূর্ববর্তী ছবি" : "Previous photo"}
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/85 dark:bg-zinc-900/85 text-zinc-800 dark:text-zinc-100 shadow-lg hover:bg-white dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer z-10"
                      title={language === "bn" ? "পরবর্তী ছবি" : "Next photo"}
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Interactive Thumbnail Strip with Picture Codes */}
              {galleryImages.length > 1 && (
                <div className="p-3 bg-white dark:bg-zinc-900/90 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        currentImageIndex === idx
                          ? "border-emerald-500 scale-105 shadow-md ring-2 ring-emerald-500/25"
                          : "border-transparent opacity-70 hover:opacity-100 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                      aria-label={`View photo ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover object-center"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-emerald-300 font-mono text-center truncate px-0.5">
                        {imageItems[idx]?.code || `#${idx + 1}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content Column */}
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                  {getCategoryName(product.category)}
                </span>

                <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-display">
                  {product.title}
                </h2>

                {/* Rating & Stock */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-amber-400/15 px-2 py-0.5 rounded-md text-amber-600 dark:text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{product.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    ({product.ratingCount} {language === "bn" ? "ভেরিফায়েড রিভিউ" : "verified reviews"})
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span className={`text-xs font-semibold ${product.stock > 5 ? "text-emerald-500" : "text-amber-500"}`}>
                    {product.stock > 0
                      ? (language === "bn" ? `স্টক আছে (${product.stock} টি)` : `${product.stock} in stock`)
                      : (language === "bn" ? "স্টক শেষ" : "Out of stock")}
                  </span>
                </div>

                {/* Price Display */}
                <div className="mt-5 flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-display">
                    {formatPrice(product.price)}
                  </span>
                  {product.regularPrice && product.regularPrice > product.price && (
                    <span className="text-base text-zinc-400 dark:text-zinc-500 line-through">
                      {formatPrice(product.regularPrice)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {product.description}
                </p>

                {/* Variant / Picture Code Selector */}
                {imageItems.length > 0 && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{language === "bn" ? "ছবির কোড নির্বাচন করুন:" : "Select Picture Code:"}</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {activeImageItem?.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {imageItems.map((item, idx) => {
                        const isSelected = currentImageIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-bold shadow-xs"
                                : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                            }`}
                          >
                            <img
                              src={item.url}
                              alt=""
                              className="w-5 h-5 rounded-md object-cover border border-zinc-200 dark:border-zinc-700"
                            />
                            <span className="font-mono">{item.code}</span>
                            {idx === 0 && (
                              <span className="text-[10px] text-zinc-400">
                                ({language === "bn" ? "কভার" : "Cover"})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Affiliate Partner Notice Banner */}
                {product.isAffiliate && (
                  <div className="mt-4 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-zinc-700 dark:text-zinc-300">
                      <p className="font-bold text-indigo-700 dark:text-indigo-300">
                        {language === "bn"
                          ? `অফিসিয়াল পার্টনার পণ্য (${product.affiliateSource || "অনলাইন মার্কেট"})`
                          : `Verified Partner Product (${product.affiliateSource || "Online Market"})`}
                      </p>
                      <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                        {language === "bn"
                          ? "অর্ডার করতে নিচের বাটনে ক্লিক করলে সরাসরি বিশ্বস্ত পার্টনার ওয়েবসাইটে নিয়ে যাবে।"
                          : "Clicking the order button will redirect you directly to the verified seller website."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Benefits */}
                <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <Truck className="w-4 h-4 text-emerald-500" />
                    <span>
                      {language === "bn"
                        ? "৳১৫০০ এর বেশি অর্ডারে দ্রুত ফ্রি হোম ডেলিভারি"
                        : "Free express delivery on orders over ৳1,500"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <span>
                      {language === "bn"
                        ? "১০০% অরিজিনাল প্রোডাক্ট ও অফিসিয়াল ওয়ারেন্টি গ্যারান্টি"
                        : "100% genuine product & manufacturer guarantee"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <RotateCcw className="w-4 h-4 text-amber-500" />
                    <span>
                      {language === "bn"
                        ? "৭ দিনের সহজ ও নির্ঝঞ্ঝাট রিটার্ন পলিসি"
                        : "7-day hassle-free return window"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector & Action Buttons */}
              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
                {product.isAffiliate ? (
                  <div className="flex flex-col gap-2.5">
                    <a
                      href={product.affiliateUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/30 hover:shadow-lg transition-all active:scale-[0.98] text-center"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      <span>
                        {product.affiliateButtonText ||
                          (language === "bn"
                            ? `সরাসরি পার্টনার সাইটে কিনুন ↗`
                            : `Buy Directly on Partner Site ↗`)}
                      </span>
                    </a>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>
                          {copiedLink
                            ? language === "bn"
                              ? "লিংক কপি হয়েছে!"
                              : "Link Copied!"
                            : language === "bn"
                            ? "প্রোডাক্ট লিংক কপি করুন"
                            : "Copy Product Link"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={onClose}
                        className="py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {language === "bn" ? "বন্ধ করুন" : "Close"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        {t("quantity")}
                      </span>
                      <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-800">
                        <button
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="px-3 py-1 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                          className="px-3 py-1 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        onClick={() => {
                          addItem(product, quantity, activeImageItem?.code, activeImageItem?.url);
                        }}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                      >
                        {inCartItem ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-500" />
                            <span>{t("added")} ({inCartItem.quantity})</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            <span>{t("add_to_cart")}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          buyNow(product, activeImageItem?.code, activeImageItem?.url, quantity);
                          onClose();
                        }}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#846F15] hover:bg-[#967F19] active:bg-[#6E5C0E] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#846F15]/30 transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>{t("buy_now")}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

