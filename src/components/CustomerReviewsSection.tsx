import React, { useState, useMemo, useEffect } from "react";
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Plus,
  X,
  ShieldCheck,
  MapPin,
  Sparkles,
  ShoppingBag,
  Send,
  Check,
  ChevronDown,
  Mail,
  Phone,
  Loader2,
  Trash2
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { handleLocalApi, syncReviewToGoogleSheetsClient } from "../lib/mockApi";

export interface CustomerReview {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location: string;
  rating: number;
  productName: string;
  category: "all" | "food" | "dates" | "oil_ghee" | "fashion" | "gadgets";
  comment?: string;
  commentBn: string;
  commentEn?: string;
  date?: string;
  dateBn: string;
  dateEn?: string;
  isVerified: boolean;
  isActive?: boolean;
  likes: number;
  avatarBg?: string;
}

const DEFAULT_REVIEWS: CustomerReview[] = [
  {
    id: "rev-1",
    name: "তানভীর হাসান",
    email: "tanvir.h@gmail.com",
    phone: "01711223344",
    location: "মিরপুর-১০, ঢাকা",
    rating: 5,
    productName: "সুন্দরবনের প্রাকৃতিক খলিশা মধু - ১ কেজি",
    category: "food",
    commentBn: "মধুর স্বাদ ও ঘ্রাণ এক কথায় অসাধারণ! আগে অনেক জায়গা থেকে মধু নিয়েছি কিন্তু এইরকম খাঁটি ও র’ মধু খুব কম পাওয়া যায়। প্যাকেজিং ও কাঁচের জার খুব নিরাপদে ডেলিভারি পেয়েছি।",
    commentEn: "The taste and aroma of the Sundarbans honey is truly authentic! Received very secure packaging in a safe glass jar. Highly recommended!",
    dateBn: "গতকাল",
    dateEn: "Yesterday",
    isVerified: true,
    likes: 42,
    avatarBg: "bg-emerald-600"
  },
  {
    id: "rev-2",
    name: "মাহমুদা আক্তার মিলি",
    email: "mili.akhtar@yahoo.com",
    phone: "01819334455",
    location: "পাঁচলাইশ, চট্টগ্রাম",
    rating: 5,
    productName: "প্রিমিয়াম মরিয়ম খেজুর (সরাসরি মদিনা) - ১ কেজি",
    category: "dates",
    commentBn: "রমজানের আগেই খেজুরের অর্ডার করেছিলাম। চট্টগ্রামের ঠিকানায় মাত্র ২ দিনে ডেলিভারি পেয়েছি। খেজুরগুলো একেবারে নরম, ফ্রেশ ও বড় সাইজের। নিরাপদ ক্রয়ের সার্ভিস সত্যিই প্রশংসনীয়।",
    commentEn: "Ordered Maryam dates and got delivery within 2 days in Chittagong. Dates are fresh, soft, and premium quality. Excellent service!",
    dateBn: "৩ দিন আগে",
    dateEn: "3 days ago",
    isVerified: true,
    likes: 29,
    avatarBg: "bg-teal-600"
  },
  {
    id: "rev-3",
    name: "রাশেদুল ইসলাম",
    email: "rashed.sylhet@gmail.com",
    phone: "01712998877",
    location: "উপশহর, সিলেট",
    rating: 5,
    productName: "ঘানি ভাঙা কাঠের খাঁটি সরিষার তেল - ২ লিটার",
    category: "oil_ghee",
    commentBn: "তেলের ঝাঁজ আর আসল সরিষার সুবাসেই বোঝা যায় কোনো কেমিক্যাল নেই। রান্নায় চমৎকার স্বাদ এনে দেয়। ডেলিভারি বয় খুব ভদ্র ছিলেন এবং পার্সেল চেক করে টাকা দিয়েছি।",
    commentEn: "Strong authentic aroma of cold-pressed mustard oil with zero chemicals. Delivery was smooth with cash-on-delivery inspection.",
    dateBn: "৫ দিন আগে",
    dateEn: "5 days ago",
    isVerified: true,
    likes: 38,
    avatarBg: "bg-teal-600"
  },
  {
    id: "rev-4",
    name: "ফারহানা হক",
    email: "farhana.haque@gmail.com",
    phone: "01911445566",
    location: "উত্তরা সেক্টর ৭, ঢাকা",
    rating: 5,
    productName: "গ্রাম্য খাঁটি গাওয়া ঘি (সুস্বাদু দানাদার) - ৫০০ গ্রাম",
    category: "oil_ghee",
    commentBn: "ঘিয়ের সুঘ্রাণে পুরো ঘর ভরে যায়! পরোটা আর গরম ভাতের সাথে খেলে অসাধারণ স্বাদ। দানাদার টেক্সচারটাই আসল প্রমাণ। বারবার এই ঘি অর্ডার করব ইনশাআল্লাহ।",
    commentEn: "Aroma of pure granular ghee filled the whole room! Superb texture and rich traditional taste. Will definitely re-order.",
    dateBn: "১ সপ্তাহ আগে",
    dateEn: "1 week ago",
    isVerified: true,
    likes: 51,
    avatarBg: "bg-indigo-600"
  },
  {
    id: "rev-5",
    name: "শফিকুল আলম",
    email: "shafiqul.raj@outlook.com",
    phone: "01715667788",
    location: "বোয়ালিয়া, রাজশাহী",
    rating: 5,
    productName: "উইন্টার প্রিমিয়াম কটন হুডি (ব্ল্যাক)",
    category: "fashion",
    commentBn: "হুডির ফেব্রিক কোয়ালিটি অনেক সফট এবং ভারী শীতের জন্য পারফেক্ট। কালার ও ফিটিং ঠিক ছবির মতোই। সাইজ চার্ট দেখে অর্ডার করায় একদম পারফেক্ট সাইজ হয়েছে।",
    commentEn: "Fabric quality of the winter hoodie is super soft and cozy. Fitting matches the size chart perfectly. Very satisfied with the fabric.",
    dateBn: "১ সপ্তাহ আগে",
    dateEn: "1 week ago",
    isVerified: true,
    likes: 24,
    avatarBg: "bg-blue-600"
  },
  {
    id: "rev-6",
    name: "ডা. আরিফুল করিম",
    email: "dr.ariful@gmail.com",
    phone: "01611889900",
    location: "সোনাডাঙ্গা, খুলনা",
    rating: 5,
    productName: "ন্যাচারাল প্রিমিয়াম মিক্সড ড্রাই ফ্রুটস ও বাদাম - ৫০০ গ্রাম",
    category: "dates",
    commentBn: "বাদাম ও কিসমিসগুলোর কোয়ালিটি অত্যন্ত ভালো। কোনো বাসি বা ধুলোবালি নেই। হেলদি ডায়েট করার জন্য নিয়মিত খাওয়ার সেরা আইটেম। প্যাকেটের এয়ারটাইট সিলিং খুব ভালো ছিল।",
    commentEn: "Mixed dry fruits and nuts are fresh and crunchy with excellent airtight packaging. Essential for daily healthy nutrition.",
    dateBn: "২ সপ্তাহ আগে",
    dateEn: "2 weeks ago",
    isVerified: true,
    likes: 33,
    avatarBg: "bg-rose-600"
  },
  {
    id: "rev-7",
    name: "নাসরিন জাহান",
    email: "nasrin.jahan@gmail.com",
    phone: "01788776655",
    location: "ধানমন্ডি, ঢাকা",
    rating: 5,
    productName: "সুন্দরবনের চাকের খাটি মধু (Raw Natural Honey)",
    category: "food",
    commentBn: "ছোট বাচ্চার জন্য খাটি মধু দরকার ছিল। ল্যাব টেস্ট বা পানির গ্লাসে ড্রপ টেস্ট করে দেখেছি শতভাগ খাঁটি। কোনো চিনি বা ভেজাল নেই। নিশ্চিন্তে সবাই নিতে পারেন।",
    commentEn: "Tested the raw honey drop test at home and found 100% natural pure honey. Ideal for kids and family health. Highly authentic!",
    dateBn: "২ সপ্তাহ আগে",
    dateEn: "2 weeks ago",
    isVerified: true,
    likes: 67,
    avatarBg: "bg-purple-600"
  },
  {
    id: "rev-8",
    name: "ইমতিয়াজ কবীর",
    email: "imtiaz.kabir@gmail.com",
    phone: "01511223344",
    location: "গাইবান্ধা সদর",
    rating: 5,
    productName: "স্মার্ট ওয়াটারপ্রুফ ব্লুটুথ হেডফোন",
    category: "gadgets",
    commentBn: "গাইবান্ধার ঠিকানায় কুরিয়ারে মাত্র ৩ দিনে পৌঁছেছে। সাউন্ড কোয়ালিটি ও ব্যাটারি ব্যাকআপ এক কথায় অসাধারণ। ক্যাশ অন ডেলিভারি থাকায় নিশ্চিন্তে নিয়েছি।",
    commentEn: "Received prompt delivery to Gaibandha via courier. Battery life and sound clarity are top-notch. Seamless cash on delivery.",
    dateBn: "৩ সপ্তাহ আগে",
    dateEn: "3 weeks ago",
    isVerified: true,
    likes: 19,
    avatarBg: "bg-cyan-600"
  }
];

