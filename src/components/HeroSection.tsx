import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  Clock,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";
import { handleProductImageError } from "../utils/imageHelper";

interface HeroSectionProps {
  onSelectCategory?: (category: string) => void;
  onExploreClick?: (category?: string) => void;
  onDealsClick?: (dealsCategory?: string) => void;
  onOpenProductDetail?: (productId: string) => void;
  onOpenReturnPolicy?: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenDeliveryPolicy?: () => void;
}

export interface UserBannerSlide {
  id: number;
  name: string;
  category: string;
  dealsCategory: string;
  title: { bn: string; en: string };
  image: string;
  fallbackImage: string;
  altText: string;
}

// 100% exact, unmodified 5 user-provided custom banner designs (16:9 HD / 2K)
const BANNER_SLIDES: UserBannerSlide[] = [
  {
    id: 1,
    name: "all_products",
    category: "All",
    dealsCategory: "Offer Zone",
    title: {
      bn: "সব ধরনের পণ্যের বিশ্বস্ত বাজার - Nirapod Kroy (নিরাপদ ক্রয়)",
      en: "Your Ultimate Everything Store - Nirapod Kroy"
    },
    image: "https://res.cloudinary.com/dwvcatty/image/upload/v1790400891/Gemini_Generated_Image_vxjgo9vxjgo9vxjg.jpg",
    fallbackImage: "/images/banners/Gemini_Generated_Image_vxjgo9vxjgo9vxjg.jpg",
    altText: "সব ধরনের পণ্যের বিশ্বস্ত বাজার - নিরাপদ ক্রয়"
  },
  {
    id: 2,
    name: "fashion_lifestyle",
    category: "Fashion",
    dealsCategory: "Offer Zone",
    title: {
      bn: "স্টাইলিশ ফ্যাশন, পোশাক ও লাইফস্টাইল - Fashion & Lifestyle Wear",
      en: "Stylish Fashion, Clothing & Lifestyle Wear"
    },
    image: "https://res.cloudinary.com/dwvcatty/image/upload/v1790400845/AI_creating_handmade_look_design_2K_20260926100408.jpg",
    fallbackImage: "/images/banners/AI_creating_handmade_look_design_2K_20260926100408.jpg",
    altText: "স্টাইলিশ ফ্যাশন, পোশাক ও লাইফস্টাইল - নিরাপদ ক্রয়"
  },
  {
    id: 3,
    name: "hoodie_collection",
    category: "Ladies Hoodie",
    dealsCategory: "Offer Zone",
    title: {
      bn: "Nirapod Kroy (নিরাপদ ক্রয়) - স্টাইলিশ হুডি কালেকশন (৩০% ছাড়)",
      en: "Nirapod Kroy - Stylish Hoodie Collection (30% Off)"
    },
    image: "https://res.cloudinary.com/dwvcatty/image/upload/v1790400892/Gemini_Generated_Image_8nkgr78nkgr78nkg.jpg",
    fallbackImage: "/images/banners/Gemini_Generated_Image_8nkgr78nkgr78nkg.jpg",
    altText: "স্টাইলিশ হুডি কালেকশন ব্যানার - নিরাপদ ক্রয়"
  },
  {
    id: 4,
    name: "electronics_gadgets",
    category: "Electronics",
    dealsCategory: "Offer Zone",
    title: {
      bn: "স্মার্ট ইলেকট্রনিক্স ও টেক গ্যাজেটস - Gadgets & Accessories",
      en: "Smart Tech & Electronics - Gadgets & Accessories"
    },
    image: "https://res.cloudinary.com/dwvcatty/image/upload/v1790400890/Gemini_Generated_Image_b7a3agb7a3agb7a3.jpg",
    fallbackImage: "/images/banners/Gemini_Generated_Image_b7a3agb7a3agb7a3.jpg",
    altText: "স্মার্ট ইলেকট্রনিক্স ও টেক গ্যাজেটস ব্যানার - নিরাপদ ক্রয়"
  },
  {
    id: 5,
    name: "groceries_essentials",
    category: "Groceries & Food",
    dealsCategory: "Offer Zone",
    title: {
      bn: "স্বাস্থ্যসম্মত খাঁটি খাদ্য ও মুদি পণ্য - Pure Groceries & Essentials",
      en: "Healthy Groceries & Pure Essentials"
    },
    image: "https://res.cloudinary.com/dwvcatty/image/upload/v1790400892/Gemini_Generated_Image_p2tss3p2tss3p2ts.jpg",
    fallbackImage: "/images/banners/Gemini_Generated_Image_p2tss3p2tss3p2ts.jpg",
    altText: "স্বাস্থ্যসম্মত খাঁটি খাদ্য ও মুদি পণ্য ব্যানার - নিরাপদ ক্রয়"
  }
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSelectCategory,
  onExploreClick,
  onDealsClick,
  onOpenReturnPolicy,
  onOpenPrivacyPolicy,
  onOpenDeliveryPolicy
}) => {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto rotation every 6 seconds, pauses when user hovers or touches
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = BANNER_SLIDES[currentSlide];

  const handleCtaClick = (category: string) => {
    if (category && category !== "All") {
      if (onSelectCategory) {
        onSelectCategory(category);
      } else if (onExploreClick) {
        onExploreClick(category);
      }
    } else {
      if (onExploreClick) {
        onExploreClick("All");
      } else if (onSelectCategory) {
        onSelectCategory("All");
      }
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? BANNER_SLIDES.length - 1 : prev - 1));
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section className="relative overflow-hidden pt-2 pb-6 sm:pt-4 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Banner Slide Container - 100% Unaltered Banner Design */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="group relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-200/90 dark:border-zinc-800/90 bg-stone-900 shadow-xl transition-all select-none"
        >
          {/* Exact 16:9 Aspect Ratio Wrapper (1920x1080 banner format) - Zero cropping, Zero distortion */}
          <div
            className="relative w-full aspect-video overflow-hidden bg-stone-950 flex items-center justify-center cursor-pointer"
            style={{ aspectRatio: "16 / 9" }}
            onClick={() => handleCtaClick(slide.category)}
            title={language === "bn" ? `${slide.title.bn} - ক্লিক করে ব্রাউজ করুন` : `${slide.title.en} - Click to explore`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                {/* 100% Original User Banner Graphic without any filters, darkening or modification */}
                <img
                  src={slide.image}
                  alt={slide.altText}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallbackTried && slide.fallbackImage) {
                      target.dataset.fallbackTried = "true";
                      target.src = slide.fallbackImage;
                    }
                  }}
                  className="w-full h-full object-cover block"
                  loading="eager"
                  decoding="async"
                />
              </motion.div>
            </AnimatePresence>

            {/* Slide Navigation Left/Right Arrows - visible on desktop hover, touchable on mobile */}
            <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-2 sm:px-4 pointer-events-none">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="pointer-events-auto p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-80 sm:opacity-0 sm:group-hover:opacity-100 shadow-lg"
                aria-label="Previous banner"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                className="pointer-events-auto p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-80 sm:opacity-0 sm:group-hover:opacity-100 shadow-lg"
                aria-label="Next banner"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Bottom Slide Indicator Pills - subtle and positioned cleanly */}
            <div className="absolute bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 pointer-events-auto">
              {BANNER_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(i);
                  }}
                  className={`h-1.5 sm:h-2 rounded-full transition-all cursor-pointer ${
                    currentSlide === i
                      ? "w-5 sm:w-6 bg-emerald-400 shadow-xs"
                      : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/75"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Value Proposition Highlights Bar */}
        <div className="mt-4 sm:mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div
            onClick={onOpenDeliveryPolicy}
            role="button"
            tabIndex={0}
            className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-amber-500/50 dark:hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {language === "bn" ? "সারা দেশে দ্রুত ডেলিভারি" : "Fast Nationwide Delivery"}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {language === "bn" ? "২–৫ কার্যদিবস • পলিসি দেখুন" : "2–5 business days • View policy"}
              </p>
            </div>
          </div>

          <div
            onClick={onOpenPrivacyPolicy}
            role="button"
            tabIndex={0}
            className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-blue-500/50 dark:hover:border-blue-500/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {language === "bn" ? "১০০% আসল ও নিরাপদ পণ্য" : "100% Genuine & Safe"}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {language === "bn" ? "তথ্য সুরক্ষা ও গোপনীয়তা নীতি দেখুন" : "Strict data & quality protection"}
              </p>
            </div>
          </div>

          <div
            onClick={onOpenReturnPolicy}
            role="button"
            tabIndex={0}
            className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {language === "bn" ? "সহজ রিটার্ন পলিসি" : "Easy 7-Day Returns"}
                </p>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  ৭ দিন
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {language === "bn" ? "৭ দিনের নির্ভরযোগ্য এক্সচেঞ্জ সুবিধা (পলিসি দেখুন)" : "Hassle-free replacement guarantee"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {language === "bn" ? "২৪/৭ কাস্টমার সাপোর্ট" : "24/7 Customer Support"}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {language === "bn" ? "যেকোনো তথ্যে হোয়াটসঅ্যাপ হেল্পলাইন" : "Direct WhatsApp assistance"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
