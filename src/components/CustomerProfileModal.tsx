import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { Order, OrderItem } from "../types";
import {
  X,
  User,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  Truck,
  AlertCircle,
  Phone,
  MapPin,
  Save,
  ShieldCheck,
  RotateCcw,
  Search,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { subscribeToUserOrders } from "../lib/firestorePersistence";

interface CustomerProfileModalProps {
  onOpenTrackOrder?: (query?: string) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  onOpenTrackOrder
}) => {
  const { currentUser, isProfileModalOpen, setIsProfileModalOpen, logoutCustomer, updateUserProfile } = useAuth();
  const { addItem, setIsCartOpen } = useCart();
  const { language, t, formatPrice } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "delivered" | "cancelled">("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Editable Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditPhone(currentUser.phone || "");
      setEditAddress(currentUser.address || "");
    }
  }, [currentUser]);

  // Load and Subscribe to Orders (Dual-channel: Firestore Realtime + API Sync)
  useEffect(() => {
    if (!isProfileModalOpen || !currentUser) return;

    let unsubFirestore = () => {};
    if (currentUser.id) {
      try {
        unsubFirestore = subscribeToUserOrders(currentUser.id, (firestoreOrders) => {
          if (firestoreOrders && firestoreOrders.length > 0) {
            setOrders((prev) => {
              const map = new Map<string, Order>();
              for (const o of firestoreOrders) {
                map.set(o.id, {
                  ...o,
                  items: Array.isArray(o.items) ? o.items : []
                } as Order);
              }
              for (const o of prev) {
                if (!map.has(o.id)) map.set(o.id, o);
              }
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
          }
        });
      } catch (err) {
        console.warn("Firestore order subscription warning:", err);
      }
    }

    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const queryParams = new URLSearchParams();
        if (currentUser.phone) {
          queryParams.set("phone", currentUser.phone);
        }
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
        const res = await fetch(`/api/orders/customer/${encodeURIComponent(currentUser.email)}${qs}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.orders)) {
            setOrders((prev) => {
              const map = new Map<string, Order>();
              for (const o of data.orders) {
                map.set(o.id, {
                  ...o,
                  items: Array.isArray(o.items) ? o.items : []
                });
              }
              for (const o of prev) {
                if (!map.has(o.id)) map.set(o.id, o);
              }
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
          }
        }
      } catch (err) {
        console.error("Failed to load customer orders:", err);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();

    return () => {
      unsubFirestore();
    };
  }, [isProfileModalOpen, currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    await updateUserProfile({
      phone: editPhone.trim(),
      address: editAddress.trim()
    });
    setIsSavingProfile(false);
    setIsEditingProfile(false);
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Re-order: Adds ordered items to cart and opens slide-over drawer
  const handleReorder = (order: Order) => {
    if (!order.items || order.items.length === 0) return;
    for (const item of order.items) {
      addItem({
        id: item.productId || item.id,
        title: item.title,
        price: item.price,
        imageUrl: item.imageUrl || "/images/products/prod-shirt-0.jpg",
        category: "All",
        description: item.title
      });
    }
    setIsProfileModalOpen(false);
    setIsCartOpen(true);
  };

  // WhatsApp Support Helper with pre-filled Order ID
  const handleWhatsAppHelp = (orderId: string) => {
    const text = encodeURIComponent(
      `Hello Nirapod Kroy Support! আমি আমার অর্ডার #${orderId} সম্পর্কিত সহায়তা চাচ্ছি।`
    );
    window.open(`https://wa.me/8801786681134?text=${text}`, "_blank");
  };

  // Filter orders by active status tab and search term
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (activeTab === "active") {
        const s = (order.status || "Pending").toLowerCase();
        if (s === "delivered" || s === "cancelled") return false;
      } else if (activeTab === "delivered") {
        if ((order.status || "").toLowerCase() !== "delivered") return false;
      } else if (activeTab === "cancelled") {
        if ((order.status || "").toLowerCase() !== "cancelled") return false;
      }

      // Search filter
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        const idMatch = (order.id || "").toLowerCase().includes(q);
        const itemMatch = (order.items || []).some((item) =>
          (item.title || "").toLowerCase().includes(q)
        );
        const phoneMatch = (order.customerPhone || "").includes(q);
        return idMatch || itemMatch || phoneMatch;
      }

      return true;
    });
  }, [orders, activeTab, orderSearchQuery]);

  // Order summary metrics
  const totalSpent = useMemo(() => {
    return orders
      .filter((o) => (o.status || "").toLowerCase() !== "cancelled")
      .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) => {
      const s = (o.status || "").toLowerCase();
      return s !== "delivered" && s !== "cancelled";
    }).length;
  }, [orders]);

  if (!isProfileModalOpen || !currentUser) return null;

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "Shipped":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30";
      case "Processing":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";
      case "Cancelled":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    }
  };

  const getStatusLabel = (status: Order["status"]) => {
    if (language !== "bn") return status;
    switch (status) {
      case "Delivered":
        return "ডেলিভারি সম্পন্ন";
      case "Shipped":
        return "ডেলিভারিতে আছে (In Transit)";
      case "Processing":
        return "প্রস্তুত হচ্ছে (Processing)";
      case "Cancelled":
        return "অর্ডার বাতিল (Cancelled)";
      default:
        return "পেন্ডিং (অপেক্ষারত)";
    }
  };

  const getStatusStepIndex = (status: Order["status"]) => {
    switch (status) {
      case "Cancelled":
        return -1;
      case "Delivered":
        return 3;
      case "Shipped":
        return 2;
      case "Processing":
        return 1;
      default:
        return 0; // Pending
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
          onClick={() => setIsProfileModalOpen(false)}
          className="fixed inset-0 bg-black/65 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[92dvh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-7 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-emerald-500/30 shadow-md shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 font-display">
                    {currentUser.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>সুরক্ষিত</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={logoutCustomer}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                {t("logout")}
              </button>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer active:scale-95"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-7 flex-1 overflow-y-auto space-y-6 -webkit-overflow-scrolling:touch">
            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">
                  {language === "bn" ? "মোট অর্ডার" : "Total Orders"}
                </span>
                <span className="text-base sm:text-lg font-black text-zinc-900 dark:text-white font-display">
                  {orders.length}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                  {language === "bn" ? "চলমান অর্ডার" : "Active Orders"}
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 font-display">
                  {activeOrdersCount}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                  {language === "bn" ? "মোট কেনাকাটা" : "Total Spent"}
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-300 font-display">
                  {formatPrice(totalSpent)}
                </span>
              </div>
            </div>

            {/* User Profile Information (Saved in Firestore) */}
            <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    {language === "bn" ? "প্রোফাইল ও ডেলিভারি তথ্য" : "Profile & Delivery Info"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {isEditingProfile
                    ? (language === "bn" ? "বাতিল" : "Cancel")
                    : (language === "bn" ? "তথ্য পরিবর্তন করুন" : "Edit Info")}
                </button>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                      {language === "bn" ? "মোবাইল নম্বর" : "Phone Number"}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                      {language === "bn" ? "ডেলিভারি ঠিকানা" : "Delivery Address"}
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-zinc-400" />
                      <textarea
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        rows={2}
                        placeholder={language === "bn" ? "বাড়ি নং, রোড নং, এলাকা, থানা, জেলা" : "Full delivery address"}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {isSavingProfile
                        ? (language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...")
                        : (language === "bn" ? "সংরক্ষণ করুন" : "Save Changes")}
                    </span>
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-300">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">
                        {language === "bn" ? "মোবাইল" : "Phone"}
                      </span>
                      <span className="font-semibold">{currentUser.phone || (language === "bn" ? "যুক্ত করা হয়নি" : "Not set")}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-300">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">
                        {language === "bn" ? "ঠিকানা" : "Address"}
                      </span>
                      <span className="line-clamp-2">{currentUser.address || (language === "bn" ? "যুক্ত করা হয়নি" : "Not set")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECURE 'MY ORDERS' SECTION */}
            <div id="customer-orders-section" className="space-y-3.5">
              {/* Section Title & Real-time Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Package className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-display">
                    {t("my_orders")} ({orders.length})
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{language === "bn" ? "লাইভ ট্র্যাকিং সক্রিয়" : "Live Sync"}</span>
                  </span>
                </div>
              </div>

              {/* Order Filter Tabs & Search */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-xs font-semibold overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === "all"
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {language === "bn" ? "সকল অর্ডার" : "All"} ({orders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("active")}
                    className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === "active"
                        ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {language === "bn" ? "চলমান" : "Active"} ({activeOrdersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("delivered")}
                    className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === "delivered"
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {language === "bn" ? "সম্পন্ন" : "Delivered"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("cancelled")}
                    className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === "cancelled"
                        ? "bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-xs font-bold"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {language === "bn" ? "বাতিল" : "Cancelled"}
                  </button>
                </div>

                {/* Quick Search inside Orders */}
                {orders.length > 2 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder={language === "bn" ? "অর্ডার আইডি বা পণ্য নাম দিয়ে খুঁজুন..." : "Filter by Order ID or item..."}
                      className="w-full pl-8.5 pr-8 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {orderSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setOrderSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Orders List Display */}
              {isLoadingOrders ? (
                <div className="space-y-3 pt-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/40 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-200/60 dark:bg-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
                    <Package className="w-6 h-6 stroke-1.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      {orderSearchQuery
                        ? (language === "bn" ? "কোনো অর্ডার পাওয়া যায়নি" : "No matching orders found")
                        : (language === "bn" ? "এখনও কোনো অর্ডার করেননি" : "No orders placed yet")}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                      {orderSearchQuery
                        ? (language === "bn" ? "ভিন্ন কিওয়ার্ড দিয়ে আবার চেষ্টা করুন।" : "Try another search keyword.")
                        : (language === "bn"
                            ? "আপনার সকল কেনাকাটার ইতিহাস ও লাইভ ট্র্যাকিং টাইমলাইন এখানে প্রদর্শিত হবে।"
                            : "Your order history and delivery timelines will appear right here.")}
                    </p>
                  </div>
                  {!orderSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setIsProfileModalOpen(false)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{language === "bn" ? "পণ্য ব্রাউজ করুন" : "Start Shopping"}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {filteredOrders.map((order, orderIdx) => {
                    const stepIdx = getStatusStepIndex(order.status);
                    const isCancelled = (order.status || "").toLowerCase() === "cancelled";
                    const isDelivered = (order.status || "").toLowerCase() === "delivered";

                    return (
                      <div
                        key={`${order.id}-${orderIdx}`}
                        className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 shadow-xs hover:shadow-md transition-all overflow-hidden"
                      >
                        {/* Order Card Top Bar */}
                        <div className="p-4 sm:p-4.5 bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs sm:text-sm text-zinc-900 dark:text-white">
                              #{order.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyOrderId(order.id)}
                              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer active:scale-90"
                              title={language === "bn" ? "আইডি কপি করুন" : "Copy Order ID"}
                            >
                              {copiedOrderId === order.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {new Date(order.createdAt).toLocaleDateString(
                                language === "bn" ? "bn-BD" : "en-US",
                                { month: "short", day: "numeric", year: "numeric" }
                              )}
                            </span>
                          </div>

                          {/* Current Status Pill */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {isDelivered ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : isCancelled ? (
                              <AlertCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Truck className="w-3.5 h-3.5" />
                            )}
                            <span>{getStatusLabel(order.status)}</span>
                          </span>
                        </div>

                        {/* Visual Progress Stepper (Only for active / non-cancelled orders) */}
                        {!isCancelled && (
                          <div className="px-4 py-3 bg-zinc-50/40 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800/80">
                            <div className="grid grid-cols-4 gap-1 text-center relative">
                              {/* Step 1: Placed */}
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-colors ${
                                    stepIdx >= 0
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                                  }`}
                                >
                                  {stepIdx > 0 ? <Check className="w-3 h-3" /> : "1"}
                                </div>
                                <span className={`text-[10px] ${stepIdx >= 0 ? "font-bold text-zinc-800 dark:text-zinc-200" : "text-zinc-400"}`}>
                                  {language === "bn" ? "অর্ডার গৃহীত" : "Placed"}
                                </span>
                              </div>

                              {/* Step 2: Processing */}
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-colors ${
                                    stepIdx >= 1
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                                  }`}
                                >
                                  {stepIdx > 1 ? <Check className="w-3 h-3" /> : "2"}
                                </div>
                                <span className={`text-[10px] ${stepIdx >= 1 ? "font-bold text-zinc-800 dark:text-zinc-200" : "text-zinc-400"}`}>
                                  {language === "bn" ? "প্রসেসিং" : "Processing"}
                                </span>
                              </div>

                              {/* Step 3: Shipped */}
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-colors ${
                                    stepIdx >= 2
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                                  }`}
                                >
                                  {stepIdx > 2 ? <Check className="w-3 h-3" /> : "3"}
                                </div>
                                <span className={`text-[10px] ${stepIdx >= 2 ? "font-bold text-zinc-800 dark:text-zinc-200" : "text-zinc-400"}`}>
                                  {language === "bn" ? "ডেলিভারিতে" : "Shipped"}
                                </span>
                              </div>

                              {/* Step 4: Delivered */}
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-colors ${
                                    stepIdx >= 3
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                                  }`}
                                >
                                  {stepIdx >= 3 ? <Check className="w-3 h-3" /> : "4"}
                                </div>
                                <span className={`text-[10px] ${stepIdx >= 3 ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                                  {language === "bn" ? "সম্পন্ন" : "Delivered"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Order Line Items List */}
                        <div className="p-4 sm:p-5 space-y-3">
                          {order.items && order.items.length > 0 ? (
                            <div className="space-y-2.5">
                              {order.items.map((item, itemIdx) => (
                                <div key={itemIdx} className="flex items-center gap-3">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title}
                                      className="w-11 h-11 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                                      <Package className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0 text-xs">
                                    <h5 className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                      {item.title}
                                    </h5>
                                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
                                      <span>পরিমাণ: <strong>x{item.quantity}</strong></span>
                                      {item.selectedSize && (
                                        <>
                                          <span>•</span>
                                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            সাইজ: {item.selectedSize}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right text-xs font-bold text-zinc-900 dark:text-white shrink-0">
                                    {formatPrice(item.price * item.quantity)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-500 italic">
                              {language === "bn" ? "পণ্য তালিকা লোড হয়েছে" : "Standard order package"}
                            </p>
                          )}

                          {/* Address & Payment Info */}
                          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div className="text-zinc-600 dark:text-zinc-400">
                              <span className="font-bold text-zinc-400 uppercase text-[9px] block">
                                {language === "bn" ? "ডেলিভারি ঠিকানা" : "Shipping Address"}
                              </span>
                              <span className="line-clamp-2">{order.shippingAddress || "N/A"}</span>
                            </div>
                            <div className="text-zinc-600 dark:text-zinc-400 sm:text-right">
                              <span className="font-bold text-zinc-400 uppercase text-[9px] block">
                                {language === "bn" ? "পেমেন্ট মাধ্যম" : "Payment Method"}
                              </span>
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {order.paymentMethod || "Cash on Delivery"}
                              </span>
                            </div>
                          </div>

                          {/* Tracking Number (if available) */}
                          {order.trackingNumber && (
                            <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                  কুরিয়ার ট্র্যাকিং: <strong className="font-mono">{order.trackingNumber}</strong>
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyOrderId(order.trackingNumber!)}
                                className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                              >
                                কপি করুন
                              </button>
                            </div>
                          )}

                          {/* Order Total & Actions */}
                          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] text-zinc-400 block">
                                {language === "bn" ? "সর্বমোট পরিশোধযোগ্য:" : "Total Payable:"}
                              </span>
                              <span className="text-base sm:text-lg font-black text-zinc-900 dark:text-white font-display">
                                {formatPrice(order.totalPrice)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Live Track Order Button */}
                              {onOpenTrackOrder && !isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsProfileModalOpen(false);
                                    onOpenTrackOrder(order.id);
                                  }}
                                  className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                                  title="Track Order Live"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>{language === "bn" ? "লাইভ ট্র্যাক" : "Track"}</span>
                                </button>
                              )}

                              {/* Re-order Button */}
                              {order.items && order.items.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleReorder(order)}
                                  className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                                  title="Re-order"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>{language === "bn" ? "পুনরায় অর্ডার" : "Re-order"}</span>
                                </button>
                              )}

                              {/* WhatsApp Help Button */}
                              <button
                                type="button"
                                onClick={() => handleWhatsAppHelp(order.id)}
                                className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                                title="WhatsApp Support"
                                aria-label="WhatsApp Support"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