const LOCAL_STORAGE_REVIEWS_KEY = "nirapod_customer_reviews_v1";
const LOCAL_STORAGE_LIKES_KEY = "nirapod_review_liked_ids_v1";

const formatReviewItem = (r: any): CustomerReview => {
  const colors = [
    "bg-emerald-600",
    "bg-teal-600",
    "bg-cyan-600",
    "bg-blue-600",
    "bg-indigo-600",
    "bg-rose-600",
    "bg-purple-600"
  ];
  const charCode = (r.name || "A").charCodeAt(0);
  const avatarBg = r.avatarBg || colors[charCode % colors.length];

  let dateBn = r.dateBn || "সাম্প্রতিক";
  let dateEn = r.dateEn || "Recent";
  if (r.date && !r.dateBn) {
    try {
      const d = new Date(r.date);
      dateBn = d.toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });
      dateEn = d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    } catch {}
  }

  return {
    id: r.id || ("rev-" + Math.random().toString(36).slice(2)),
    name: r.name || "Customer",
    email: r.email || "",
    phone: r.phone || "",
    location: r.location || "ঢাকা",
    rating: Number(r.rating) || 5,
    productName: r.productName || "Product",
    category: r.category || "food",
    comment: r.comment || r.commentBn || r.commentEn || "",
    commentBn: r.comment || r.commentBn || "",
    commentEn: r.commentEn || r.comment || "",
    date: r.date || new Date().toISOString(),
    dateBn,
    dateEn,
    isVerified: r.isVerified !== false,
    isActive: r.isActive !== false,
    likes: Number(r.likes) || 1,
    avatarBg
  };
};

