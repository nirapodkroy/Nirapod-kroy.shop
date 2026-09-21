import React, { useState, useEffect } from "react";
import { ArrowRight, ShieldCheck, Truck, Clock, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";

interface HeroSectionProps {
  onSelectCategory?: (category: string) => void;
  onExploreClick?: (category?: string) => void;
  onDealsClick?: (dealsCategory?: string) => void;
  onOpenReturnPolicy?: () => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenDeliveryPolicy?: () => void;
}

const SLIDES = [
  {
    id: 1,
    category: "Electronics",
    badge: { bn: "অফিশিয়াল ওয়ারেন্টি", en: "Official Warranty" },
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    title: { bn: "স্মার্ট ইলেকট্রনিক্স ও টেক গ্যাজেটস", en: "Smart Tech & Electronics" },
    highlight: { bn: "Gadgets & Accessories", en: "Gadgets & Accessories" },
    subtitle: {
      bn: "স্মার্টওয়াচ, প্রিমিয়াম নয়েজ ক্যানসেলিং হেডফোন, মেকানিক্যাল কীবোর্ড এবং হাই-স্পিড ফাস্ট চার্জার।",
      en: "Smartwatches, active noise-cancelling headphones, mechanical keyboards, and 65W fast chargers."
    },
    discountBadge: { bn: "ব্র্যান্ড ওয়ারেন্টি সহ", en: "Brand Warranty Included" },
    cta: { bn: "ইলেকট্রনিক্স এক্সপ্লোর করুন", en: "Explore Electronics" },
    dealsCta: { bn: "হট ডিলস দেখুন", en: "View Hot Deals" },
    dealsCategory: "Offer Zone",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85",
    accent: "from-indigo-500/25 to-sky-500/10"
  },
  {
    id: 2,
    category: "All",
    badge: { bn: "নিরাপদ কেনাকাটা", en: "Safe & Trusted" },
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    title: { bn: "সব ধরনের পণ্যের বিশ্বস্ত বাজার", en: "Your Ultimate Everything Store" },
    highlight: { bn: "Nirapod Kroy (নিরাপদ ক্রয়)", en: "Nirapod Kroy Marketplace" },
    subtitle: {
      bn: "মুদি ও অর্গানিক খাদ্যপণ্য, লেটেস্ট গ্যাজেট, পোশাক, রূপচর্চা থেকে গৃহস্থালি সামগ্রী — আসল পণ্যের ১০০% নিশ্চয়তা।",
      en: "From pure organic groceries and smart gadgets to fashion apparel and home essentials — 100% genuine quality guarantee."
    },
    discountBadge: { bn: "ক্যাশ অন ডেলিভারি সুবিধা", en: "Cash on Delivery Available" },
    cta: { bn: "সব পণ্য দেখুন (Shop All)", en: "Explore All Products" },
    dealsCta: { bn: "হট ডিলস দেখুন", en: "View Hot Deals" },
    dealsCategory: "Offer Zone",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85",
    accent: "from-emerald-500/25 to-teal-500/10"
  },
  {
    id: 3,
    category: "Groceries & Food",
    badge: { bn: "১০০% খাঁটি ও অর্গানিক", en: "100% Pure & Organic" },
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    title: { bn: "স্বাস্থ্যসম্মত খাঁটি খাদ্য ও মুদি পণ্য", en: "Healthy Groceries & Pure Food" },
    highlight: { bn: "Pure Groceries & Essentials", en: "Farm-Fresh Essentials" },
    subtitle: {
      bn: "ঘানি-ভাঙা খাঁটি সরিষার তেল, সুন্দরবনের প্রাকৃতিক চাকের মধু, সুগন্ধি চিনিগুঁড়া চাল ও আসল গাওয়া ঘি।",
      en: "Cold-pressed mustard oil, natural Sundarbans honey, aromatic Chinigura rice, and pure artisan ghee."
    },
    discountBadge: { bn: "ন্যায্য মূল্য ও টাটকা", en: "Fresh & Fair Price" },
    cta: { bn: "মুদি পণ্য দেখুন", en: "Browse Groceries" },
    dealsCta: { bn: "হট ডিলস দেখুন", en: "View Hot Deals" },
    dealsCategory: "Offer Zone",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=85",
    accent: "from-amber-500/25 to-orange-500/10"
  },
  {
    id: 4,
    category: "Fashion",
    badge: { bn: "প্রিমিয়াম কোয়ালিটি", en: "Premium Quality" },
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    title: { bn: "স্টাইলিশ ফ্যাশন, পোশাক ও লাইফস্টাইল", en: "Stylish Fashion & Lifestyle" },
    highlight: { bn: "Fashion & Lifestyle Wear", en: "Apparel & Accessories" },
    subtitle: {
      bn: "আভিজাত্যপূর্ণ কটন পাঞ্জাবি, ঐতিহ্যবাহী সুতি শাড়ি, জেনুইন লেদার ওয়ালেট ও আরামদায়ক ক্যাজুয়াল পোশাক।",
      en: "Artisan cotton Panjabi, heritage Tangail cotton saree, genuine leather wallets, and casual comfort."
    },
    discountBadge: { bn: "নতুন কালেকশন ২০২৬", en: "New Collection 2026" },
    cta: { bn: "ফ্যাশন কালেকশন", en: "Shop Fashion" },
    dealsCta: { bn: "হট ডিলস দেখুন", en: "View Hot Deals" },
    dealsCategory: "Offer Zone",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85",
    accent: "from-rose-500/25 to-pink-500/10"
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

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

  const handleDealsClick = (dealsCategory: string = "Offer Zone") => {
    if (onSelectCategory) {
      onSelectCategory(dealsCategory);
    } else if (onDealsClick) {
      onDealsClick(dealsCategory);
    }
  };

  return (
    <section className="relative overflow-hidden pt-4 pb-8 sm:pt-6 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Banner Slide Container */}
        <div className="relative rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-900 text-white min-h-[440px] sm:min-h-[500px] flex items-center shadow-xl">
          {/* Background Image with Overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 z-0"
            >
              <img
                src={slide.image}
                alt={slide.title[language]}
                className="w-full h-full object-cover object-center opacity-40 dark:opacity-30 filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
              <div className={`absolute inset-0 bg-gradient-to-t ${slide.accent} pointer-events-none`} />
            </motion.div>
          </AnimatePresence>

          {/* Slide Content */}
          <div className="relative z-10 max-w-2xl px-6 sm:px-12 py-12 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <button
                type="button"
                onClick={() => handleCtaClick(slide.category)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md transition-all hover:scale-105 cursor-pointer ${slide.badgeColor}`}
                title={language === "bn" ? `${slide.title.bn} দেখুন` : `View ${slide.title.en}`}
              >
                {slide.badge[language]}
              </button>
              <button
                type="button"
                onClick={() => handleDealsClick(slide.dealsCategory || "Offer Zone")}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:bg-amber-400/30 transition-all hover:scale-105 cursor-pointer"
                title={language === "bn" ? "হট ডিলস দেখুন" : "View Hot Deals"}
              >
                {slide.discountBadge[language]}
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-display text-white leading-tight">
              {slide.title[language]}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
                {slide.highlight[language]}
              </span>
            </h1>

            <p className="mt-4 text-zinc-300 text-sm sm:text-base leading-relaxed line-clamp-3">
              {slide.subtitle[language]}
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => handleCtaClick(slide.category)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {slide.cta[language]}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDealsClick(slide.dealsCategory || "Offer Zone")}
                className="inline-flex items-center px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md border border-white/20 transition-colors cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {slide.dealsCta ? slide.dealsCta[language] : (language === "bn" ? "হট ডিলস দেখুন" : "View Hot Deals")}
              </button>
            </div>
          </div>

          {/* Slide Navigation Controls */}
          <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2">
            <button
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1))}
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlide === i ? "w-6 bg-emerald-400" : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Value Proposition Highlights Bar */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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

