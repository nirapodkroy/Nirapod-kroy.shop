import React, { useState } from "react";
import { X, Search, Package, Clock, CheckCircle2, Truck, AlertCircle, Phone, MapPin } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { Order } from "../types";
import { safeGetLocalStorage } from "../utils/storage";

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({ isOpen, onClose }) => {
  const { language, formatPrice } = useLanguage();
  const [searchKey, setSearchKey] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchKey.trim().toLowerCase();
    if (!query) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      // 1. Check local storage orders first
      const savedOrdersRaw = safeGetLocalStorage("auracart_orders");
      let allOrders: Order[] = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : [];

      // 2. Fetch from server API if available
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          if (data.orders && Array.isArray(data.orders)) {
            allOrders = [...data.orders, ...allOrders];
          }
        }
      } catch {}

      // Find match by Order ID, Phone number, or Email
      const match = allOrders.find(
        (o) =>
          o.id.toLowerCase() === query ||
          o.id.toLowerCase().includes(query) ||
          o.customerPhone.includes(query) ||
          o.customerEmail.toLowerCase() === query
      );

      setFoundOrder(match || null);
    } catch {
      setFoundOrder(null);
    } finally {
      setIsSearching(false);
    }
  };

  const steps: { key: Order["status"]; labelBn: string; labelEn: string; icon: any }[] = [
    { key: "Pending", labelBn: "অর্ডার গৃহীত", labelEn: "Order Placed", icon: Clock },
    { key: "Processing", labelBn: "প্যাকেজিং চলছে", labelEn: "Processing", icon: Package },
    { key: "Shipped", labelBn: "ডেলিভারিতে আছে", labelEn: "Out for Delivery", icon: Truck },
    { key: "Delivered", labelBn: "ডেলিভারি সম্পন্ন", labelEn: "Delivered", icon: CheckCircle2 }
  ];

  const getStepIndex = (status: Order["status"]) => {
    switch (status) {
      case "Pending":
        return 0;
      case "Processing":
        return 1;
      case "Shipped":
        return 2;
      case "Delivered":
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = foundOrder ? getStepIndex(foundOrder.status) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                {language === "bn" ? "অর্ডার ট্র্যাক করুন" : "Track Your Order"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {language === "bn" ? "অর্ডার আইডি বা মোবাইল নম্বর দিয়ে খুঁজুন" : "Enter Order ID or mobile number"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Form */}
        <div className="p-6">
          <form onSubmit={handleTrack} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                placeholder={language === "bn" ? "যেমন: NK-1234 বা 017XXXXXXXX" : "e.g. NK-1234 or 017XXXXXXXX"}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchKey.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shrink-0 shadow-sm cursor-pointer"
            >
              {isSearching ? (language === "bn" ? "খোঁজা হচ্ছে..." : "Searching...") : (language === "bn" ? "ট্র্যাক করুন" : "Track")}
            </button>
          </form>

          {/* Results Area */}
          <div className="mt-6">
            {foundOrder ? (
              <div className="space-y-5">
                {/* Order Summary Pill */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      #{foundOrder.id}
                    </span>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5">
                      {foundOrder.customerName}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(foundOrder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-extrabold text-base text-zinc-900 dark:text-white">
                      {formatPrice(foundOrder.totalPrice)}
                    </span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {foundOrder.items.length} {language === "bn" ? "টি পণ্য" : "items"}
                    </p>
                  </div>
                </div>

                {/* Tracking Progress Timeline */}
                <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {language === "bn" ? "ডেলিভারি স্ট্যাটাস" : "Delivery Status"}
                  </h5>

                  <div className="relative flex items-center justify-between">
                    {/* Connecting Line */}
                    <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-zinc-200 dark:bg-zinc-700 -z-0">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                      />
                    </div>

                    {/* Step Nodes */}
                    {steps.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isPassed = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isPassed
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/40"
                                : "bg-white dark:bg-zinc-800 text-zinc-400 border-2 border-zinc-300 dark:border-zinc-700"
                            } ${isCurrent ? "ring-4 ring-emerald-500/30 scale-110" : ""}`}
                          >
                            <StepIcon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-[10px] font-semibold text-center whitespace-nowrap max-w-[70px] ${
                              isPassed ? "text-emerald-700 dark:text-emerald-300 font-bold" : "text-zinc-400"
                            }`}
                          >
                            {language === "bn" ? step.labelBn : step.labelEn}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Address & Helpline */}
                <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{foundOrder.shippingAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{foundOrder.customerPhone}</span>
                  </div>
                </div>
              </div>
            ) : hasSearched && !isSearching ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                  {language === "bn" ? "কোনো অর্ডার পাওয়া যায়নি" : "No Order Found"}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                  {language === "bn"
                    ? "আপনার দেওয়া অর্ডার আইডি বা মোবাইল নম্বরটি সঠিক কিনা যাচাই করুন।"
                    : "Please verify your Order ID or phone number and try again."}
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-zinc-400">
                {language === "bn"
                  ? "অর্ডারের সময় প্রাপ্ত ৬ ডিজিটের অর্ডার কোড অথবা আপনার দেওয়া মোবাইল নম্বর লিখুন।"
                  : "Enter the order ID from your confirmation receipt or your mobile number."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