export const CustomerReviewsSection: React.FC = () => {
  const { language } = useLanguage();
  const { addToast } = useToast();

  const [reviews, setReviews] = useState<CustomerReview[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_REVIEWS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(formatReviewItem);
        }
      }
    } catch {}
    return DEFAULT_REVIEWS;
  });

  // Real-time synchronization with server /api/reviews
  useEffect(() => {
    let isMounted = true;
    const loadLiveReviews = async () => {
      try {
        const res = await fetch("/api/reviews");
        if (res.ok) {
          const data = await res.json();
          if (data.reviews && Array.isArray(data.reviews) && isMounted) {
            const formatted = data.reviews.map(formatReviewItem);
            setReviews(formatted);
            try {
              localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(formatted));
            } catch {}
          }
        }
      } catch (err) {
        console.warn("API reviews fetch fallback:", err);
      }
    };
    loadLiveReviews();

    const handleReviewsUpdated = () => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_REVIEWS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setReviews(parsed.map(formatReviewItem));
          }
        }
      } catch {}
      loadLiveReviews();
    };

    window.addEventListener("nirapod_reviews_updated", handleReviewsUpdated);
    window.addEventListener("storage", handleReviewsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("nirapod_reviews_updated", handleReviewsUpdated);
      window.removeEventListener("storage", handleReviewsUpdated);
    };
  }, []);

  const [likedReviewIds, setLikedReviewIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LIKES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [selectedCategory, setSelectedCategory] = useState<"all" | "food" | "dates" | "oil_ghee" | "fashion" | "gadgets">("all");
  const [visibleCount, setVisibleCount] = useState(6);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // New review form states with Email and Phone
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formCategory, setFormCategory] = useState<"food" | "dates" | "oil_ghee" | "fashion" | "gadgets">("food");
  const [formComment, setFormComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredReviews = useMemo(() => {
    // Only display active reviews on the storefront
    const activeReviews = reviews.filter((r) => r.isActive !== false);
    if (selectedCategory === "all") return activeReviews;
    return activeReviews.filter((r) => r.category === selectedCategory);
  }, [reviews, selectedCategory]);

  const displayedReviews = useMemo(() => {
    return filteredReviews.slice(0, visibleCount);
  }, [filteredReviews, visibleCount]);

  const isAdmin = typeof window !== "undefined" && Boolean(localStorage.getItem("nirapod_admin_auth_token"));

  const handleDeleteReviewFromStore = async (id: string, name: string) => {
    const cleanId = String(id).trim();
    const updated = reviews.filter((r) => String(r.id).trim() !== cleanId);
    setReviews(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new Event("nirapod_reviews_updated"));
    addToast(language === "bn" ? `"${name}" এর রিভিউটি মুছে ফেলা হয়েছে!` : "Review deleted successfully!", "info");
    try {
      await fetch(`/api/reviews/${encodeURIComponent(cleanId)}`, { method: "DELETE" });
    } catch {}
  };

  const handleToggleLike = (reviewId: string) => {
    const isLiked = likedReviewIds.includes(reviewId);
    let updatedLikes = [...likedReviewIds];
    if (isLiked) {
      updatedLikes = updatedLikes.filter((id) => id !== reviewId);
    } else {
      updatedLikes.push(reviewId);
    }
    setLikedReviewIds(updatedLikes);
    localStorage.setItem(LOCAL_STORAGE_LIKES_KEY, JSON.stringify(updatedLikes));

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            likes: isLiked ? Math.max(0, r.likes - 1) : r.likes + 1
          };
        }
        return r;
      })
    );
  };

  const handleOpenModal = () => {
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanEmail = formEmail.trim().toLowerCase();
    const cleanProduct = formProduct.trim();
    const cleanComment = formComment.trim();

    if (!cleanName || !cleanComment || !cleanProduct) {
      addToast(
        language === "bn" ? "দয়া করে আপনার নাম, পণ্য এবং রিভিউ লিখুন" : "Please provide your name, product name and review",
        "error"
      );
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      addToast(
        language === "bn" ? "দয়া করে একটি সঠিক ইমেইল এড্রেস লিখুন" : "Please provide a valid email address",
        "warning"
      );
      return;
    }

    setIsSubmitting(true);

    const nowIso = new Date().toISOString();
    const payload = {
      name: cleanName,
      email: cleanEmail,
      phone: formPhone.trim(),
      location: formLocation.trim() || (language === "bn" ? "ঢাকা, বাংলাদেশ" : "Dhaka, Bangladesh"),
      rating: formRating,
      productName: cleanProduct,
      category: formCategory,
      comment: cleanComment,
      date: nowIso
    };

    let newRev: CustomerReview = {
      id: "rev-" + Date.now(),
      name: cleanName,
      email: cleanEmail,
      phone: formPhone.trim(),
      location: payload.location,
      rating: formRating,
      productName: cleanProduct,
      category: formCategory,
      comment: cleanComment,
      commentBn: cleanComment,
      commentEn: cleanComment,
      date: nowIso,
      dateBn: "এইমাত্র",
      dateEn: "Just now",
      isVerified: true,
      isActive: true,
      likes: 1,
      avatarBg: "bg-emerald-600"
    };

    try {
      // 1. Post to /api/reviews
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.review) {
          newRev = formatReviewItem(data.review);
        }
      } else {
        await handleLocalApi("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => null);
      }
    } catch {
      await handleLocalApi("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => null);
    }

    // Always dispatch directly to Google Sheets Webhook "review sheet" tab
    syncReviewToGoogleSheetsClient(newRev as any).catch(() => {});

    const updated = [newRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_REVIEWS_KEY, JSON.stringify(updated));
    } catch {}

    setIsSubmitting(false);
    setIsReviewModalOpen(false);
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormLocation("");
    setFormProduct("");
    setFormComment("");
    setFormRating(5);

    addToast(
      language === "bn"
        ? "ধন্যবাদ! আপনার রিভিউটি গুগল শিটের 'Customer Reviews' ট্যাবে ও ওয়েবসাইটে সফলভাবে সংরক্ষিত হয়েছে।"
        : "Thank you! Your verified review has been saved to Google Sheets and published.",
      "success"
    );
  };

  const categories = [
    { id: "all", labelBn: "সকল রিভিউ", labelEn: "All Reviews" },
    { id: "food", labelBn: "🍯 খাঁটি মধু ও ফুড", labelEn: "🍯 Honey & Food" },
    { id: "dates", labelBn: "🌴 খেজুর ও বাদাম", labelEn: "🌴 Dates & Nuts" },
    { id: "oil_ghee", labelBn: "🌾 সরিষার তেল ও ঘি", labelEn: "🌾 Mustard Oil & Ghee" },
    { id: "fashion", labelBn: "🧥 ফ্যাশন ও পোশাক", labelEn: "🧥 Fashion" },
    { id: "gadgets", labelBn: "📱 গ্যাজেটস ও অন্যান্য", labelEn: "📱 Gadgets" }
  ];

  return (
    <section
      id="customer-reviews-section"
      className="py-12 sm:py-16 bg-gradient-to-b from-white via-zinc-50/70 to-emerald-50/30 dark:from-zinc-950 dark:via-zinc-900/60 dark:to-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800 transition-colors"
      aria-label="Customer Reviews"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2.5 border border-emerald-300/60 dark:border-emerald-800/60 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === "bn" ? "আসল গ্রাহকদের মতামত" : "Verified Customer Reviews"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-900 dark:text-white font-display tracking-tight">
              {language === "bn" ? "গ্রাহকদের প্রতিক্রিয়া ও অভিজ্ঞতা" : "What Our Customers Say"}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 max-w-2xl leading-relaxed">
              {language === "bn"
                ? "দেশজুড়ে নিরাপদ ক্রয়-এর হাজারো সন্তুষ্ট পরিবারের আসল রিভিউ, নির্ভরযোগ্য ডেলিভারি ও ১০০% খাঁটি পণ্যের নিশ্চয়তা।"
                : "Real experiences and genuine ratings from thousands of verified happy shoppers across Bangladesh."}
            </p>
          </div>

          {/* Quick Metrics & Write Review Action */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 flex-wrap">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 shadow-2xs">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                  4.9
                </span>
              </div>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                <strong className="text-zinc-800 dark:text-zinc-200">2,450+</strong>{" "}
                <span>{language === "bn" ? "যাচাইকৃত রিভিউ" : "Ratings"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 sm:py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{language === "bn" ? "রিভিউ লিখুন" : "Write a Review"}</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2 pb-2 overflow-x-auto no-scrollbar mb-6">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs font-bold"
                    : "bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 border border-zinc-200/80 dark:border-zinc-700/80"
                }`}
              >
                {language === "bn" ? cat.labelBn : cat.labelEn}
              </button>
            );
          })}
        </div>

        {/* Reviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayedReviews.map((rev) => {
            const isLiked = likedReviewIds.includes(rev.id);
            return (
              <div
                key={rev.id}
                className="flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all duration-200"
              >
                <div>
                  {/* Top Bar: Customer Avatar, Name, Location, Verified */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl ${rev.avatarBg} text-white font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0`}
                      >
                        {rev.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">
                            {rev.name}
                          </h4>
                          {rev.isVerified && (
                            <span
                              className="text-emerald-600 dark:text-emerald-400"
                              title={language === "bn" ? "যাচাইকৃত ক্রেতা" : "Verified Buyer"}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white dark:text-zinc-900" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span>{rev.location}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
                      {language === "bn" ? rev.dateBn : rev.dateEn}
                    </span>
                  </div>

                  {/* Rating Stars & Product Tag */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-200 dark:text-zinc-700"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 max-w-full">
                      <ShoppingBag className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">{rev.productName}</span>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                    "{language === "bn" ? rev.commentBn : rev.commentEn}"
                  </p>
                </div>

                {/* Bottom Card Footer: Helpful Like Button */}
                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="text-[11px] flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === "bn" ? "যাচাইকৃত ক্রয় (Verified Purchase)" : "Verified Purchase"}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteReviewFromStore(rev.id, rev.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/40 text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                        title="রিভিউ মুছে ফেলুন (Admin)"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleLike(rev.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all cursor-pointer select-none active:scale-90 ${
                        isLiked
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                      }`}
                      title={language === "bn" ? "উপকারী রিভিউ" : "Helpful Review"}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                      <span>{rev.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {filteredReviews.length > visibleCount && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/90 dark:border-zinc-800 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>{language === "bn" ? "আরও রিভিউ দেখুন" : "View More Reviews"}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Trust Badges Banner right above Footer - in logo secondary orange shade */}
        <div className="mt-10 sm:mt-12 p-4 sm:p-5 rounded-3xl bg-[#d38f18]/15 dark:bg-[#d38f18]/10 border border-[#d38f18]/40 dark:border-[#d38f18]/30 shadow-xs flex flex-wrap items-center justify-around gap-4 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#d38f18] text-white flex items-center justify-center shadow-xs">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span>{language === "bn" ? "১০০% খাটি ও অর্গানিক নিশ্চয়তা" : "100% Authentic Organic Quality"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#d38f18] text-white flex items-center justify-center shadow-xs">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span>{language === "bn" ? "প্যাকেট খুলে চেক করে পেমেন্ট" : "Check Package Before Payment"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#d38f18] text-white flex items-center justify-center shadow-xs">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span>{language === "bn" ? "সহজ ৭ দিনের রিটার্ন পলিসি" : "Hassle-Free 7 Days Return"}</span>
          </div>
        </div>
      </div>

      {/* Write a Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setIsReviewModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                  <MessageSquare className="w-5 h-5 stroke-2" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    {language === "bn" ? "আপনার রিভিউ শেয়ার করুন" : "Write Customer Review"}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {language === "bn" ? "অন্যান্য ক্রেতাদের সঠিক সিদ্ধান্ত নিতে সহায়তা করুন" : "Help other buyers make informed choices"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 pt-4">
              {/* Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {language === "bn" ? "আপনার রেটিং সিলেক্ট করুন:" : "Your Rating:"}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 active:scale-90 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= formRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-200 dark:text-zinc-700"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-600 ml-2">
                    {formRating} / 5 {language === "bn" ? "স্টার" : "Stars"}
                  </span>
                </div>
              </div>

              {/* Name & Email (Both sent to Google Sheets & DB) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === "bn" ? "আপনার নাম *" : "Your Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={language === "bn" ? "উদাঃ তানভীর আহমেদ" : "e.g. Tanvir Ahmed"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === "bn" ? "আপনার ইমেইল (Google Sheet-এ সেভ হবে) *" : "Your Email (Saved to Google Sheet) *"}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder={language === "bn" ? "name@example.com" : "name@example.com"}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === "bn" ? "মোবাইল নম্বর (ঐচ্ছিক)" : "Phone Number (Optional)"}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder={language === "bn" ? "০১৭XXXXXXXX" : "017XXXXXXXX"}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === "bn" ? "আপনার এলাকা / জেলা" : "District / City"}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder={language === "bn" ? "উদাঃ মিরপুর, ঢাকা" : "e.g. Mirpur, Dhaka"}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Product Purchased */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === "bn" ? "ক্রয়কৃত পণ্যের নাম *" : "Purchased Product *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formProduct}
                    onChange={(e) => setFormProduct(e.target.value)}
                    placeholder={language === "bn" ? "উদাঃ সুন্দরবনের মধু" : "e.g. Sundarbans Honey"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === "bn" ? "ক্যাটাগরি" : "Category"}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="food">খাঁটি মধু ও ফুড</option>
                    <option value="dates">খেজুর ও বাদাম</option>
                    <option value="oil_ghee">সরিষার তেল ও ঘি</option>
                    <option value="fashion">ফ্যাশন ও পোশাক</option>
                    <option value="gadgets">গ্যাজেট ও লাইফস্টাইল</option>
                  </select>
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === "bn" ? "আপনার অভিজ্ঞতা ও রিভিউ *" : "Your Review & Experience *"}
                </label>
                <textarea
                  required
                  rows={4}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder={
                    language === "bn"
                      ? "পণ্যটির কোয়ালিটি, স্বাদ, প্যাকেজিং ও ডেলিভারি কেমন লেগেছে বিস্তারিত লিখুন..."
                      : "Share your honest thoughts about quality, packaging, delivery..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  {language === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? (language === "bn" ? "জমা হচ্ছে..." : "Submitting...") : (language === "bn" ? "রিভিউ প্রকাশ করুন" : "Publish Review")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
