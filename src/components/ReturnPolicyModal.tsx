import React, { useState, useEffect } from "react";
import {
  X,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Truck,
  CreditCard,
  PhoneCall,
  MessageCircle,
  Share2,
  Copy,
  Check,
  Search,
  ShieldCheck,
  FileText
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";

interface ReturnPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTrackOrder?: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenDeliveryPolicy?: () => void;
}

export const ReturnPolicyModal: React.FC<ReturnPolicyModalProps> = ({
  isOpen,
  onClose,
  onOpenTrackOrder,
  onOpenPrivacyPolicy,
  onOpenDeliveryPolicy
}) => {
  const { language } = useLanguage();
  const { addToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "eligible" | "ineligible" | "terms" | "charges">("all");

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
      const shareUrl = `${window.location.origin}/return-refund`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      addToast(
        language === "bn"
          ? "রিটার্ন ও রিফান্ড পলিসি লিঙ্ক কপি হয়েছে!"
          : "Return & Refund Policy link copied to clipboard!",
        "success"
      );
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      addToast(language === "bn" ? "লিঙ্ক কপি করা যায়নি" : "Failed to copy link", "error");
    }
  };

  const openWhatsAppSupport = () => {
    const message = encodeURIComponent(
      "আসসালামু আলাইকুম, আমি Nirapod Kroy থেকে একটি পণ্য রিটার্ন / রিফান্ড করতে চাই।\n\nঅর্ডার নম্বর:\nগ্রাহকের নাম:\nফোন নম্বর:\nরিটার্নের কারণ:"
    );
    window.open(`https://wa.me/8801786681134?text=${message}`, "_blank");
  };

  const eligibleReasons = [
    {
      title: "ভুল পণ্য ডেলিভারি",
      desc: "গ্রাহক যে পণ্য অর্ডার করেছেন, তার পরিবর্তে অন্য পণ্য পাঠানো হলে।"
    },
    {
      title: "পণ্য ড্যামেজ বা ভাঙা অবস্থায় পাওয়া",
      desc: "ডেলিভারির সময় পণ্য ভাঙা, ক্ষতিগ্রস্ত বা ব্যবহারের অনুপযোগী অবস্থায় পাওয়া গেলে।"
    },
    {
      title: "পণ্যে ম্যানুফ্যাকচারিং ত্রুটি",
      desc: "পণ্যে উৎপাদনজনিত ত্রুটি থাকলে এবং সেটি ব্যবহারের আগে বা স্বাভাবিক ব্যবহারে প্রমাণিত হলে।"
    },
    {
      title: "অসম্পূর্ণ অর্ডার",
      desc: "অর্ডারে উল্লেখিত কোনো পণ্য, অংশ বা প্রয়োজনীয় আনুষঙ্গিক জিনিস অনুপস্থিত থাকলে।"
    },
    {
      title: "পণ্যের বর্ণনার সঙ্গে উল্লেখযোগ্য অমিল",
      desc: "ওয়েবসাইটে প্রদর্শিত বিবরণ বা নির্দিষ্ট বৈশিষ্ট্যের সঙ্গে পণ্যের উল্লেখযোগ্য পার্থক্য থাকলে।"
    },
    {
      title: "আকার বা সাইজের সমস্যা (প্রযোজ্য পণ্যে)",
      desc: "নির্ধারিত সাইজের ভুল পণ্য পাঠানো হলে রিটার্ন বা এক্সচেঞ্জের জন্য আবেদন করা যাবে। গ্রাহকের নিজস্ব পছন্দ পরিবর্তনের ক্ষেত্রে শর্ত প্রযোজ্য।"
    }
  ];

  const ineligibleReasons = [
    {
      title: "গ্রাহকের ভুল ব্যবহার বা অসাবধানতা",
      desc: "গ্রাহকের ভুল ব্যবহার বা অসাবধানতার কারণে পণ্য ক্ষতিগ্রস্ত হলে।"
    },
    {
      title: "স্বাভাবিক ব্যবহারজনিত ক্ষয়ক্ষতি",
      desc: "পণ্য ব্যবহারের ফলে স্বাভাবিক ক্ষয়ক্ষতি হলে।"
    },
    {
      title: "ট্যাগ বা প্যাকেজিং নষ্ট",
      desc: "পণ্যের ট্যাগ, প্যাকেজিং বা প্রয়োজনীয় আনুষঙ্গিক জিনিস ইচ্ছাকৃতভাবে নষ্ট বা হারিয়ে গেলে।"
    },
    {
      title: "৭ দিনের নির্ধারিত সময় পার হওয়া",
      desc: "৭ দিনের নির্ধারিত সময়সীমার পরে রিটার্ন রিকোয়েস্ট করা হলে।"
    },
    {
      title: "পরিবর্তন বা মেরামত করা পণ্য",
      desc: "পণ্য পরিবর্তন, মেরামত বা ক্ষতিগ্রস্ত করার পর রিটার্নের আবেদন করা হলে।"
    },
    {
      title: "ব্যক্তিগত পছন্দ পরিবর্তন",
      desc: "গ্রাহকের ব্যক্তিগত পছন্দ পরিবর্তনের কারণে রিটার্ন, যদি সেই পণ্যের জন্য রিটার্ন সুবিধা প্রযোজ্য না থাকে।"
    }
  ];

  const termsList = [
    "রিটার্নের জন্য গ্রাহককে অর্ডার নম্বর ও রিটার্নের কারণ জানাতে হবে।",
    "পণ্যের ছবি বা ভিডিও চাওয়া হলে তা সরবরাহ করতে হবে।",
    "পণ্যটি মূল অবস্থায়, প্রয়োজনীয় প্যাকেজিং ও আনুষঙ্গিক জিনিসসহ ফেরত দিতে হবে, যদি প্রযোজ্য হয়।",
    "আমাদের টিম পণ্য যাচাই করার পর রিটার্ন অনুমোদন করবে।",
    "অনুমোদিত রিটার্নের ক্ষেত্রে প্রযোজ্য নিয়ম অনুযায়ী রিপ্লেসমেন্ট, এক্সচেঞ্জ অথবা রিফান্ড প্রদান করা হবে।"
  ];

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
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight truncate">
                  Return &amp; Refund Policy
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black tracking-wide shadow-xs">
                  ৭ দিন
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                Nirapod Kroy — Customer-Friendly Return Policy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Share / Copy URL */}
            <button
              type="button"
              onClick={handleCopyLink}
              title="পলিসি লিঙ্ক কপি করুন (/return-refund)"
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
        <div className="overflow-y-auto px-5 py-6 space-y-6 text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
          {/* Hero Banner with 7-Day Guarantee */}
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" /> ১০০% গ্রাহকবান্ধব নিশ্চয়তা
              </span>
              <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                Nirapod Kroy — Customer-Friendly Return Policy
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                আমাদের প্রতিটি গ্রাহকের নির্ভরযোগ্য ও নিরাপদ কেনাকাটার অভিজ্ঞতা নিশ্চিত করতে আমাদের স্বচ্ছ ও সহজ রিটার্ন নীতি।
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 bg-white dark:bg-zinc-800 px-3.5 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-700 shadow-xs">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400">সময়সীমা</div>
                <div className="text-sm font-black text-zinc-900 dark:text-white">৭ দিনের মধ্যে</div>
              </div>
            </div>
          </div>

          {/* Quick Filter Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-zinc-100 dark:border-zinc-800">
            {[
              { id: "all", label: "সব নীতি" },
              { id: "eligible", label: "যেসব কারণে রিটার্ন হবে" },
              { id: "ineligible", label: "যেসব কারণে হবে না" },
              { id: "terms", label: "শর্তাবলি ও চার্জ" },
              { id: "charges", label: "আবেদনের নিয়ম" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ১. রিটার্ন গ্রহণের সময়সীমা */}
          {(activeTab === "all" || activeTab === "terms") && (
            <section className="space-y-2 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200/70 dark:border-zinc-700/60">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-black">
                  ১
                </span>
                <h4>রিটার্ন গ্রহণের সময়সীমা</h4>
              </div>
              <p className="text-xs sm:text-sm pl-8 text-zinc-600 dark:text-zinc-300">
                আমাদের পণ্য হাতে পাওয়ার তারিখ থেকে <strong>৭ দিনের মধ্যে</strong> রিটার্ন রিকোয়েস্ট করতে হবে। ৭ দিন পার হয়ে গেলে সাধারণত রিটার্ন গ্রহণ করা হবে না, তবে বিশেষ পরিস্থিতিতে কর্তৃপক্ষের সিদ্ধান্ত প্রযোজ্য।
              </p>
            </section>
          )}

          {/* ২. যেসব কারণে রিটার্ন গ্রহণ করা হবে */}
          {(activeTab === "all" || activeTab === "eligible") && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-black">
                  ২
                </span>
                <h4>যেসব কারণে রিটার্ন গ্রহণ করা হবে</h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  গ্রহণযোগ্য
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-0 sm:pl-2">
                {eligibleReasons.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 flex items-start gap-2.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </h5>
                      <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ৩. যেসব কারণে রিটার্ন গ্রহণ করা হবে না */}
          {(activeTab === "all" || activeTab === "ineligible") && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base">
                <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center text-xs font-black">
                  ৩
                </span>
                <h4>যেসব কারণে রিটার্ন গ্রহণ করা হবে না</h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  অগ্রহণযোগ্য
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-0 sm:pl-2">
                {ineligibleReasons.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 flex items-start gap-2.5 shadow-2xs"
                  >
                    <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </h5>
                      <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ৪. রিটার্নের শর্তাবলি */}
          {(activeTab === "all" || activeTab === "terms") && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-black">
                  ৪
                </span>
                <h4>রিটার্নের শর্তাবলি</h4>
              </div>

              <ul className="space-y-2 pl-2 sm:pl-4">
                {termsList.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ৫. রিটার্ন ডেলিভারি চার্জ */}
          {(activeTab === "all" || activeTab === "terms") && (
            <section className="space-y-3 bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-black">
                  ৫
                </span>
                <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4>রিটার্ন ডেলিভারি চার্জ</h4>
              </div>

              <div className="space-y-2 text-xs sm:text-sm pl-2">
                <p>
                  <strong>• ভুল পণ্য, ড্যামেজ বা ম্যানুফ্যাকচারিং ত্রুটি:</strong> যাচাইয়ের পর ব্যবসার পক্ষ থেকে দায় স্বীকার করা হলে রিটার্ন ডেলিভারি খরচ সম্পূর্ণ <strong>ব্যবসা বহন করবে</strong>।
                </p>
                <p>
                  <strong>• গ্রাহকের পছন্দ পরিবর্তন বা ভুল অর্ডার:</strong> রিটার্ন সুবিধা প্রযোজ্য হলে ডেলিভারি খরচ গ্রাহকের বহন করতে হতে পারে।
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                  প্রতিটি ক্ষেত্রে পণ্যের ধরন ও পরিস্থিতি অনুযায়ী চার্জ নির্ধারণ করা হবে।
                </p>
              </div>
            </section>
          )}

          {/* ৬. রিফান্ড পলিসি */}
          {(activeTab === "all" || activeTab === "terms") && (
            <section className="space-y-2 bg-indigo-50/60 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-xs font-black">
                  ৬
                </span>
                <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4>রিফান্ড পলিসি</h4>
              </div>
              <p className="text-xs sm:text-sm pl-2">
                রিটার্ন অনুমোদনের পর রিফান্ডের পদ্ধতি ও সময়সীমা গ্রাহককে জানানো হবে। পেমেন্ট পদ্ধতি, পণ্য যাচাই এবং প্রযোজ্য ডেলিভারি খরচ অনুযায়ী ফেরতযোগ্য অর্থ সরাসরি গ্রাহকের পছন্দের মাধ্যমে (বিকাশ / নগদ / রকেট / ব্যাংক) প্রদান করা হবে।
              </p>
            </section>
          )}

          {/* ৭. রিটার্ন করার নিয়ম ও কাস্টমার সাপোর্ট */}
          {(activeTab === "all" || activeTab === "charges") && (
            <section className="space-y-3 bg-zinc-900 text-white dark:bg-zinc-800 p-5 rounded-2xl shadow-md">
              <div className="flex items-center gap-2 font-extrabold text-base">
                <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-black">
                  ৭
                </span>
                <h4>রিটার্ন করার নিয়ম</h4>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300">
                গ্রাহক রিটার্ন করতে চাইলে আমাদের কাস্টমার সাপোর্টে যোগাযোগ করুন এবং নিচের তথ্য প্রদান করুন:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-200 pt-1">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl">
                  <span className="text-emerald-400 font-bold">১.</span>
                  <span>অর্ডার নম্বর (যেমন: #NK-XXXXX)</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl">
                  <span className="text-emerald-400 font-bold">২.</span>
                  <span>গ্রাহকের নাম ও ফোন নম্বর</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl">
                  <span className="text-emerald-400 font-bold">৩.</span>
                  <span>রিটার্নের নির্দিষ্ট কারণ</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl">
                  <span className="text-emerald-400 font-bold">৪.</span>
                  <span>পণ্যের ছবি বা ভিডিও (প্রয়োজন হলে)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-xs text-zinc-300">
                  <span className="font-bold text-white block">যোগাযোগ: Nirapod Kroy Customer Support</span>
                  <span className="text-[11px] text-zinc-400">আমরা প্রতিটি রিটার্ন রিকোয়েস্ট ন্যায্যভাবে যাচাই করে দ্রুত সমাধানের চেষ্টা করি।</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={openWhatsAppSupport}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>হোয়াটসঅ্যাপ সাপোর্ট</span>
                  </button>

                  <a
                    href="tel:01786681134"
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>01786681134</span>
                  </a>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sticky Modal Footer */}
        <div className="sticky bottom-0 z-20 bg-zinc-50 dark:bg-zinc-800/90 backdrop-blur-md px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              ইউআরএল ঠিকানা: <strong className="text-emerald-600 dark:text-emerald-400">/return-refund</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDeliveryPolicy && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDeliveryPolicy();
                }}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                ডেলিভারি পলিসি
              </button>
            )}

            {onOpenPrivacyPolicy && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrivacyPolicy();
                }}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                গোপনীয়তা নীতি
              </button>
            )}

            {onOpenTrackOrder && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTrackOrder();
                }}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                আমার অর্ডার ট্র্যাক করুন
              </button>
            )}

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
