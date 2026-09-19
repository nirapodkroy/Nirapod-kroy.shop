import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
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
  Home
} from "lucide-react";
import {
  GROCERIES_PARENT,
  GROCERY_SUBCATEGORIES,
  isGrocerySubcategory,
  isGroceryRelatedCategory
} from "../data/categories";

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
  const { itemCount, setIsCartOpen, subtotal } = useCart();
  const { currentUser, logoutCustomer, setIsAuthModalOpen, setAuthModalTab, setIsProfileModalOpen, setIsAdminModalOpen } = useAuth();
  const { language, setLanguage, toggleLanguage, t, getCategoryName, formatPrice } = useLanguage();
  const { addToast } = useToast();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isSearchCatDropdownOpen, setIsSearchCatDropdownOpen] = useState(false);
  const [tickerItems, setTickerItems] = useState<OrderTickerItem[]>([]);
  const [currentTickerIdx, setCurrentTickerIdx] = useState(0);

  // Secret Admin Trigger for Mobile & Desktop search bar:
  // User can type or search :86681134Tadminpanelopennow (with or without colon/spaces)
  const handleSearchInput = (val: string) => {
    const cleanVal = val.trim().toLowerCase();
    const normalized = cleanVal.replace(/^[:\s]+/, "");
    if (
      normalized === "86681134tadminpanelopennow" ||
      cleanVal.includes("86681134tadminpanelopennow") ||
      val.includes("86681134Tadminpanelopennow")
    ) {
      setSearchQuery("");
      setIsAdminModalOpen(true);
      addToast("অ্যাডমিন প্যানেল সক্রিয় হয়েছে (Admin Console Activated)", "info");
      return;
    }
    setSearchQuery(val);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const cleanVal = searchQuery.trim().toLowerCase();
      const normalized = cleanVal.replace(/^[:\s]+/, "");
      if (
        normalized === "86681134tadminpanelopennow" ||
        cleanVal.includes("86681134tadminpanelopennow") ||
        searchQuery.includes("86681134Tadminpanelopennow")
      ) {
        e.preventDefault();
        setSearchQuery("");
        setIsAdminModalOpen(true);
        addToast("অ্যাডমিন প্যানেল সক্রিয় হয়েছে (Admin Console Activated)", "info");
        return;
      }
      const catalog = document.getElementById("catalog-section");
      if (catalog) catalog.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchSubmit = () => {
    const cleanVal = searchQuery.trim().toLowerCase();
    const normalized = cleanVal.replace(/^[:\s]+/, "");
    if (
      normalized === "86681134tadminpanelopennow" ||
      cleanVal.includes("86681134tadminpanelopennow") ||
      searchQuery.includes("86681134Tadminpanelopennow")
    ) {
      setSearchQuery("");
      setIsAdminModalOpen(true);
      addToast("অ্যাডমিন প্যানেল সক্রিয় হয়েছে (Admin Console Activated)", "info");
      return;
    }
    const catalog = document.getElementById("catalog-section");
    if (catalog) catalog.scrollIntoView({ behavior: "smooth" });
  };

  // Category navigation refs
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const searchCatDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Desktop search shortcut listener (Cmd/Ctrl + K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    if (c === "groceries & food" || c === "groceries" || c === "grocery") return lang === "bn" ? "মুদি ও খাদ্য (Groceries & Food)" : "Groceries & Food";
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
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
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
            <div className="flex-1 max-w-2xl mx-2 hidden lg:flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  id="main-header-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={language === "bn" ? "পণ্য খুঁজুন... (Search in...)" : "Search in..."}
                  className="w-full pl-5 pr-20 py-2.5 bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-full text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all shadow-inner"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full cursor-pointer"
                      title="Clear search"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-200/70 dark:bg-zinc-700/70 rounded border border-zinc-300/60 dark:border-zinc-600/60 select-none">
                      ⌘K
                    </kbd>
                  )}
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="p-1 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    aria-label="Search"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
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

                    {/* Offer Zone in Search Dropdown */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCategoryClick("Offer Zone");
                        setIsSearchCatDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                        selectedCategory.toLowerCase() === "offer zone" || selectedCategory.toLowerCase() === "offer-zone"
                          ? "bg-amber-500 text-zinc-950 font-bold"
                          : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      }`}
                    >
                      <span>{getCategoryDropdownLabel("Offer Zone", language)}</span>
                      {(selectedCategory.toLowerCase() === "offer zone" || selectedCategory.toLowerCase() === "offer-zone") && <span className="text-[10px]">✓</span>}
                    </button>

                    {/* Groceries & Food with 8 Subcategories */}
                    <div className="border-y border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 py-1 my-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleCategoryClick(GROCERIES_PARENT);
                          setIsSearchCatDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                          selectedCategory.toLowerCase() === GROCERIES_PARENT.toLowerCase()
                            ? "bg-emerald-600 text-white"
                            : "text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40"
                        }`}
                      >
                        <span>🛒 {getCategoryDropdownLabel(GROCERIES_PARENT, language)}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                          {language === "bn" ? "৮ উপ-ক্যাটাগরি" : "8 Subcategories"}
                        </span>
                      </button>

                      <div className="pl-6 pr-2 py-0.5 space-y-0.5">
                        {GROCERY_SUBCATEGORIES.map((sub) => {
                          const isSubSelected = selectedCategory.toLowerCase() === sub.toLowerCase();
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => {
                                handleCategoryClick(sub);
                                setIsSearchCatDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                                isSubSelected
                                  ? "bg-emerald-600 text-white font-bold"
                                  : "text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 hover:text-emerald-600 font-medium"
                              }`}
                            >
                              <span>• {getCategoryDropdownLabel(sub, language)}</span>
                              {isSubSelected && <span className="text-[10px]">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Other Categories */}
                    {categories
                      .filter(c => c !== "All" && c !== "Offer Zone" && c !== "Groceries" && c !== GROCERIES_PARENT && !isGrocerySubcategory(c))
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

            {/* Right: Actions */}
            {/* 1. PC & Mac Desktop View (Full original actions: About Us, Track Order, Sign In, Wishlist, Cart, More) */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-4 shrink-0">
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
                className="flex flex-col items-center justify-center p-1.5 px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer"
                title={language === "bn" ? "আমাদের সম্পর্কে" : "About Us"}
              >
                <div className="relative">
                  <Info className="w-5 h-5 text-zinc-700 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                </div>
                <span className="text-[11px] font-semibold mt-0.5 tracking-tight whitespace-nowrap">
                  {language === "bn" ? "আমাদের সম্পর্কে" : "About Us"}
                </span>
              </button>

              {/* 1. Track Order */}
              <button
                type="button"
                onClick={onOpenTrackOrder}
                className="flex flex-col items-center justify-center p-1.5 px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer"
                title="Track your order"
              >
                <div className="relative">
                  <MapPin className="w-5 h-5 text-zinc-700 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <span className="text-[11px] font-semibold mt-0.5 tracking-tight whitespace-nowrap">
                  {language === "bn" ? "অর্ডার ট্র্যাক" : "Track Order"}
                </span>
              </button>

              {/* 2. Sign In / Profile */}
              <div className="relative">
                {currentUser ? (
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(prev => !prev)}
                    className="flex flex-col items-center justify-center p-1.5 px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[11px] font-semibold mt-0.5 max-w-[65px] truncate">
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
                    className="flex flex-col items-center justify-center p-1.5 px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer"
                    title="Sign in to your account"
                  >
                    <User className="w-5 h-5 text-zinc-700 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                    <span className="text-[11px] font-semibold mt-0.5 tracking-tight whitespace-nowrap">
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
                className="flex flex-col items-center justify-center p-1.5 px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer relative"
                title="Your Wishlist"
              >
                <div className="relative">
                  <Heart className="w-5 h-5 text-zinc-700 dark:text-zinc-200 group-hover:text-rose-500 transition-colors" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold mt-0.5 tracking-tight whitespace-nowrap">
                  {language === "bn" ? "উইশলিস্ট" : "Wishlist"}
                </span>
              </button>

              {/* 4. Cart */}
              <button
                type="button"
                id="header-cart-btn"
                onClick={() => setIsCartOpen(true)}
                className="flex flex-col items-center justify-center p-1.5 px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer relative"
                title="View Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-zinc-700 dark:text-zinc-200 group-hover:text-emerald-600 transition-colors" />
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
                    {itemCount}
                  </span>
                </div>
                <span className="text-[11px] font-semibold mt-0.5 tracking-tight whitespace-nowrap">
                  {language === "bn" ? "কার্ট" : "Cart"}
                </span>
              </button>

              {/* 5. More Menu */}
              <button
                type="button"
                onClick={() => setIsMoreOpen(true)}
                className="flex flex-col items-center justify-center p-1.5 px-2 rounded-xl text-zinc-700 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group cursor-pointer"
                title="More Options"
              >
                <Menu className="w-5 h-5 text-zinc-700 dark:text-zinc-200 group-hover:text-emerald-600 transition-colors" />
                <span className="text-[11px] font-semibold mt-0.5 tracking-tight whitespace-nowrap">
                  {language === "bn" ? "আরও" : "More"}
                </span>
              </button>
            </div>

            {/* 2. Phone & Tablet View: ONLY Login Bar & 3-Line Menu (About Us and all else consolidated into 3-line menu) */}
            <div className="flex lg:hidden items-center gap-2 sm:gap-3 shrink-0">
              {/* Login Bar */}
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                  title={currentUser.name}
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-extrabold shadow-2xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[70px] sm:max-w-[100px] truncate">{currentUser.name.split(" ")[0]}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab("signin");
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs shadow-emerald-600/20"
                  title={language === "bn" ? "লগইন করুন" : "Sign In"}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{language === "bn" ? "লগইন" : "Login"}</span>
                </button>
              )}

              {/* 3-Line Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setIsMoreOpen(true)}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title={language === "bn" ? "সকল মেনু (3-Line)" : "All Menu (3-Line)"}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Compact, User-Friendly Search Bar (Phone & Tablet only: lg:hidden) */}
          <div className="pb-2.5 pt-0.5 lg:hidden">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                placeholder={language === "bn" ? "পণ্য খুঁজুন... (Search products...)" : "Search products..."}
                className="w-full pl-9.5 pr-14 py-2 bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-200/90 dark:border-zinc-700/80 rounded-full text-[14px] sm:text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 shadow-inner transition-all"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="p-1 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Bar: Dark Green / Teal Bar (Visible only on PC/Mac desktop, hidden on Phone & Tablet as requested) */}
      <div className="hidden lg:block bg-[#0b2923] text-white border-b border-[#071f1a] relative z-40 overflow-visible">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative overflow-visible flex items-center gap-1 sm:gap-2">
          {/* 1. STABLE PINNED HOME BUTTON - Outside scroll container, ALWAYS stays in place and never moves */}
          <div className="shrink-0 flex items-center">
            <button
              type="button"
              id="header-subnav-home-btn"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory === "All" && !searchQuery
                  ? "bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400/40"
                  : "text-zinc-200 hover:text-white hover:bg-white/10"
              }`}
              title={language === "bn" ? "হোম পেজ ও সকল পণ্য" : "Home & All Products"}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{language === "bn" ? "হোম" : "Home"}</span>
            </button>
            <div className="h-4 w-px bg-white/20 ml-1.5 mr-0.5 hidden sm:block" />
          </div>

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

          {/* Horizontally scrollable category list (Categories scroll smoothly, while Home stays fixed!) */}
          <div
            ref={categoryScrollRef}
            className="flex items-center gap-1.5 sm:gap-2 py-2 overflow-x-auto category-scrollbar scroll-smooth flex-1 select-none"
          >
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

            {/* 3. Main Categories in scroll track (Excluding subcategories so scrollbar remains tidy) */}
            {categories
              .filter((c) => c !== "All" && c !== "Offer Zone" && c !== "Groceries" && !isGrocerySubcategory(c))
              .map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase() || (cat === GROCERIES_PARENT && isGroceryRelatedCategory(selectedCategory));
                const isGrocery = cat === GROCERIES_PARENT || cat.toLowerCase() === "groceries & food";
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-emerald-600 text-white font-bold shadow-xs ring-1 ring-emerald-400/40"
                        : isGrocery
                        ? "text-emerald-300 font-semibold hover:text-white hover:bg-white/10"
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
        </div>
      </div>

      {/* More Slide-over Drawer (Comprehensive 3-Line Menu for Phone & Tablet) */}
      {isMoreOpen && (
        <div
          onClick={() => setIsMoreOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 h-full p-5 sm:p-6 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col justify-between overflow-y-auto cursor-default"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white leading-none">
                      {language === "bn" ? "নিরাপদ ক্রয় মেনু" : "Nirapod Menu"}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                      {language === "bn" ? "সকল সার্ভিস ও অপশন" : "All Services & Options"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title={language === "bn" ? "বন্ধ করুন" : "Close"}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Account / Sign In Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80">
                {currentUser ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-extrabold shadow-xs shrink-0">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {currentUser.phone || currentUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>{language === "bn" ? "আমার অর্ডার" : "My Orders"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreOpen(false);
                          logoutCustomer();
                        }}
                        className="py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-rose-200/60 dark:border-rose-900/40"
                        title={t("logout")}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{language === "bn" ? "লগআউট" : "Logout"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">
                        {language === "bn" ? "স্বাগতম! কেনাকাটা সহজ করতে লগইন করুন" : "Welcome! Sign in for a faster shopping"}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {language === "bn" ? "অর্ডার ট্র্যাকিং ও দ্রুত ডেলিভারির সুবিধা পান" : "Track orders & get quick delivery"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        setAuthModalTab("signin");
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{language === "bn" ? "লগইন বা একাউন্ট তৈরি করুন" : "Sign In or Register"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Shopping Shortcuts (Cart & Wishlist Cards) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Cart Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-500/20 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">
                      {itemCount}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">
                    {language === "bn" ? "শপিং কার্ট" : "Cart"}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatPrice(subtotal)}
                  </p>
                </button>

                {/* Wishlist Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    if (onOpenWishlist) onOpenWishlist();
                  }}
                  className="p-3 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-500/20 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                      <Heart className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                      {wishlistCount}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">
                    {language === "bn" ? "উইশলিস্ট" : "Wishlist"}
                  </p>
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {language === "bn" ? "পছন্দের পণ্য" : "Saved Items"}
                  </p>
                </button>
              </div>

              {/* Primary Services (About Us & Track Order) */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    if (onOpenTrackOrder) onOpenTrackOrder();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer border border-amber-500/20"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{language === "bn" ? "অর্ডার ট্র্যাক করুন (Track Order)" : "Track Your Order"}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-500/70" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    const footerSection = document.getElementById("about-us-section");
                    if (footerSection) {
                      footerSection.scrollIntoView({ behavior: "smooth" });
                    } else {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer border border-zinc-200/80 dark:border-zinc-700/80"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{language === "bn" ? "আমাদের সম্পর্কে (About Us)" : "About Nirapod Kroy"}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              {/* Categories Navigation in Drawer */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                  {language === "bn" ? "পণ্য ক্যাটাগরি ব্রাউজ করুন" : "Browse Categories"}
                </span>
                <div className="mt-1.5 space-y-1 max-h-56 overflow-y-auto pr-1">
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
                    <span className="flex items-center gap-2">
                      <Home className="w-3.5 h-3.5" />
                      <span>{language === "bn" ? "সকল পণ্য (Home)" : "All Products"}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </button>

                  {/* Groceries & Food with 8 Subcategories */}
                  <div className="space-y-1 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 p-1.5 border border-emerald-500/20">
                    <button
                      onClick={() => {
                        handleCategoryClick(GROCERIES_PARENT);
                        setIsMoreOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-lg text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        selectedCategory.toLowerCase() === GROCERIES_PARENT.toLowerCase()
                          ? "bg-emerald-600 text-white"
                          : "text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>🛒</span>
                        <span>{getCategoryName(GROCERIES_PARENT)}</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">8</span>
                    </button>
                    <div className="pl-4 pr-1 py-0.5 space-y-1 border-l-2 border-emerald-500/30 ml-2">
                      {GROCERY_SUBCATEGORIES.map((sub) => {
                        const isSubActive = selectedCategory.toLowerCase() === sub.toLowerCase();
                        return (
                          <button
                            key={sub}
                            onClick={() => {
                              handleCategoryClick(sub);
                              setIsMoreOpen(false);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                              isSubActive
                                ? "bg-emerald-600 text-white font-bold shadow-xs"
                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-emerald-600 font-medium"
                            }`}
                          >
                            <span>• {getCategoryName(sub)}</span>
                            {isSubActive && <span className="text-[10px]">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {categories
                    .filter((c) => c !== "All" && c !== "Groceries" && c !== GROCERIES_PARENT && !isGrocerySubcategory(c))
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

              {/* Preferences & Mode Switchers */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
                {/* Language Switcher */}
                <button
                  onClick={toggleLanguage}
                  className="px-2.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{language === "bn" ? "ভাষা" : "Lang"}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400">
                    {language === "bn" ? "বাংলা" : "ENG"}
                  </span>
                </button>

                {/* Theme Switcher */}
                <button
                  onClick={toggleTheme}
                  className="px-2.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-1.5">
                    {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />}
                    <span>{language === "bn" ? "মোড" : "Mode"}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                    {theme === "dark" ? (language === "bn" ? "ডার্ক" : "Dark") : (language === "bn" ? "লাইট" : "Light")}
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom Support Info & Close Button */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs">
                <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === "bn" ? "হেল্পলাইন: 01786681134" : "Helpline: 01786681134"}</span>
                </p>
                <p className="text-zinc-600 dark:text-zinc-400 mt-0.5 text-[11px]">
                  <a href="tel:01786681134" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                    01786681134
                  </a>
                  {" "}
                  {language === "bn" ? "(কল বা হোয়াটসঅ্যাপ করুন)" : "(Call or WhatsApp)"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
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
