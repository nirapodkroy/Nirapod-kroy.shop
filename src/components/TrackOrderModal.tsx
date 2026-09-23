import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Phone,
  MapPin,
  Copy,
  Check,
  MessageCircle,
  FileText,
  Boxes,
  Bike,
  Sparkles,
  RefreshCw,
  Mail,
  ShieldCheck,
  Send
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { Order } from "../types";
import { safeGetLocalStorage } from "../utils/storage";
import { matchOrder } from "../utils/orderMatchHelper";
import {
  ORDER_TRACKING_STEPS_DEF,
  getStepIndexFromOrder,
  buildTrackingSteps,
  formatTrackingDate
} from "../utils/orderTracking";

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackingQuery?: string;
  initialOrder?: Order | null;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  initialTrackingQuery,
  initialOrder
}) => {
  const { language, formatPrice } = useLanguage();
  const [searchKey, setSearchKey] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Load initial order or recent local orders for quick-click convenience
  useEffect(() => {
    if (isOpen) {
      if (initialOrder) {
        setFoundOrder(initialOrder);
        setSearchKey(initialOrder.trackingNumber || initialOrder.id);
        setHasSearched(true);
        return;
      }
      if (initialTrackingQuery) {
        setSearchKey(initialTrackingQuery);
        performSearch(initialTrackingQuery);
        return;
      }

      try {
        const localKeys = ["nirapod_orders", "auracart_orders", "orders"];
        let allLocal: Order[] = [];
        for (const k of localKeys) {
          const raw = safeGetLocalStorage(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                allLocal = [...allLocal, ...parsed];
              }
            } catch {}
          }
        }
        if (allLocal.length > 0) {
          const seen = new Set<string>();
          const unique = allLocal.filter((o: Order) => {
            if (!o?.id || seen.has(o.id)) return false;
            seen.add(o.id);
            return true;
          });
          setRecentOrders(unique.slice(0, 5));
          // If search is currently empty, prefill with most recent order
          if (!searchKey && unique[0]?.id) {
            setSearchKey(unique[0].id);
          }
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [isOpen, initialOrder, initialTrackingQuery]);

  if (!isOpen) return null;

  const performSearch = async (queryParam: string) => {
    const query = queryParam.trim();
    if (!query) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      // 1. Primary: Query the dedicated live server tracking API
      try {
        const res = await fetch(`/api/orders/track?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.order) {
            setFoundOrder(data.order);
            setIsSearching(false);
            return;
          }
        }
      } catch {
        // Continue to fallback
      }

      // 2. Secondary fallback: check /api/orders
      let candidateOrders: Order[] = [];
      try {
        const res = await fetch("/api/orders", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.orders && Array.isArray(data.orders)) {
            candidateOrders = data.orders;
          }
        }
      } catch {
        // Continue to fallback
      }

      // 3. GitHub Pages & Static orders.json / tracking.json fallback
      try {
        const gitRepo = (typeof window !== "undefined" ? localStorage.getItem("nirapod_gh_repo") : "") || "nirapodkroy/Nirapod-kroy.shop";
        const cleanRepo = gitRepo.trim().replace(/^https?:\/\//i, "").replace(/^github\.com\//i, "").replace(/\.git$/i, "").replace(/\/+$/, "");
        const gitBranch = (typeof window !== "undefined" ? localStorage.getItem("nirapod_gh_branch") : "") || "main";

        const staticEndpoints = [
          `docs/orders.json?_t=${Date.now()}`,
          `/docs/orders.json?_t=${Date.now()}`,
          `orders.json?_t=${Date.now()}`,
          `/orders.json?_t=${Date.now()}`,
          `docs/tracking.json?_t=${Date.now()}`,
          `/docs/tracking.json?_t=${Date.now()}`,
          `tracking.json?_t=${Date.now()}`,
          `/tracking.json?_t=${Date.now()}`,
          `https://raw.githubusercontent.com/${cleanRepo}/${gitBranch}/docs/orders.json?_t=${Date.now()}`,
          `https://raw.githubusercontent.com/${cleanRepo}/${gitBranch}/orders.json?_t=${Date.now()}`
        ];

        for (const ep of staticEndpoints) {
          try {
            const sRes = await fetch(ep, { cache: "no-store" });
            if (sRes.ok) {
              const listOrMap = await sRes.json();
              if (Array.isArray(listOrMap) && listOrMap.length > 0) {
                candidateOrders = [...candidateOrders, ...listOrMap];
              } else if (listOrMap && typeof listOrMap === "object") {
                const values = Object.values(listOrMap) as Order[];
                if (Array.isArray(values) && values.length > 0) {
                  candidateOrders = [...candidateOrders, ...values];
                }
              }
            }
          } catch {}
        }
      } catch {}

      // 4. Tertiary fallback: localStorage orders
      const localKeys = ["nirapod_orders", "auracart_orders", "orders"];
      for (const k of localKeys) {
        const savedOrdersRaw = safeGetLocalStorage(k);
        if (savedOrdersRaw) {
          try {
            const localParsed = JSON.parse(savedOrdersRaw);
            if (Array.isArray(localParsed)) {
              candidateOrders = [...candidateOrders, ...localParsed];
            }
          } catch {}
        }
      }

      // Match using the robust matcher (order ID, tracking number, phone variants, customer name, email)
      const match = candidateOrders.find((o) => matchOrder(o, query));

      setFoundOrder(match || null);
    } catch {
      setFoundOrder(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchKey);
  };

  const handleCopy = (text: string, type: "id" | "tracking") => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "id") {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        setCopiedTracking(true);
        setTimeout(() => setCopiedTracking(false), 2000);
      }
    }
  };

  const stepIconMap: Record<string, React.ElementType> = {
    confirmed: CheckCircle2,
    processing: Boxes,
    dispatched: Truck,
    out_for_delivery: Bike,
    delivered: ShieldCheck
  };

  const steps = ORDER_TRACKING_STEPS_DEF.map((def) => ({
    ...def,
    icon: stepIconMap[def.id] || CheckCircle2
  }));

  const isCancelled = foundOrder && foundOrder.status?.toLowerCase() === "cancelled";
  const trackingDetails =
    (foundOrder as any)?.orderTrackingDetails ||
    (foundOrder as any)?.trackingDetails ||
    (foundOrder as any)?.orderTrackingDetis ||
    "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে। ডেলিভারি এরিয়া অনুযায়ী পণ্য প্যাকেজিং ও কুরিয়ারে হস্তান্তরের কাজ চলছে।";
  const currentStep = foundOrder ? getStepIndexFromOrder(foundOrder) : 0;
  const trackingNumber = foundOrder?.trackingNumber || (foundOrder?.id ? `TRK-${foundOrder.id.replace(/\D/g, "")}` : "");

  const detailedSteps = foundOrder
    ? buildTrackingSteps(currentStep, foundOrder.trackingSteps, foundOrder.createdAt, trackingDetails)
    : [];

  // Pre-filled WhatsApp message for support
  const supportWhatsappUrl = foundOrder
    ? `https://wa.me/8801786681134?text=${encodeURIComponent(
        `হ্যালো Nirapod Kroy, আমার অর্ডার #${foundOrder.id} (ট্র্যাকিং: ${trackingNumber}) এর বর্তমান অবস্থা সম্পর্কে জানতে চাই।`
      )}`
    : `https://wa.me/8801786681134?text=${encodeURIComponent(
        `হ্যালো Nirapod Kroy, আমার অর্ডারের ট্র্যাকিং তথ্য জানতে যোগাযোগ করছি।`
      )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="relative px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold tracking-wide uppercase">
                  <Sparkles className="w-3 h-3 text-emerald-200" />
                  <span>লাইভ ট্র্যাকিং সিস্টেম</span>
                </div>
                <h2 className="font-bold text-lg sm:text-xl text-white mt-1">
                  {language === "bn" ? "অর্ডার ট্র্যাকিং (Order Tracking)" : "Order Tracking"}
                </h2>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  {language === "bn"
                    ? "আপনার অর্ডারের বর্তমান অবস্থা জানতে Order Tracking অপশনে অর্ডার নম্বর দিয়ে ট্র্যাক করুন।"
                    : "Enter your order number or tracking code to see real-time updates."}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Search Box */}
          <div className="space-y-2.5">
            <form onSubmit={handleTrack} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  placeholder={
                    language === "bn"
                      ? "অর্ডার নম্বর বা ট্র্যাকিং আইডি লিখুন (যেমন: NK-123456 বা TRK-123456)"
                      : "Enter Order ID or Tracking ID (e.g. NK-123456 or TRK-123456)"
                  }
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isSearching || !searchKey.trim()}
                className="px-5 sm:px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-md shadow-emerald-600/20 shrink-0 flex items-center gap-2 cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === "bn" ? "খোঁজা হচ্ছে..." : "Searching..."}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>{language === "bn" ? "ট্র্যাক করুন" : "Track Order"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick-Click Suggestions for recent orders */}
            {recentOrders.length > 0 && !foundOrder && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  {language === "bn" ? "আপনার সাম্প্রতিক অর্ডার:" : "Recent Order:"}
                </span>
                {recentOrders.map((ord, idx) => (
                  <button
                    key={`${ord.id}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSearchKey(ord.id);
                      performSearch(ord.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <span>#{ord.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RESULTS VIEW */}
          {foundOrder ? (
            <div className="space-y-5 animate-fadeIn">
              {/* 1. Order Summary Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-700/60 pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        অর্ডার নম্বর:
                      </span>
                      <span className="font-mono font-extrabold text-base text-zinc-900 dark:text-white">
                        #{foundOrder.id}
                      </span>
                      <button
                        onClick={() => handleCopy(foundOrder.id, "id")}
                        className="p-1 rounded-md text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        title="অর্ডার আইডি কপি করুন"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        ট্র্যাকিং নম্বর:
                      </span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                        {trackingNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(trackingNumber, "tracking")}
                        className="p-1 rounded-md text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        title="ট্র্যাকিং কোড কপি করুন"
                      >
                        {copiedTracking ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">মোট বিল (Total):</span>
                    <span className="font-display font-extrabold text-xl text-emerald-600 dark:text-emerald-400">
                      {formatPrice(foundOrder.totalPrice)}
                    </span>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {new Date(foundOrder.createdAt).toLocaleString("bn-BD", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </p>
                  </div>
                </div>

                {/* Items preview */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {foundOrder.items?.length || 1} টি পণ্য • {foundOrder.paymentMethod || "Cash on Delivery"}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    গ্রাহক: <strong className="text-zinc-800 dark:text-zinc-200">{foundOrder.customerName}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Cancelled Banner (if status is Cancelled) */}
              {isCancelled ? (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-rose-800 dark:text-rose-300">
                      এই অর্ডারটি বাতিল (Cancelled) করা হয়েছে
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                      অর্ডারটি কোনো কারণে বাতিল হয়েছে। বিস্তারিত জানতে অনুগ্রহ করে নিচের কাস্টমার সাপোর্টে যোগাযোগ করুন।
                    </p>
                  </div>
                </div>
              ) : (
                /* 3. The 5 Tracking Steps Progress Timeline */
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-500/20 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      <span>ডেলিভারি অগ্রগতি (5-Step Tracking)</span>
                    </h4>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      ধাপ {currentStep + 1} / ৫ • {steps[currentStep]?.titleBn || ""}
                    </span>
                  </div>

                  {/* Horizontal Bar with 5 Steps */}
                  <div className="relative pt-2 pb-2">
                    {/* Connecting Bar */}
                    <div className="absolute left-6 right-6 top-6 -translate-y-1/2 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                      />
                    </div>

                    {/* Step Nodes */}
                    <div className="relative z-10 grid grid-cols-5 gap-1">
                      {steps.map((step, idx) => {
                        const StepIcon = step.icon;
                        const isPassed = idx < currentStep;
                        const isCurrent = idx === currentStep;

                        return (
                          <div key={step.id} className="flex flex-col items-center text-center">
                            <div
                              className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                                isCurrent
                                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-500/30 scale-110"
                                  : isPassed
                                  ? "bg-emerald-500 text-white shadow-sm"
                                  : "bg-white dark:bg-zinc-800 text-zinc-400 border-2 border-zinc-200 dark:border-zinc-700"
                              }`}
                            >
                              {isPassed || (isCurrent && currentStep === 4) ? (
                                <Check className="w-4 h-4 stroke-[3]" />
                              ) : (
                                <StepIcon className="w-4 h-4" />
                              )}
                            </div>

                            <span
                              className={`text-[10px] sm:text-[11px] font-semibold mt-2 leading-tight ${
                                isCurrent
                                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                  : isPassed
                                  ? "text-zinc-800 dark:text-zinc-200"
                                  : "text-zinc-400"
                              }`}
                            >
                              {step.titleBn}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed Vertical Step Progress List */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <h5 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      ধাপ অনুযায়ী অগ্রগতি বিবরণ (Tracking Step Breakdown):
                    </h5>
                    <div className="space-y-2">
                      {detailedSteps.map((step, idx) => {
                        const StepIcon = stepIconMap[step.id] || CheckCircle2;
                        const isPassed = idx < currentStep;
                        const isCurrent = idx === currentStep;

                        return (
                          <div
                            key={step.id}
                            className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                              isCurrent
                                ? "bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-950/30 dark:border-emerald-500/40 shadow-sm"
                                : isPassed
                                ? "bg-emerald-50/50 border-emerald-200/60 dark:bg-zinc-800/60 dark:border-zinc-700/60"
                                : "bg-zinc-50/40 border-zinc-200/50 dark:bg-zinc-900/40 dark:border-zinc-800/50 opacity-60"
                            }`}
                          >
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                isCurrent
                                  ? "bg-emerald-600 text-white ring-2 ring-emerald-400/40 shadow-sm"
                                  : isPassed
                                  ? "bg-emerald-600 text-white"
                                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
                              }`}
                            >
                              {isPassed || (isCurrent && currentStep === 4) ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                <StepIcon className="w-3.5 h-3.5" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className={`text-xs font-bold ${isCurrent ? "text-emerald-700 dark:text-emerald-300" : isPassed ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}`}>
                                  {language === "bn" ? `ধাপ ${step.stepNumber}: ${step.titleBn}` : `Step ${step.stepNumber}: ${step.titleEn}`}
                                </span>

                                {isCurrent ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/30">
                                    {currentStep === 4 ? (
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    )}
                                    <span>
                                      {currentStep === 4
                                        ? (language === "bn" ? "ডেলিভারি সম্পন্ন" : "Delivered")
                                        : (language === "bn" ? "বর্তমান অবস্থান" : "Current Stage")}
                                    </span>
                                    {step.completedAt && (
                                      <span className="font-normal opacity-90 pl-1 border-l border-white/40">
                                        {formatTrackingDate(step.completedAt, language === "bn" ? "bn" : "en")}
                                      </span>
                                    )}
                                  </span>
                                ) : isPassed ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    <span>সম্পন্ন</span>
                                    {step.completedAt && (
                                      <span className="font-normal opacity-80 pl-1 border-l border-emerald-300 dark:border-emerald-700">
                                        {formatTrackingDate(step.completedAt, language === "bn" ? "bn" : "en")}
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-zinc-400 font-medium">অপেক্ষমাণ</span>
                                )}
                              </div>

                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {language === "bn" ? step.descBn : step.descEn}
                              </p>

                              {isCurrent && trackingDetails && (
                                <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-[11px] text-emerald-900 dark:text-emerald-200 font-medium">
                                  <strong>লাইভ আপডেট:</strong> {trackingDetails}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. ⭐ SPECIAL ROW: "Order Tracking Details" (অর্ডার ট্র্যাকিং বিবরণ) */}
              {/* Satisfies: "ar amr je order sehhet ar traking number ace or pase akta row banaw row nambe order traking detis ami oi traking number a ja likbo order traking like kew serch korle sheet ar data ami ja likbo ta asbe seta coustomer dekte parbe" */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-white dark:from-emerald-950/30 dark:via-zinc-900 dark:to-zinc-900 border-2 border-emerald-500/30 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        অর্ডার ট্র্যাকিং বিবরণ (Order Tracking Details)
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        গুগল শিট ও কুরিয়ার লাইভ আপডেট নোট
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    লাইভ আপডেট
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-emerald-200/60 dark:border-emerald-800/40 text-sm text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                  {trackingDetails}
                </div>
              </div>

              {/* 5. Delivery Address & Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs">
                <div className="space-y-1">
                  <span className="text-zinc-500 dark:text-zinc-400 block font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    ডেলিভারি ঠিকানা:
                  </span>
                  <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                    {foundOrder.shippingAddress || "ঠিকানা অন্তর্ভুক্ত রয়েছে"}
                  </p>
                </div>

                <div className="space-y-1 sm:border-l sm:border-zinc-200 dark:sm:border-zinc-700 sm:pl-3">
                  <span className="text-zinc-500 dark:text-zinc-400 block font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    সম্ভাব্য ডেলিভারি সময়:
                  </span>
                  <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                    {foundOrder.deliveryArea?.includes("বাইরে")
                      ? "ঢাকার বাইরে: ৩-৫ কার্যদিবস"
                      : "ঢাকার ভেতরে: ২-৩ কার্যদিবস"}
                  </p>
                </div>
              </div>

              {/* 6. ⭐ CUSTOMER SUPPORT BANNER */}
              {/* Satisfies: "সমস্যা হলে: কাস্টমার সাপোর্টে যোগাযোগ করুন।" */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/50 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <h4 className="font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                    সমস্যা হলে: কাস্টমার সাপোর্টে যোগাযোগ করুন।
                  </h4>
                </div>

                <p className="text-xs text-amber-800/90 dark:text-amber-300/90">
                  আপনার পার্সেল ডেলিভারি, ট্র্যাকিং বা যেকোনো জিজ্ঞাসায় সরাসরি কাস্টমার কেয়ারে বার্তা পাঠান বা কল করুন:
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* WhatsApp Button */}
                  <a
                    href={supportWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp সাপোর্ট</span>
                  </a>

                  {/* Call Hotline Button */}
                  <a
                    href="tel:+8801786681134"
                    className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>01786-681134</span>
                  </a>

                  {/* Email Button */}
                  <a
                    href="mailto:mtarifprodhan@gmail.com"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 text-xs font-bold transition-colors shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>ইমেইল</span>
                  </a>
                </div>
              </div>
            </div>
          ) : hasSearched && !isSearching ? (
            /* NOT FOUND VIEW */
            <div className="text-center py-8 px-4 rounded-3xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-zinc-900 dark:text-white">
                {language === "bn" ? "কোনো অর্ডার পাওয়া যায়নি" : "No Order Found"}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {language === "bn"
                  ? "আপনার প্রদানকৃত অর্ডার নম্বর বা ট্র্যাকিং আইডিটি সঠিক কিনা যাচাই করুন। অথবা আপনি যে মোবাইল নম্বর দিয়ে অর্ডার করেছিলেন সেটি দিয়ে পুনরায় সার্চ করুন।"
                  : "Please verify your Order ID or mobile number and try again."}
              </p>

              <div className="pt-2">
                <a
                  href={supportWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>কাস্টমার সাপোর্টে কথা বলুন</span>
                </a>
              </div>
            </div>
          ) : (
            /* INITIAL EMPTY STATE */
            <div className="py-8 px-4 text-center space-y-4 rounded-3xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-800">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800/50">
                <Search className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                  আপনার পার্সেলের অবস্থান জানুন
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                  অর্ডারের সময় প্রাপ্ত ৬ ডিজিটের অর্ডার নম্বর (যেমন: #NK-123456) অথবা কুরিয়ার ট্র্যাকিং নম্বর দিয়ে অনুসন্ধান করুন।
                </p>
              </div>

              {/* Direct support link */}
              <div className="pt-2 text-xs text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 max-w-xs mx-auto">
                <span className="block font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  সমস্যা হলে: কাস্টমার সাপোর্টে যোগাযোগ করুন।
                </span>
                <div className="flex items-center justify-center gap-3">
                  <a
                    href="tel:+8801786681134"
                    className="text-emerald-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>01786-681134</span>
                  </a>
                  <span>•</span>
                  <a
                    href="https://wa.me/8801786681134"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
