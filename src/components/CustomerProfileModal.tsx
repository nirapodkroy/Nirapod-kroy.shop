import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Order } from "../types";
import { X, User, Package, Calendar, Clock, CheckCircle2, ChevronRight, Truck, AlertCircle, Phone, MapPin, Save, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { subscribeToUserOrders } from "../lib/firestorePersistence";

export const CustomerProfileModal: React.FC = () => {
  const { currentUser, isProfileModalOpen, setIsProfileModalOpen, logoutCustomer, updateUserProfile } = useAuth();
  const { language, t, formatPrice } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

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
                map.set(o.id, o as Order);
              }
              for (const o of prev) {
                if (!map.has(o.id)) map.set(o.id, o);
              }
              return Array.from(map.values());
            });
          }
        });
      } catch (err) {
        console.warn("Firestore order subscription error:", err);
      }
    }

    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const res = await fetch(`/api/orders/customer/${encodeURIComponent(currentUser.email)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.orders)) {
            setOrders((prev) => {
              const map = new Map<string, Order>();
              for (const o of data.orders) {
                map.set(o.id, o);
              }
              for (const o of prev) {
                if (!map.has(o.id)) map.set(o.id, o);
              }
              return Array.from(map.values());
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
        return "ডেলিভারড";
      case "Shipped":
        return "শিপড (ডেলিভারিতে আছে)";
      case "Processing":
        return "প্রসেসিং";
      case "Cancelled":
        return "বাতিল";
      default:
        return "পেন্ডিং (অপেক্ষারত)";
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[92dvh]"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-emerald-500/30 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-display">
                    {currentUser.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    Firestore Synced
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={logoutCustomer}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                {t("logout")}
              </button>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
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
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {isEditingProfile
                    ? (language === "bn" ? "বাতিল" : "Cancel")
                    : (language === "bn" ? "তথ্য পরিবর্তন করুন" : "Edit Info")}
                </button>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
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
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
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
                    <span>{isSavingProfile ? (language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (language === "bn" ? "Firestore-এ সংরক্ষণ করুন" : "Save to Cloud")}</span>
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
                      <span>{currentUser.phone || (language === "bn" ? "যুক্ত করা হয়নি" : "Not set")}</span>
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

            {/* Orders Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    {t("my_orders")} ({orders.length})
                  </h3>
                </div>
                <span className="text-xs text-zinc-400">{language === "bn" ? "রিয়েলটাইম সিঙ্ক" : "Synced Real-Time"}</span>
              </div>

              {isLoadingOrders ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <Package className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {language === "bn" ? "এখনও কোনো অর্ডার করেননি" : "No orders placed yet"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {language === "bn"
                      ? "আপনার করা অর্ডারসমূহ এবং ডেলিভারি স্ট্যাটাস এখানে দেখতে পাবেন।"
                      : "Your placed orders and delivery timeline will show up right here."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, idx) => (
                    <div
                      key={`${order.id}-${idx}`}
                      className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-zinc-900 dark:text-white">
                            #{order.id}
                          </span>
                          <span className="text-zinc-400 text-xs">•</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(order.createdAt).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-2 pt-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-zinc-700 dark:text-zinc-300 truncate">
                                {item.title} <strong className="text-zinc-500">x{item.quantity}</strong>
                              </span>
                            </div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {language === "bn" ? "পেমেন্ট পদ্ধতি:" : "Payment:"}{" "}
                          <strong className="text-zinc-700 dark:text-zinc-300">{order.paymentMethod}</strong>
                        </span>
                        <div className="text-right">
                          <span className="text-zinc-400 text-[11px] mr-1">{language === "bn" ? "মোট:" : "Total:"}</span>
                          <span className="font-bold text-sm text-zinc-900 dark:text-white font-display">
                            {formatPrice(order.totalPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

