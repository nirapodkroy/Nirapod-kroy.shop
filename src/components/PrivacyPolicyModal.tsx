import React, { useState, useEffect } from "react";
import {
  X,
  Lock,
  ShieldCheck,
  UserCheck,
  FileText,
  Truck,
  Cookie,
  RefreshCw,
  PhoneCall,
  MessageCircle,
  Mail,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Database
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReturnPolicy?: () => void;
  onOpenDeliveryPolicy?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onOpenReturnPolicy,
  onOpenDeliveryPolicy
}) => {
  const { language } = useLanguage();
  const { addToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "collection" | "usage" | "security" | "contact">("all");

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    try {
      const shareUrl = `${window.location.origin}/privacy-policy`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      addToast(
        language === "bn"
          ? "গোপনীয়তা নীতি লিঙ্ক কপি হয়েছে!"
          : "Privacy Policy link copied to clipboard!",
        "success"
      );
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      addToast(language === "bn" ? "লিঙ্ক কপি করা যায়নি" : "Failed to copy link", "error");
    }
  };

  const openWhatsAppSupport = () => {
    const message = encodeURIComponent(
      "আসসালামু আলাইকুম, আমি Nirapod Kroy-এর গোপনীয়তা নীতি (Privacy Policy) ও তথ্য নিরাপত্তা সংক্রান্ত বিষয়ে জানতে চাই।"
    );
    window.open(`https://wa.me/8801786681134?text=${message}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]">
        {/* Sticky Modal Header */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight truncate">
                  গোপনীয়তা নীতি (Privacy Policy)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-black tracking-wide shadow-xs">
                  নিরাপদ ডাটা
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                Nirapod Kroy — আপনার ব্যক্তিগত তথ্যের সর্বোচ্চ নিরাপত্তা
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Share / Copy URL */}
            <button
              type="button"
              onClick={handleCopyLink}
              title="পলিসি লিঙ্ক কপি করুন (/privacy-policy)"
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400">কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">লিঙ্ক</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto px-5 py-6 space-y-5 text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
          {/* Hero Banner */}
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> ১০০% তথ্য সুরক্ষা প্রতিশ্রুতি
              </span>
              <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                Nirapod Kroy — তথ্যের সুরক্ষা ও গোপনীয়তা
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Nirapod Kroy আপনার ব্যক্তিগত তথ্যের নিরাপত্তা নিশ্চিত করতে সম্পূর্ণভাবে প্রতিশ্রুতিবদ্ধ।
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 bg-white dark:bg-zinc-800 px-3.5 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-700 shadow-xs">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400">এনক্রিপ্টেড</div>
                <div className="text-sm font-black text-zinc-900 dark:text-white">সুরক্ষিত ও নিরাপদ</div>
              </div>
            </div>
          </div>

          {/* Quick Filter Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-zinc-100 dark:border-zinc-800">
            {[
              { id: "all", label: "সকল ধারা" },
              { id: "collection", label: "তথ্য সংগ্রহ ও ব্যবহার" },
              { id: "security", label: "তথ্য নিরাপত্তা ও তৃতীয় পক্ষ" },
              { id: "contact", label: "যোগাযোগ ও সহায়তা" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ১. তথ্য সংগ্রহ */}
          {(activeTab === "all" || activeTab === "collection") && (
            <section className="space-y-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200/70 dark:border-zinc-700/60">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-black">
                  ১
                </span>
                <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4>তথ্য সংগ্রহ (Data Collection)</h4>
              </div>
              <p className="text-xs sm:text-sm pl-8 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                অর্ডার প্রক্রিয়া এবং সঠিক গ্রাহকসেবা প্রদানের লক্ষ্যে আমরা কেবল প্রয়োজনীয় তথ্য সংগ্রহ করি:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pl-8">
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                  <div className="font-bold text-xs text-zinc-900 dark:text-white">গ্রাহকের নাম</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">অর্ডার শনাক্তকরণ ও ঠিকানার জন্য</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                  <div className="font-bold text-xs text-zinc-900 dark:text-white">মোবাইল নম্বর</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">ডেলিভারি কল ও কনফার্মেশনের জন্য</div>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                  <div className="font-bold text-xs text-zinc-900 dark:text-white">ডেলিভারি ঠিকানা</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">সরাসরি পণ্য পৌঁছে দেওয়ার জন্য</div>
                </div>
              </div>
            </section>
          )}

          {/* ২. তথ্যের ব্যবহার */}
          {(activeTab === "all" || activeTab === "collection") && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-black">
                  ২
                </span>
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4>তথ্যের ব্যবহার (How We Use Information)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pl-0 sm:pl-2">
                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 flex items-start gap-2.5 shadow-2xs">
                  <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      অর্ডার ডেলিভারি
                    </h5>
                    <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      দ্রুত ও নির্ভুল ঠিকানায় পণ্য পৌঁছে দেওয়ার কাজে।
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 flex items-start gap-2.5 shadow-2xs">
                  <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      রিটার্ন ও এক্সচেঞ্জ
                    </h5>
                    <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      ৭ দিনের সহজ রিটার্ন বা সমস্যা সমাধানে সহায়তা করতে।
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 flex items-start gap-2.5 shadow-2xs">
                  <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      কাস্টমার সাপোর্ট
                    </h5>
                    <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      অর্ডার স্ট্যাটাস আপডেট ও তাৎক্ষণিক প্রশ্নের উত্তর দিতে।
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ৩. তথ্যের নিরাপত্তা */}
          {(activeTab === "all" || activeTab === "security") && (
            <section className="space-y-2 bg-indigo-50/60 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-black">
                  ৩
                </span>
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4>তথ্যের নিরাপত্তা (Data Security)</h4>
              </div>
              <p className="text-xs sm:text-sm pl-8 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখার জন্য যথাযথ প্রযুক্তিগত ও যুক্তিসঙ্গত নিরাপত্তা ব্যবস্থা গ্রহণ করা হয়। কোনো অননুমোদিত প্রবেশাধিকার বা তথ্যের অপব্যবহার রোধে আমাদের সিস্টেম সবসময় সতর্ক থাকে।
              </p>
            </section>
          )}

          {/* ৪. তৃতীয় পক্ষ (Third-Party Services) */}
          {(activeTab === "all" || activeTab === "security") && (
            <section className="space-y-2 bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-black">
                  ৪
                </span>
                <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4>তৃতীয় পক্ষ (Third-Party Disclosure)</h4>
              </div>
              <p className="text-xs sm:text-sm pl-8 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                পণ্য পৌঁছে দেওয়ার জন্য বিশ্বস্ত <strong>কুরিয়ার সার্ভিস</strong> এবং পেমেন্ট ভেরিফিকেশনের জন্য <strong>পেমেন্ট সেবাদাতা (যেমন: বিকাশ, নগদ, রকেট)</strong>-র সঙ্গে কেবল প্রয়োজনীয় অংশটুকু শেয়ার করা হতে পারে। বাণিজ্যিক উদ্দেশ্যে কোনো তৃতীয় পক্ষের কাছে আপনার ব্যক্তিগত তথ্য বিক্রি বা হস্তান্তর করা হয় না।
              </p>
            </section>
          )}

          {/* ৫. কুকিজ (Cookies) */}
          {(activeTab === "all" || activeTab === "security") && (
            <section className="space-y-2 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200/70 dark:border-zinc-700/60">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base">
                <span className="w-6 h-6 rounded-lg bg-zinc-500/20 text-zinc-700 dark:text-zinc-400 flex items-center justify-center text-xs font-black">
                  ৫
                </span>
                <Cookie className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4>কুকিজ (Cookies)</h4>
              </div>
              <p className="text-xs sm:text-sm pl-8 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                ওয়েবসাইটের কার্যকারিতা উন্নত করতে, ইউজার সেশন বজায় রাখতে ও আপনার কেনাকাটার সুবিধার্থে কুকিজ ব্যবহার করা হতে পারে।
              </p>
            </section>
          )}

          {/* ৬. পরিবর্তন (Policy Updates) */}
          {(activeTab === "all" || activeTab === "security") && (
            <section className="space-y-2 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200/70 dark:border-zinc-700/60">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base">
                <span className="w-6 h-6 rounded-lg bg-zinc-500/20 text-zinc-700 dark:text-zinc-400 flex items-center justify-center text-xs font-black">
                  ৬
                </span>
                <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4>নীতিমালার পরিবর্তন (Policy Updates)</h4>
              </div>
              <p className="text-xs sm:text-sm pl-8 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                গ্রাহকসেবা আরও উন্নত ও আধুনিক করতে প্রয়োজন অনুযায়ী যে কোনো সময় এই নীতিমালা আপডেট করা হতে পারে। আপডেটকৃত নীতিমালা সর্বদা এই পেজে সরাসরি প্রকাশ করা হবে।
              </p>
            </section>
          )}

          {/* ৭. যোগাযোগ: Nirapod Kroy */}
          {(activeTab === "all" || activeTab === "contact") && (
            <section className="space-y-3 bg-zinc-900 text-white dark:bg-zinc-800 p-5 rounded-2xl shadow-md">
              <div className="flex items-center gap-2 font-extrabold text-base">
                <span className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs font-black">
                  ৭
                </span>
                <h4>যোগাযোগ (Contact &amp; Privacy Support)</h4>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300">
                গোপনীয়তা নীতি সম্পর্কে যেকোনো জিজ্ঞাসা বা সহায়তার জন্য Nirapod Kroy-এর সাথে সরাসরি যোগাযোগ করুন:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={openWhatsAppSupport}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/15 p-3 rounded-xl text-left transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">হোয়াটসঅ্যাপ নম্বর</div>
                    <div className="text-xs font-bold text-white font-mono">01786681134</div>
                  </div>
                </button>

                {/* Email */}
                <a
                  href="mailto:mtarifprodhan@gmail.com"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/15 p-3 rounded-xl text-left transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">অফিসিয়াল ইমেইল</div>
                    <div className="text-xs font-bold text-white font-mono truncate">mtarifprodhan@gmail.com</div>
                  </div>
                </a>
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-zinc-300">
                <span>প্রতিষ্ঠানের নাম: <strong className="text-white">Nirapod Kroy</strong></span>
                <div className="flex items-center gap-3 flex-wrap">
                  {onOpenDeliveryPolicy && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenDeliveryPolicy();
                      }}
                      className="text-amber-400 hover:underline font-bold text-left cursor-pointer flex items-center gap-1"
                    >
                      <span>ডেলিভারি পলিসি (২-৫ দিন)</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                  {onOpenReturnPolicy && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenReturnPolicy();
                      }}
                      className="text-emerald-400 hover:underline font-bold text-left cursor-pointer flex items-center gap-1"
                    >
                      <span>রিটার্ন ও রিফান্ড পলিসি (৭ দিন)</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sticky Modal Footer */}
        <div className="sticky bottom-0 z-20 bg-zinc-50 dark:bg-zinc-800/90 backdrop-blur-md px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              ইউআরএল ঠিকানা: <strong className="text-blue-600 dark:text-blue-400">/privacy-policy</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              বন্ধ করুন (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
