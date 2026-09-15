import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { OrderTickerItem } from "../types";
import {
  Search,
  ShoppingCart,
  MapPin,
  User,
  Heart,
  Menu,
  ChevronDown,
  X,
  Sun,
  Moon,
  Globe,
  Package,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Zap,
  PhoneCall,
  FileText,
  BadgePercent,
  Info,
  Home,
  Lock
} from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: string[];
  onOpenTrackOrder?: () => void;
  onOpenWishlist?: () => void;
  wishlistCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  onOpenTrackOrder,
  onOpenWishlist,
  wishlistCount = 0
}) => {
  const { theme, toggleTheme } = useTheme();
  const { itemCount, setIsCartOpen } = useCart();
  const { currentUser, logoutCustomer, setIsAuthModalOpen, setAuthModalTab, setIsProfileModalOpen } = useAuth();
  const { language, setLanguage, toggleLanguage, t, getCategoryName } = useLanguage();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isAroDropdownOpen, setIsAroDropdownOpen] = useState(false);
  const [isSearchCatDropdownOpen, setIsSearchCatDropdownOpen] = useState(false);
  const [tickerItems, setTickerItems] = useState<OrderTickerItem[]>([]);
  const [currentTickerIdx, setCurrentTickerIdx] = useState(0);

  // Category navigation refs
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const aroDropdownRef = useRef<HTMLDivElement>(null);
  const searchCatDropdownRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const amount = 240;
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth"
      });
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (aroDropdownRef.current && !aroDropdownRef.current.contains(e.target as Node)) {
        setIsAroDropdownOpen(false);
      }
      if (searchCatDropdownRef.current && !searchCatDropdownRef.current.contains(e.target as Node)) {
        setIsSearchCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Category label formatter matching screenshot 1 (e.g. সব পণ্য (All), মুদি ও খাদ্য (Groceries))
  const getCategoryDropdownLabel = (cat: string, lang: string): string => {
    const c = cat.toLowerCase().trim();
    if (c === "all") return lang === "bn" ? "সব পণ্য (All)" : "All Products";
    if (c === "offer zone" || c === "offers" || c === "offer-zone" || c === "offer") return lang === "bn" ? "🔥 অফার জোন (Offer Zone)" : "🔥 Offer Zone";
    if (c === "groceries") return lang === "bn" ? "মুদি ও খাদ্য (Groceries)" : "Groceries";
    if (c === "electronics") return lang === "bn" ? "ইলেকট্রনিক্স (Electronics)" : "Electronics";
    if (c === "fashion") return lang === "bn" ? "পোশাক ও ফ্যাশন (Fashion)" : "Fashion";
    if (c === "health & beauty" || c === "beauty") return lang === "bn" ? "রূপচর্চা ও স্বাস্থ্য (Beauty)" : "Health & Beauty";
    if (c === "home & kitchen" || c === "home") return lang === "bn" ? "গৃহস্থালি ও কিচেন (Home)" : "Home & Kitchen";
    if (c === "baby & kids" || c === "kids" || c === "baby") return lang === "bn" ? "শিশু ও খেলনা (Kids)" : "Kids";
    if (c === "sports") return lang === "bn" ? "খেলাধুলা ও ফিটনেস (Sports)" : "Sports";
    if (c === "books") return lang === "bn" ? "বই ও স্টেশনারি (Books)" : "Books";
    if (c === "honey") return lang === "bn" ? "মধু ও সুইটনার (Honey)" : "Honey";
    if (c === "oil & ghee" || c === "oil" || c === "ghee") return lang === "bn" ? "তেল ও ঘি (Oil & Ghee)" : "Oil & Ghee";
    if (c === "dates") return lang === "bn" ? "প্রিমিয়াম খেজুর (Dates)" : "Dates";
    if (c === "spices") return lang === "bn" ? "খাঁটি মশলা (Spices)" : "Spices";
    if (c === "nuts & seeds" || c === "nuts") return lang === "bn" ? "বাদাম ও বীজ (Nuts & Seeds)" : "Nuts & Seeds";
    if (c === "beverage" || c === "tea") return lang === "bn" ? "চা ও পানীয় (Beverage)" : "Beverage";
    if (c === "rice") return lang === "bn" ? "প্রিমিয়াম চাল (Rice)" : "Rice";
    if (c === "flours & lentils" || c === "lentils") return lang === "bn" ? "আটা ও ডাল (Flours & Lentils)" : "Flours & Lentils";
    return getCategoryName(cat);
  };

  // Fetch recent order ticker for privacy-friendly social proof
  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await fetch("/api/orders/recent-ticker");
        if (res.ok) {
          const data = await res.json();
          if (data.ticker && data.ticker.length > 0) {
            setTickerItems(data.ticker);
          }
        }
      } catch {
        setTickerItems([
          { id: "1", customerName: "Tariq P.", city: "Dhaka", itemName: "Apex ANC Headphones", timeAgo: "2m ago" },
          { id: "2", customerName: "Ayesha R.", city: "Gulshan", itemName: "Natural Organic Honey", timeAgo: "10m ago" }
        ]);
      }
    };

    fetchTicker();
    const interval = setInterval(fetchTicker, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tickerItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentTickerIdx(prev => (prev + 1) % tickerItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [tickerItems.length]);

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setSearchQuery("");
    const catalogEl = document.getElementById("catalog-section");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full shadow-xs">
      {/* Top Ticker & Language/Theme utility bar */}
      <div className="bg-[#121b18] text-white text-[11px] sm:text-xs py-1.5 px-4 border-b border-emerald-950/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Order Ticker */}
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-bold shrink-0">
              {language === "bn" ? "লাইভ অর্ডার:" : "Live Orders:"}
            </span>
            {tickerItems.length > 0 && (
              <span className="text-zinc-300 font-medium truncate">
                <span className="text-white font-semibold">{tickerItems[currentTickerIdx]?.customerName}</span> (
                <span className="text-zinc-400">{tickerItems[currentTickerIdx]?.city}</span>) -{" "}
                <span className="text-emerald-300 font-medium">
                  {tickerItems[currentTickerIdx]?.itemName}
                </span>{" "}
                <span className="text-zinc-400 text-[10px]">({tickerItems[currentTickerIdx]?.timeAgo})</span>
              </span>
            )}
          </div>

          {/* Right Utility: Hotline, Language & Theme */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:01786681134"
              className="hidden lg:flex items-center gap-1.5 text-zinc-300 hover:text-emerald-400 transition-colors text-[11px] font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>হেল্পলাইন: 01786681134</span>
            </a>

            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium border border-zinc-700/60 transition-colors cursor-pointer"
              title="Switch Language"
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>{language === "bn" ? "English" : "বাংলা"}</span>
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1 rounded-md text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
              title={theme === "dark" ? "Light Mode" : "Dark Mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20 gap-3 sm:gap-6">
            {/* Left: Original Nirapod Kroy Logo with Emerald Shield */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleCategoryClick("All");
              }}
              className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
              title="Nirapod Kroy - Home"
            >
              {/* Original Emerald Shield Logo Badge */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>

              {/* Original Brand Typography */}
              <div className="flex flex-col leading-none">
                <div className="flex items-baseline gap-1">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-white uppercase font-display">
                    {language === "bn" ? "নিরাপদ" : "NIRAPOD"}
                  </span>
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-emerald-600 dark:text-emerald-400 uppercase font-display">
                    {language === "bn" ? "ক্রয়" : "KROY"}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400">®</span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider">
                  {language === "bn" ? "১০০% আসল ও নিরাপদ পণ্য" : "100% GENUINE & SAFE STORE"}
                </span>
              </div>
            </a>

            {/* Center: Search Bar with Category Dropdown attached (Matching Screenshot 1) */}
            <div className="flex-1 max-w-2xl mx-2 hidden md:flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="main-header-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === "bn" ? "পণ্য খুঁজুন... (Search in...)" : "Search in..."}
                  className="w-full pl-5 pr-11 py-2.5 bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-full text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => {
                    const catalog = document.getElementById("catalog-section");
                    if (catalog) catalog.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Category Dropdown Pill beside Search (Screenshot 1) */}
              <div className="relative shrink-0" ref={searchCatDropdownRef}>
                <button
                  type="button"
                  id="search-category-dropdown-btn"
                  onClick={() => setIsSearchCatDropdownOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-100/90 dark:bg-zinc-800/80 border transition-all cursor-pointer ${
                    isSearchCatDropdownOpen
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20 bg-white dark:bg-zinc-900"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-emerald-500/50"
                  }`}
                  aria-expanded={isSearchCatDropdownOpen}
                >
                  <span className="max-w-[130px] truncate">{getCategoryDropdownLabel(selectedCategory, language)}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isSearchCatDropdownOpen ? "rotate-180 text-emerald-500" : ""}`} />
                </button>

                {/* Dropdown Menu (Matching Screenshot 1) */}
                {isSearchCatDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 animate-fadeIn max-h-84 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        handleCategoryClick("All");
                        setIsSearchCatDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                        selectedCategory === "All"
                          ? "bg-blue-600 text-white font-bold"
                          : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span>{getCategoryDropdownLabel("All", language)}</span>
                      {selectedCategory === "All" && <span className="text-[10px]">✓</span>}
                    </button>

                    {categories
                      .filter(c => c !== "All")
                      .map(cat => {
                        const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              handleCategoryClick(cat);
                              setIsSearchCatDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                              isSelected
                                ? "bg-blue-600 text-white font-bold"
                                : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            }`}
                          >
                            <span>{getCategoryDropdownLabel(cat, language)}</span>
                            {isSelected && <span className="text-[10px]">✓</span>}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Header Action Icons (About Us, Track Order, Sign In, Wishlist, Cart, More) */}
            <div className="flex items-center gap-1 sm:gap-4 lg:gap-5 shrink-0">
              {/* About Us (আমাদের সম্পর্কে) */}
              <button
                type="button"
                id="header-about-us-btn"
                onClick={() => {
                  const footerSection = document.getElementById("about-us-section");
                  if (footerSection) {
                    footerSection.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                  }
                }}
                className="flex flex-col items-center justify-center p-1.5 sm:px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer"
                title={language === "bn" ? "আমাদের সম্পর্কে" : "About Us"}
              >
                <div className="relative">
                  <Info className="w-5 h-5 sm:w-5 sm:h-5 text-zinc-700 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold mt-0.5 tracking-tight whitespace-nowrap">
                  {language === "bn" ? "আমাদের সম্পর্কে" : "About Us"}
                </span>
              </button>

              {/* 1. Track Order */}
              <button
                type="button"
                onClick={onOpenTrackOrder}
                className="flex flex-col items-center justify-center p-1.5 sm:px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer"
                title="Track your order"
              >
                <div className="relative">
                  <MapPin className="w-5 h-5 sm:w-5 sm:h-5 text-zinc-700 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold mt-0.5 tracking-tight whitespace-nowrap">
                  {language === "bn" ? "অর্ডার ট্র্যাক" : "Track Order"}
                </span>
              </button>

              {/* 2. Sign In / Profile */}
              <div className="relative">
                {currentUser ? (
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(prev => !prev)}
                    className="flex flex-col items-center justify-center p-1.5 sm:px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold mt-0.5 max-w-[65px] truncate">
                      {currentUser.name.split(" ")[0]}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalTab("signin");
                      setIsAuthModalOpen(true);
                    }}
                    className="flex flex-col items-center justify-center p-1.5 sm:px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer"
                    title="Sign in to your account"
                  >
                    <User className="w-5 h-5 sm:w-5 sm:h-5 text-zinc-700 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                    <span className="text-[10px] sm:text-[11px] font-semibold mt-0.5 tracking-tight whitespace-nowrap">
                      {language === "bn" ? "লগইন" : "Sign In"}
                    </span>
                  </button>
                )}

                {/* User Dropdown */}
                {userDropdownOpen && currentUser && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-fadeIn"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs text-zinc-400">{t("signed_in_as")}</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {currentUser.name}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Package className="w-4 h-4 text-emerald-600" />
                      <span>{t("my_orders")}</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logoutCustomer();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t("logout")}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Wishlist */}
              <button
                type="button"
                onClick={onOpenWishlist}
                className="flex flex-col items-center justify-center p-1.5 sm:px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer relative"
                title="Your Wishlist"
              >
                <div className="relative">
                  <Heart className="w-5 h-5 sm:w-5 sm:h-5 text-zinc-700 dark:text-zinc-200 group-hover:text-rose-500 transition-colors" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold mt-0.5 tracking-tight whitespace-nowrap">
                  {language === "bn" ? "উইশলিস্ট" : "Wishlist"}
                </span>
              </button>

              {/* 4. Cart (with emerald circular badge count) */}
              <button
                type="button"
                id="header-cart-btn"
                onClick={() => setIsCartOpen(true)}
                className="flex flex-col items-center justify-center p-1.5 sm:px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer relative"
                title="View Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 sm:w-5 sm:h-5 text-zinc-700 dark:text-zinc-200 group-hover:text-emerald-600 transition-colors" />
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                    {itemCount}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold mt-0.5 tracking-tight whitespace-nowrap">
                  {language === "bn" ? "কার্ট" : "Cart"}
                </span>
              </button>

              {/* 5. More Menu */}
              <button
                type="button"
                onClick={() => setIsMoreOpen(true)}
                className="flex flex-col items-center justify-center p-1.5 sm:px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer"
                title="More Options"
              >
                <Menu className="w-5 h-5 sm:w-5 sm:h-5 text-zinc-700 dark:text-zinc-200 group-hover:text-emerald-600 transition-colors" />
                <span className="text-[10px] sm:text-[11px] font-semibold mt-0.5 tracking-tight whitespace-nowrap">
                  {language === "bn" ? "আরও" : "More"}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar (under logo on small screens) */}
          <div className="pb-3 md:hidden">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "bn" ? "পণ্য খুঁজুন... (Search in...)" : "Search in..."}
                className="w-full pl-4 pr-10 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Bar: Dark Green / Teal Bar (Smooth horizontal scrolling with visible category names & arrows) */}
      <div className="bg-[#0b2923] text-white border-b border-[#071f1a] relative z-40 overflow-visible">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative overflow-visible flex items-center gap-1">
          {/* Left scroll chevron for desktop & tablet */}
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer transition-colors"
            title={language === "bn" ? "বামে স্ক্রোল করুন" : "Scroll Left"}
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Horizontally scrollable category list */}
          <div
            ref={categoryScrollRef}
            className="flex items-center gap-1.5 sm:gap-2 py-2 overflow-x-auto category-scrollbar scroll-smooth flex-1 select-none"
          >
            {/* 1. Home / হোম (Homepage & All Products) */}
            <button
              type="button"
              id="header-subnav-home-btn"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory === "All" && !searchQuery
                  ? "bg-emerald-600 text-white font-bold shadow-xs ring-1 ring-emerald-400/40"
                  : "text-zinc-200 hover:text-white hover:bg-white/10"
              }`}
              title={language === "bn" ? "হোম পেজ ও সকল পণ্য" : "Home & All Products"}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{language === "bn" ? "হোম" : "Home"}</span>
            </button>

            {/* 2. Offer Zone (Navigates directly to /offer-zone page) */}
            <button
              type="button"
              id="header-subnav-offerzone-btn"
              onClick={() => {
                handleCategoryClick("Offer Zone");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory.toLowerCase() === "offer zone" || selectedCategory.toLowerCase() === "offer-zone"
                  ? "bg-amber-500 text-zinc-950 font-black shadow-md ring-2 ring-amber-300"
                  : "bg-amber-400/15 text-amber-300 hover:text-amber-200 hover:bg-amber-400/25 border border-amber-400/30"
              }`}
              title={language === "bn" ? "🔥 অফার জোন ও স্পেশাল ছাড়" : "🔥 Offer Zone & Deals"}
            >
              <BadgePercent className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === "bn" ? "অফার জোন" : "Offer Zone"}</span>
            </button>

            {/* 3. All Individual Categories Directly Visible & Clickable */}
            {categories
              .filter((c) => c !== "All" && c !== "Offer Zone")
              .map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-emerald-600 text-white font-bold shadow-xs ring-1 ring-emerald-400/40"
                        : "text-zinc-200 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{getCategoryName(cat)}</span>
                  </button>
                );
              })}
          </div>

          {/* Right scroll chevron for desktop & tablet */}
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer transition-colors"
            title={language === "bn" ? "ডানে স্ক্রোল করুন" : "Scroll Right"}
            aria-label="Scroll categories right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* 4. আরও (Aro) Dropdown - Quick Jump for ALL categories */}
          <div className="relative overflow-visible shrink-0" ref={aroDropdownRef}>
            <button
              type="button"
              id="header-subnav-aro-btn"
              onClick={() => setIsAroDropdownOpen((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                isAroDropdownOpen
                  ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-300/40"
                  : "text-zinc-200 hover:text-white hover:bg-white/10"
              }`}
              title={language === "bn" ? "সকল ক্যাটাগরি মেনু" : "All Categories Menu"}
              aria-expanded={isAroDropdownOpen}
            >
              <span>{language === "bn" ? "আরও" : "More"}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAroDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown containing ALL categories - completely unclipped and floating above hero */}
            {isAroDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 sm:w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 py-2 z-[9999] animate-fadeIn max-h-[72vh] overflow-y-auto">
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {language === "bn" ? "সকল ক্যাটাগরি" : "All Categories"}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                    {categories.length} টি
                  </span>
                </div>

                <div className="py-1">
                  {/* All Products Option */}
                  <button
                    type="button"
                    onClick={() => {
                      handleCategoryClick("All");
                      setIsAroDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      selectedCategory === "All"
                        ? "bg-emerald-600 text-white font-bold"
                        : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{getCategoryDropdownLabel("All", language)}</span>
                    {selectedCategory === "All" && <span className="text-[10px]">✓</span>}
                  </button>

                  {/* Offer Zone Option */}
                  <button
                    type="button"
                    onClick={() => {
                      handleCategoryClick("Offer Zone");
                      setIsAroDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      selectedCategory === "Offer Zone"
                        ? "bg-amber-500 text-zinc-950 font-bold"
                        : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    }`}
                  >
                    <span>{getCategoryDropdownLabel("Offer Zone", language)}</span>
                    {selectedCategory === "Offer Zone" && <span className="text-[10px]">✓</span>}
                  </button>

                  {/* All Category Items */}
                  {categories
                    .filter((c) => c !== "All" && c !== "Offer Zone")
                    .map((cat) => {
                      const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            handleCategoryClick(cat);
                            setIsAroDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white font-bold"
                              : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          }`}
                        >
                          <span>{getCategoryDropdownLabel(cat, language)}</span>
                          {isSelected && <span className="text-[10px]">✓</span>}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* More Slide-over Drawer */}
      {isMoreOpen && (
        <div
          onClick={() => setIsMoreOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 h-full p-6 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col justify-between overflow-y-auto cursor-default"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-base text-zinc-900 dark:text-white">
                    {language === "bn" ? "মেনু ও সহায়তা" : "Menu & Help"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title={language === "bn" ? "বন্ধ করুন" : "Close"}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories Navigation in Drawer */}
              <div className="py-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-3">
                  {language === "bn" ? "ক্যাটাগরি সমূহ" : "Product Categories"}
                </span>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => {
                      handleCategoryClick("All");
                      setIsMoreOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      selectedCategory === "All"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{language === "bn" ? "সকল পণ্য (Home)" : "All Products"}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  {categories
                    .filter((c) => c !== "All")
                    .map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          handleCategoryClick(cat);
                          setIsMoreOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          selectedCategory.toLowerCase() === cat.toLowerCase()
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <span>{getCategoryName(cat)}</span>
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                      </button>
                    ))}
                </div>
              </div>

              {/* Close Button right below categories (Exactly where user drew the arrow) */}
              <div className="py-2">
                <button
                  type="button"
                  id="drawer-categories-close-btn"
                  onClick={() => setIsMoreOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900/50 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>{language === "bn" ? "মেনু বন্ধ করুন (Close)" : "Close Menu"}</span>
                </button>
              </div>

              {/* Quick Services */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    const footerSection = document.getElementById("about-us-section");
                    if (footerSection) {
                      footerSection.scrollIntoView({ behavior: "smooth" });
                    } else {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Info className="w-4 h-4 text-emerald-500" />
                  <span>{language === "bn" ? "আমাদের সম্পর্কে (About Us)" : "About Us"}</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    if (onOpenTrackOrder) onOpenTrackOrder();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>{language === "bn" ? "অর্ডার ট্র্যাক করুন" : "Track Order"}</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    if (onOpenWishlist) onOpenWishlist();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>{language === "bn" ? "পছন্দের তালিকা (Wishlist)" : "Wishlist"}</span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Package className="w-4 h-4 text-emerald-500" />
                  <span>{language === "bn" ? "আমার পূর্ববর্তী অর্ডার" : "Order History"}</span>
                </button>

                {/* Theme / Mode Switcher */}
                <button
                  onClick={toggleTheme}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />}
                    <span>{language === "bn" ? "মোড পরিবর্তন (থিম)" : "Color Mode (Theme)"}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                    {theme === "dark" ? (language === "bn" ? "ডার্ক মোড" : "Dark") : (language === "bn" ? "সাদা মোড" : "Light")}
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom Support Info & Close */}
            <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs">
                <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{language === "bn" ? "হেল্পলাইন: 01786681134" : "Helpline: 01786681134"}</span>
                </p>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                  <a href="tel:01786681134" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                    01786681134
                  </a>
                  {" "}
                  {language === "bn" ? "(যেকোনো তথ্যে কল বা হোয়াটসঅ্যাপ করুন)" : "(Call or WhatsApp for any assistance)"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                <X className="w-4 h-4" />
                <span>{language === "bn" ? "মেনু বন্ধ করুন" : "Close Menu"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
