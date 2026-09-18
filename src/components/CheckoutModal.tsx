import React, { useState, useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { handleLocalApi } from "../lib/mockApi";
import { getProductImagesWithCodes } from "../utils/productCodeHelper";
import { MobileBankingGateway, MobileBankingProvider } from "./MobileBankingGateway";
import {
  X,
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight,
  Images,
  Check,
  Plus,
  Minus,
  ShoppingBag,
  MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const {
    items,
    directCheckoutItem,
    setDirectCheckoutItem,
    updateDirectItemCode,
    updateDirectItemQuantity,
    updateItemCode,
    updateQuantity,
    clearCart
  } = useCart();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const { language, t, formatPrice } = useLanguage();

  const [customerName, setCustomerName] = useState(currentUser?.name || "");
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || "");
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || "");
  const [city, setCity] = useState("Dhaka");
  const [shippingAddress, setShippingAddress] = useState(currentUser?.address || "");
  const [deliveryArea, setDeliveryArea] = useState<"inside_dhaka" | "outside_dhaka">("inside_dhaka");
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash on Delivery" | "bKash / Mobile Wallet"
  >("Cash on Delivery");
  const [mobileProvider, setMobileProvider] = useState<MobileBankingProvider>("bKash");
  const [senderPhone, setSenderPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [orderPreviewId, setOrderPreviewId] = useState(() => "NK-" + Math.floor(100000 + Math.random() * 900000));
  const [orderNotes, setOrderNotes] = useState("");

  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);

  // Determine active items being ordered:
  // If user clicked direct "Buy Now" on a product, directCheckoutItem is used.
  // If user came from Cart, items from cart are used.
  const isDirectBuy = !!directCheckoutItem;
  const activeItems = isDirectBuy ? (directCheckoutItem ? [directCheckoutItem] : []) : items;

  // Subtotal of products being purchased
  const itemsSubtotal = isDirectBuy
    ? (directCheckoutItem ? directCheckoutItem.product.price * directCheckoutItem.quantity : 0)
    : items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Delivery charge: Inside Dhaka = 60 Tk, Outside Dhaka = 100 Tk
  const deliveryFee = deliveryArea === "inside_dhaka" ? 60 : 100;
  const baseTotal = itemsSubtotal + deliveryFee;

  // 1.2% Payment Gateway surcharge for Mobile Banking (bKash / Nagad / Rocket)
  const gatewayFee = paymentMethod === "bKash / Mobile Wallet" ? Math.round(baseTotal * 0.012) : 0;
  const finalTotal = baseTotal + gatewayFee;

  // Sync if user logs in
  useEffect(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.name);
      if (!customerEmail) setCustomerEmail(currentUser.email);
      if (!customerPhone && currentUser.phone) setCustomerPhone(currentUser.phone);
      if (!shippingAddress && currentUser.address) setShippingAddress(currentUser.address);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isDirectBuy) {
      setDirectCheckoutItem(null);
    }
    setConfirmedOrder(null);
    setSenderPhone("");
    setTransactionId("");
    setOrderPreviewId("NK-" + Math.floor(100000 + Math.random() * 900000));
    onClose();
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict double-submit guard
    if (isSubmitting || isSubmittingRef.current) {
      return;
    }

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !shippingAddress.trim() || !city.trim()) {
      addToast(
        language === "bn"
          ? "অনুগ্রহ করে নাম, মোবাইল নম্বর, শহর ও পূর্ণ ঠিকানা পূরণ করুন।"
          : "Please fill in all required delivery fields (Name, Phone, City, Address).",
        "warning"
      );
      return;
    }

    if (activeItems.length === 0) {
      addToast(language === "bn" ? "অর্ডারের জন্য কোনো প্রোডাক্ট পাওয়া যায়নি।" : "No items selected for order.", "error");
      return;
    }

    // Require sender phone number and transaction ID when bKash / Mobile Banking is selected
    if (paymentMethod === "bKash / Mobile Wallet") {
      if (!senderPhone.trim()) {
        addToast(
          language === "bn"
            ? `অনুগ্রহ করে যে নম্বর থেকে টাকা পাঠিয়েছেন (Sender Number) তা লিখুন।`
            : `Please enter the mobile number you sent money from.`,
          "warning"
        );
        return;
      }
      if (!transactionId.trim()) {
        addToast(
          language === "bn"
            ? `অনুগ্রহ করে আপনার ${mobileProvider} ট্রানজেকশন আইডি (TrxID) লিখুন।`
            : `Please enter your ${mobileProvider} Transaction ID (TrxID).`,
          "warning"
        );
        return;
      }
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const clientOrderId = orderPreviewId;
      const trackingNumber = "TRK-" + clientOrderId.replace(/\D/g, "");

      const orderedItemList = activeItems.map(item => ({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.selectedImageUrl || item.product.imageUrl,
        selectedImageCode: item.selectedImageCode,
        productCode: item.productCode || item.product.productCode
      }));

      const productCodesText = orderedItemList.map(i => {
        const parts: string[] = [];
        if (i.productCode) parts.push(i.productCode);
        if (i.selectedImageCode) parts.push(`ছবি কোড: ${i.selectedImageCode}`);
        return parts.length > 0 ? parts.join(" / ") : i.title;
      }).join(", ");

      const fullShippingAddress = `${shippingAddress.trim()}, ${city.trim()} (${deliveryArea === "inside_dhaka" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে"})`;

      const finalPaymentMethod = paymentMethod === "Cash on Delivery"
        ? "Cash on Delivery"
        : `${mobileProvider} (TrxID: ${transactionId.trim().toUpperCase()})`;

      const fullOrderForSync = {
        id: clientOrderId,
        trackingNumber,
        productCodes: productCodesText,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim(),
        shippingAddress: fullShippingAddress,
        items: orderedItemList,
        totalPrice: finalTotal,
        shippingFee: deliveryFee,
        paymentGatewayFee: gatewayFee,
        paymentProvider: paymentMethod === "bKash / Mobile Wallet" ? mobileProvider : undefined,
        senderPhoneNumber: senderPhone.trim() || undefined,
        transactionId: transactionId.trim().toUpperCase() || undefined,
        deliveryArea: deliveryArea === "inside_dhaka" ? "ঢাকার ভেতরে (৳৬০)" : "ঢাকার বাইরে (৳১০০)",
        paymentMethod: finalPaymentMethod,
        status: "Pending" as const,
        createdAt: new Date().toISOString(),
        syncedToGoogleSheet: false,
        notes: orderNotes.trim() || undefined
      };

      const payload = {
        orderId: clientOrderId,
        trackingNumber,
        productCodes: productCodesText,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim(),
        shippingAddress: fullShippingAddress,
        items: orderedItemList,
        totalPrice: finalTotal,
        shippingFee: deliveryFee,
        paymentGatewayFee: gatewayFee,
        paymentProvider: paymentMethod === "bKash / Mobile Wallet" ? mobileProvider : undefined,
        senderPhoneNumber: senderPhone.trim() || undefined,
        transactionId: transactionId.trim().toUpperCase() || undefined,
        deliveryArea: deliveryArea === "inside_dhaka" ? "ঢাকার ভেতরে (Inside Dhaka - ৳৬০)" : "ঢাকার বাইরে (Outside Dhaka - ৳১০০)",
        paymentMethod: finalPaymentMethod,
        notes: orderNotes.trim() || undefined
      };

      let orderResult: any = null;
      let orderSuccess = false;

      // 1. Primary: Submit to server API (which dispatches single authoritative sync)
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            orderResult = await res.json();
            if (orderResult?.order || orderResult?.success) {
              orderSuccess = true;
            }
          }
        }
      } catch (networkErr) {
        console.warn("[Order] Primary API dispatch failed, falling back to local handler:", networkErr);
      }

      // 2. Secondary fallback (Static hosting without Node.js backend):
      if (!orderSuccess) {
        try {
          const localRes = await handleLocalApi("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          orderResult = await localRes.json();
          if (orderResult?.order || orderResult?.success) {
            orderSuccess = true;
          }
        } catch (localErr) {
          console.error("[Order] Local handler failed:", localErr);
        }
      }

      if (!orderSuccess || (!orderResult?.order && !orderResult?.success)) {
        addToast(
          orderResult?.error || (language === "bn" ? "অর্ডার সম্পন্ন হতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" : "Failed to place order."),
          "error"
        );
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // Order placed successfully! Exactly ONCE.
      const finalConfirmedOrder = {
        ...fullOrderForSync,
        ...(orderResult.order || {}),
        id: orderResult.order?.id || clientOrderId,
        items: (orderResult.order?.items && orderResult.order.items.length > 0) ? orderResult.order.items : orderedItemList
      };

      setConfirmedOrder(finalConfirmedOrder);
      if (isDirectBuy) {
        setDirectCheckoutItem(null);
      } else {
        clearCart();
      }

      addToast(
        language === "bn"
          ? `অর্ডার সফলভাবে সম্পন্ন হয়েছে! আপনার অর্ডার আইডি: ${finalConfirmedOrder.id}`
          : "Order Placed Successfully! Synced to Google Sheets.",
        "success"
      );
      onOrderSuccess();
    } catch (err: any) {
      console.error("[Order] Unexpected checkout error:", err);
      addToast(language === "bn" ? "অর্ডারে অনাকাঙ্ক্ষিত সমস্যা হয়েছে।" : "Unexpected error during checkout.", "error");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 my-auto max-h-[92dvh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:white transition-colors cursor-pointer"
            aria-label="Close checkout modal"
          >
            <X className="w-5 h-5" />
          </button>

          {confirmedOrder ? (
            /* Order Placed Success Confirmation Screen */
            <div className="p-6 sm:p-8 text-center space-y-6 overflow-y-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                  {language === "bn" ? "অর্ডার নিশ্চিত ও নিবন্ধিত হয়েছে" : "Order Confirmed & Synced"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 font-display">
                  {language === "bn" ? `ধন্যবাদ, ${confirmedOrder.customerName}!` : `Thank You, ${confirmedOrder.customerName}!`}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto">
                  {language === "bn" ? (
                    <>
                      আপনার অর্ডার নম্বর <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">#{confirmedOrder.id}</span> গৃহীত হয়েছে। আমাদের টিম দ্রুত আপনার সাথে যোগাযোগ করবে।
                    </>
                  ) : (
                    <>
                      Your order <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">#{confirmedOrder.id}</span> has been confirmed. A confirmation summary has been processed and logged to our private Google Sheet.
                    </>
                  )}
                </p>
              </div>

              {/* Order Summary Card in Confirmation */}
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-4 text-left max-w-md mx-auto space-y-3">
                <div className="flex items-center justify-between text-xs font-bold border-b border-zinc-200/60 dark:border-zinc-700/60 pb-2">
                  <span className="text-zinc-600 dark:text-zinc-400">{language === "bn" ? "ডেলিভারি এরিয়া:" : "Delivery Zone:"}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{confirmedOrder.deliveryArea || (deliveryArea === "inside_dhaka" ? "ঢাকার ভেতরে" : "ঢাকার বাইরে")}</span>
                </div>
                
                {confirmedOrder.productCodes && (
                  <div className="flex items-center justify-between text-xs font-bold border-b border-zinc-200/60 dark:border-zinc-700/60 pb-2">
                    <span className="text-zinc-600 dark:text-zinc-400">{language === "bn" ? "প্রোডাক্ট/ছবি কোড:" : "Product / Picture Code:"}</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">{confirmedOrder.productCodes}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-bold border-b border-zinc-200/60 dark:border-zinc-700/60 pb-2">
                  <span className="text-zinc-600 dark:text-zinc-400">{language === "bn" ? "পেমেন্ট মাধ্যম:" : "Payment Method:"}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {confirmedOrder.paymentMethod || (paymentMethod === "Cash on Delivery" ? "Cash on Delivery" : `${mobileProvider} Mobile Wallet`)}
                  </span>
                </div>

                {confirmedOrder.senderPhoneNumber && (
                  <div className="flex items-center justify-between text-xs font-bold border-b border-zinc-200/60 dark:border-zinc-700/60 pb-2">
                    <span className="text-zinc-600 dark:text-zinc-400">{language === "bn" ? "প্রেরক নম্বর (Send Money From):" : "Sent Money From:"}</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{confirmedOrder.senderPhoneNumber}</span>
                  </div>
                )}

                {confirmedOrder.transactionId && (
                  <div className="flex items-center justify-between text-xs font-bold border-b border-zinc-200/60 dark:border-zinc-700/60 pb-2 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                    <span className="text-zinc-600 dark:text-zinc-400">{language === "bn" ? "ট্রানজেকশন আইডি (TrxID):" : "Transaction ID:"}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{confirmedOrder.transactionId}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {confirmedOrder.paymentMethod && confirmedOrder.paymentMethod.includes("TrxID")
                      ? (language === "bn" ? "মোবাইল ব্যাংকিং পেমেন্ট ভেরিফিকেশনে রয়েছে" : "Payment Verification in Progress")
                      : (language === "bn" ? "১০০% নিরাপদ ক্যাশ অন ডেলিভারি" : "100% Secure Cash on Delivery")}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {language === "bn"
                    ? "আপনার ঠিকানা, ফোন নম্বর এবং অর্ডার তথ্য সম্পূর্ণ সুরক্ষিত রাখা হয়েছে।"
                    : "Your private address, phone, and payment specifics remain strictly confidential."}
                </p>
                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex justify-between text-sm font-extrabold">
                  <span className="text-zinc-600 dark:text-zinc-300">{language === "bn" ? "সর্বমোট প্রদেয় বিল:" : "Total Payable:"}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(confirmedOrder.totalPrice)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleClose}
                  className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  {language === "bn" ? "আরও কেনাকাটা করুন" : "Continue Shopping"}
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleSubmitOrder} className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Header Title */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 font-display">
                    {language === "bn" ? "অর্ডার সম্পন্ন করুন" : "Complete Your Order"}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {language === "bn"
                      ? "পছন্দের ছবি কোড এবং ডেলিভারি ঠিকানা দিয়ে সরাসরি অর্ডার করুন"
                      : "Select picture code and delivery address to finalize your order"}
                  </p>
                </div>
              </div>

              {/* 1. Products Being Ordered Section (With Image & Picture Code Selector) */}
              <div className="bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      {language === "bn" ? "অর্ডারের প্রোডাক্ট সমূহ" : "Ordered Items"} ({activeItems.length})
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {language === "bn" ? "পণ্য মূল্য:" : "Subtotal:"} {formatPrice(itemsSubtotal)}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-4 divide-y divide-zinc-200/60 dark:divide-zinc-700/60">
                  {activeItems.map((item, itemIdx) => {
                    const productImagesWithCodes = getProductImagesWithCodes(item.product);
                    const currentSelectedCode = item.selectedImageCode || productImagesWithCodes[0]?.code || "P-01";
                    const currentImgUrl = item.selectedImageUrl || item.product.imageUrl;

                    return (
                      <div key={item.product.id + itemIdx} className={itemIdx > 0 ? "pt-4" : ""}>
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Main Image Thumbnail */}
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                            <img
                              src={currentImgUrl}
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                            />
                            {currentSelectedCode && (
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white font-mono text-[9px] font-bold backdrop-blur-xs">
                                {currentSelectedCode}
                              </span>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                              {item.product.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                {formatPrice(item.product.price)}
                              </span>
                              {item.product.productCode && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-600 dark:text-zinc-300">
                                  {item.product.productCode}
                                </span>
                              )}
                            </div>

                            {/* Quantity Control */}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[11px] text-zinc-500 font-medium">
                                {language === "bn" ? "পরিমাণ:" : "Qty:"}
                              </span>
                              <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-800">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isDirectBuy) {
                                      updateDirectItemQuantity(-1);
                                    } else {
                                      updateQuantity(item.product.id, -1);
                                    }
                                  }}
                                  className="px-2 py-1 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-3 py-0.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isDirectBuy) {
                                      updateDirectItemQuantity(1);
                                    } else {
                                      updateQuantity(item.product.id, 1);
                                    }
                                  }}
                                  className="px-2 py-1 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-auto">
                                = {formatPrice(item.product.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Picture Code Selection for this product */}
                        {productImagesWithCodes.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-zinc-200/50 dark:border-zinc-700/50">
                            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                              <span className="flex items-center gap-1.5">
                                <Images className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                  {language === "bn"
                                    ? "পছন্দের ছবি / কালার কোড বেছে নিন:"
                                    : "Select Picture / Color Code:"}
                                </span>
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-extrabold border border-emerald-500/20">
                                {language === "bn" ? `নির্বাচিত: ${currentSelectedCode}` : `Selected: ${currentSelectedCode}`}
                              </span>
                            </div>

                            {/* Picture Chips */}
                            <div className="flex flex-wrap gap-2">
                              {productImagesWithCodes.map((imgItem) => {
                                const isSelected = currentSelectedCode === imgItem.code;
                                return (
                                  <button
                                    key={imgItem.code + imgItem.index}
                                    type="button"
                                    onClick={() => {
                                      if (isDirectBuy) {
                                        updateDirectItemCode(imgItem.code, imgItem.url);
                                      } else {
                                        updateItemCode(item.product.id, imgItem.code, imgItem.url);
                                      }
                                    }}
                                    className={`flex items-center gap-1.5 p-1 sm:p-1.5 pr-2 sm:pr-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                                      isSelected
                                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/30 font-bold shadow-xs scale-102"
                                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50"
                                    }`}
                                  >
                                    <img
                                      src={imgItem.url}
                                      alt={imgItem.code}
                                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                                    />
                                    <span className="font-mono text-[11px] font-bold">{imgItem.code}</span>
                                    {isSelected && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-0.5" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Delivery Area Selection (Inside Dhaka 60 Tk vs Outside Dhaka 100 Tk) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{language === "bn" ? "ডেলিভারি এরিয়া নির্বাচন করুন" : "Select Delivery Area"} <span className="text-rose-500">*</span></span>
                  </label>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    {language === "bn" ? "চার্জ স্বয়ংক্রিয়ভাবে মোট বিলে যুক্ত হবে" : "Charge applied automatically"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Inside Dhaka (60 Tk) */}
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryArea("inside_dhaka");
                      setCity("Dhaka");
                    }}
                    className={`relative flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      deliveryArea === "inside_dhaka"
                        ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/30 shadow-xs"
                        : "border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        deliveryArea === "inside_dhaka" ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-400"
                      }`}>
                        {deliveryArea === "inside_dhaka" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold block">
                          🚚 {language === "bn" ? "ঢাকার ভেতরে" : "Inside Dhaka"}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {language === "bn" ? "হোম ডেলিভারি (২৪-৪৮ ঘণ্টা)" : "Home Delivery (24-48 hrs)"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-extrabold text-xs shadow-xs">
                        ৳৬০
                      </span>
                    </div>
                  </button>

                  {/* Outside Dhaka (100 Tk) */}
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryArea("outside_dhaka");
                      if (city.toLowerCase() === "dhaka" || city === "ঢাকা") {
                        setCity("");
                      }
                    }}
                    className={`relative flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      deliveryArea === "outside_dhaka"
                        ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/30 shadow-xs"
                        : "border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        deliveryArea === "outside_dhaka" ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-400"
                      }`}>
                        {deliveryArea === "outside_dhaka" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold block">
                          🚛 {language === "bn" ? "ঢাকার বাইরে" : "Outside Dhaka"}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {language === "bn" ? "সারা বাংলাদেশ কুরিয়ার (২-৪ দিন)" : "All BD Courier (2-4 days)"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-600 text-white font-extrabold text-xs shadow-xs">
                        ৳১০০
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Customer & Address Form */}
              <div className="space-y-4">
                {/* Full Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("full_name")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={language === "bn" ? "যেমন: মোহাম্মদ তারিক" : "e.g. Tariq Prodhan"}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("email_address")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g. name@example.com"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Phone & City / District */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("mobile_number")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      {language === "bn" ? "শহর / জেলা" : "City / District"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCity(val);
                        if (val.toLowerCase().includes("dhaka") || val.includes("ঢাকা")) {
                          setDeliveryArea("inside_dhaka");
                        }
                      }}
                      placeholder={
                        deliveryArea === "inside_dhaka"
                          ? (language === "bn" ? "ঢাকা (যেমন: ধানমন্ডি, মিরপুর, গুলশান)" : "Dhaka (e.g. Dhanmondi, Mirpur)")
                          : (language === "bn" ? "জেলার নাম (যেমন: চট্টগ্রাম, রাজশাহী, সিলেট, খুলনা)" : "District name (e.g. Chittagong, Rajshahi)")
                      }
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Full Street Address */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t("full_address")} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder={
                      language === "bn"
                        ? (deliveryArea === "inside_dhaka"
                            ? "বাসা/হোল্ডিং নম্বর, রোড নম্বর, এলাকা ও থানা (ঢাকার ভেতরে)"
                            : "গ্রাম/রোড, পোস্ট অফিস, থানা ও সম্পূর্ণ ঠিকানা (ঢাকার বাইরে)")
                        : "House/Apartment #, Road #, Area, Police Station & Postal Details"
                    }
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* Payment Method Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {t("payment_method")}
                    </label>
                    {paymentMethod === "bKash / Mobile Wallet" && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50">
                        +১.২% ফি প্রযোজ্য
                      </span>
                    )}
                  </div>
                  
                  {/* Two active payment methods (Credit / Debit card temporarily disabled as requested) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        id: "Cash on Delivery",
                        label: language === "bn" ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery",
                        subtitle: language === "bn" ? "পণ্য হাতে পেয়ে টাকা দিন" : "Pay cash upon arrival",
                        icon: Banknote
                      },
                      {
                        id: "bKash / Mobile Wallet",
                        label: language === "bn" ? "বিকাশ / নগদ / রকেট" : "bKash / Nagad / Rocket",
                        subtitle: language === "bn" ? "মোবাইল ব্যাংকিং (১.২% ফি)" : "Instant Mobile Banking (+1.2%)",
                        icon: Smartphone
                      }
                      /* Credit / Debit Card option can be enabled here when ready in future */
                    ].map(method => {
                      const Icon = method.icon;
                      const isSelected = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/20"
                              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${
                            isSelected ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs sm:text-sm block text-zinc-900 dark:text-white leading-tight">
                              {method.label}
                            </span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                              {method.subtitle}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* If Mobile Banking is selected, show the exact screenshot replication gateway */}
                  {paymentMethod === "bKash / Mobile Wallet" && (
                    <div className="mt-3">
                      <MobileBankingGateway
                        selectedProvider={mobileProvider}
                        onSelectProvider={setMobileProvider}
                        senderPhone={senderPhone}
                        onChangeSenderPhone={setSenderPhone}
                        transactionId={transactionId}
                        onChangeTransactionId={setTransactionId}
                        finalTotal={finalTotal}
                        orderPreviewId={orderPreviewId}
                        feePercent={1.2}
                      />
                    </div>
                  )}
                </div>

                {/* Order Notes (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === "bn" ? "অর্ডার নোট বা বিশেষ নির্দেশ (ঐচ্ছিক)" : "Order Notes (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder={language === "bn" ? "যেমন: কল দিয়ে ডেলিভারি করবেন" : "e.g. Please call before delivery"}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 4. Order Summary Breakdown & Confirmation Button */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
                {/* Subtotal */}
                <div className="flex justify-between items-center text-xs text-zinc-600 dark:text-zinc-400">
                  <span>{language === "bn" ? "পণ্য মূল্য (সাবটোটাল)" : "Products Subtotal"}</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(itemsSubtotal)}</span>
                </div>

                {/* Delivery Charge */}
                <div className="flex justify-between items-center text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span>{language === "bn" ? "ডেলিভারি চার্জ" : "Delivery Charge"}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                      {deliveryArea === "inside_dhaka" ? (language === "bn" ? "ঢাকার ভেতরে" : "Inside Dhaka") : (language === "bn" ? "ঢাকার বাইরে" : "Outside Dhaka")}
                    </span>
                  </span>
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                    ৳{deliveryFee}
                  </span>
                </div>

                {/* Mobile Banking Surcharge (1.2%) */}
                {paymentMethod === "bKash / Mobile Wallet" && (
                  <div className="flex justify-between items-center text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50/60 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200/50 dark:border-rose-900/40">
                    <span className="flex items-center gap-1.5">
                      <span>{language === "bn" ? `মোবাইল ব্যাংকিং ফি (১.২% - ${mobileProvider})` : `Payment Gateway Fee (1.2% - ${mobileProvider})`}</span>
                    </span>
                    <span className="font-black">+৳{gatewayFee}</span>
                  </div>
                )}

                {/* Total Payable */}
                <div className="flex justify-between items-center text-base sm:text-lg font-black text-zinc-900 dark:text-white pt-2 border-t border-zinc-200/80 dark:border-zinc-800">
                  <span>{t("total_payable")}</span>
                  <span className="text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400 font-display">
                    {formatPrice(finalTotal)}
                  </span>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full mt-3 flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-extrabold text-sm sm:text-base shadow-lg transition-all active:scale-[0.98] cursor-pointer ${
                    paymentMethod === "bKash / Mobile Wallet"
                      ? "bg-[#0052cc] hover:bg-[#0047b3] text-white shadow-blue-600/25"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25"
                  } disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {language === "bn" ? "অর্ডার যাচাই ও নিশ্চিত করা হচ্ছে..." : "Verifying & Syncing Order..."}
                    </span>
                  ) : (
                    <>
                      <span>
                        {paymentMethod === "Cash on Delivery"
                          ? (language === "bn" ? "অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)" : "Confirm Order (Cash on Delivery)")
                          : (language === "bn" ? `অর্ডার ভেরিফাই ও কনফার্ম করুন (${mobileProvider})` : `Verify & Confirm Order (${mobileProvider})`)}
                      </span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {language === "bn"
                      ? "১০০% নিরাপদ ডেলিভারি ও দ্রুত পণ্য প্রাপ্তির নিশ্চয়তা"
                      : "100% Genuine & Safe Store • Fast Nationwide Delivery"}
                  </span>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
