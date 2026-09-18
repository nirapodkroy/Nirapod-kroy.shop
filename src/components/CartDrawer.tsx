import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const FREE_SHIPPING_THRESHOLD = 1500; // in BDT

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    setIsCheckoutOpen,
    openCartCheckout
  } = useCart();
  const { language, t, formatPrice, getCategoryName } = useLanguage();

  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState("");

  const handleApplyPromo = () => {
    setPromoError("");
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;

    if (clean === "NIRAPOD10" || clean === "SAVE10") {
      setAppliedDiscount({ code: clean, percent: 10 });
    } else if (clean === "WELCOME20") {
      setAppliedDiscount({ code: clean, percent: 20 });
    } else {
      setPromoError(language === "bn" ? "ভুল কুপন কোড! চেষ্টা করুন 'NIRAPOD10'" : "Invalid coupon code. Try 'NIRAPOD10'");
    }
  };

  const discountAmount = appliedDiscount ? (subtotal * appliedDiscount.percent) / 100 : 0;
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const progressToFreeShipping = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  if (!isCartOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full sm:w-[420px] bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 font-display">
                  {t("cart_title")} ({items.length})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-zinc-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                    title={t("clear_cart")}
                  >
                    {t("clear_cart")}
                  </button>
                )}
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  aria-label="Close cart drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Free Shipping Progress Bar */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3.5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {isFreeShipping ? (
                    <span className="text-emerald-500 font-bold">{t("free_shipping_unlocked")}</span>
                  ) : (
                    <span>
                      {language === "bn" ? (
                        <>
                          আর <strong className="text-zinc-900 dark:text-white">{formatPrice(remainingForFreeShipping)}</strong> এর কেনাকাটায় ফ্রি ডেলিভারি!
                        </>
                      ) : (
                        <>
                          Add <strong className="text-zinc-900 dark:text-white">{formatPrice(remainingForFreeShipping)}</strong> more for Free Shipping
                        </>
                      )}
                    </span>
                  )}
                </span>
                <span className="text-zinc-400">{Math.round(progressToFreeShipping)}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progressToFreeShipping}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-zinc-800 dark:text-zinc-200">
                    {language === "bn" ? "আপনার কার্ট খালি" : "Your cart is empty"}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                    {t("empty_cart_message")}
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    {t("start_shopping")}
                  </button>
                </div>
              ) : (
                items.map(({ product, quantity, selectedImageCode, selectedImageUrl }) => (
                  <div
                    key={product.id}
                    className="flex gap-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800/80"
                  >
                    <img
                      src={selectedImageUrl || product.imageUrl}
                      alt={product.title}
                      className="w-20 h-20 rounded-xl object-cover object-center bg-zinc-200 dark:bg-zinc-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {product.title}
                          </h4>
                          <button
                            onClick={() => removeItem(product.id)}
                            className="text-zinc-400 hover:text-rose-500 p-1 shrink-0 transition-colors cursor-pointer"
                            aria-label={`Remove ${product.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 capitalize">
                            {getCategoryName(product.category)}
                          </p>
                          {selectedImageCode && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                              📷 কোড: {selectedImageCode}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-sm text-zinc-900 dark:text-white">
                          {formatPrice(product.price * quantity)}
                        </span>

                        {/* Quantity Controls */}
                        <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                          <button
                            onClick={() => updateQuantity(product.id, -1)}
                            className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer & Checkout */}
            {items.length > 0 && (
              <div className="p-4 sm:p-6 pb-6 sm:pb-6 pb-safe border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
                {/* Promo Code Input */}
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder={language === "bn" ? "কুপন কোড (যেমন: NIRAPOD10)" : "Coupon code (e.g. NIRAPOD10)"}
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs uppercase bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      onClick={handleApplyPromo}
                      className="px-3 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-700 text-white text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
                    >
                      {t("apply")}
                    </button>
                  </div>
                  {promoError && <p className="text-[11px] text-rose-500">{promoError}</p>}
                  {appliedDiscount && (
                    <p className="text-[11px] text-emerald-500 font-semibold">
                      {language === "bn"
                        ? `কুপন "${appliedDiscount.code}" সফলভাবে প্রয়োগ করা হয়েছে (-${appliedDiscount.percent}%)`
                        : `Coupon "${appliedDiscount.code}" applied (-${appliedDiscount.percent}%)`}
                    </p>
                  )}
                </div>

                {/* Subtotal Calculation */}
                <div className="space-y-1.5 text-xs pt-2">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>{t("subtotal")}</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatPrice(subtotal)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>{t("discount")} ({appliedDiscount.percent}%)</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>{t("delivery_fee")}</span>
                    <span>{isFreeShipping ? <span className="text-emerald-500 font-bold">{t("free")}</span> : formatPrice(60)}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span>{t("total_payable")}</span>
                    <span>{formatPrice(finalTotal + (isFreeShipping ? 0 : 60))}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  id="checkout-drawer-btn"
                  onClick={() => {
                    openCartCheckout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  <span>{t("proceed_to_checkout")}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {language === "bn"
                      ? "১০০% নিরাপদ ও এনক্রিপ্টেড চেকআউট"
                      : "Encrypted & Privacy-Guaranteed Checkout"}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

