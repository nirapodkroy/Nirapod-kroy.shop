import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { OrderTickerItem } from "../types";
import {
  Search,
  ShoppingCart,
  Sun,
  Moon,
  User,
  LogOut,
  Package,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  X,
  ShieldCheck,
  Globe
} from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: string[];
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories
}) => {
  const { theme, toggleTheme } = useTheme();
  const { itemCount, setIsCartOpen } = useCart();
  const { currentUser, logoutCustomer, setIsAuthModalOpen, setAuthModalTab, setIsProfileModalOpen } = useAuth();
  const { language, setLanguage, toggleLanguage, t, getCategoryName } = useLanguage();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [tickerItems, setTickerItems] = useState<OrderTickerItem[]>([]);
  const [currentTickerIdx, setCurrentTickerIdx] = useState(0);

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
        // Fallback ticker if network delays
        setTickerItems([
          { id: "1", customerName: "Tariq P.", city: "Dhaka", itemName: "Apex ANC Headphones", timeAgo: "2m ago" },
          { id: "2", customerName: "Ayesha R.", city: "Gulshan", itemName: "Titanium Smartwatch", timeAgo: "15m ago" }
        ]);
      }
    };

    fetchTicker();
    const interval = setInterval(fetchTicker, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cycle through ticker items every 5 seconds
  useEffect(() => {
    if (tickerItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentTickerIdx(prev => (prev + 1) % tickerItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [tickerItems.length]);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 dark:bg-zinc-950/90 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors duration-200">
      {/* Top Privacy-Conscious Live Order Ticker & Language Switcher */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-white text-xs py-1.5 px-4 border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-400 font-medium shrink-0">{t("live_ticker_label")}</span>
            {tickerItems.length > 0 && (
              <span className="text-zinc-200 font-medium truncate transition-all duration-300">
                <span className="text-emerald-400 font-semibold">{tickerItems[currentTickerIdx]?.customerName}</span> from{" "}
                <span className="text-zinc-300">{tickerItems[currentTickerIdx]?.city}</span> ordered{" "}
                <span className="text-white underline decoration-emerald-500/50 decoration-1 underline-offset-2">
                  {tickerItems[currentTickerIdx]?.itemName}
                </span>{" "}
                <span className="text-zinc-400 text-[11px]">({tickerItems[currentTickerIdx]?.timeAgo})</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="hidden lg:flex items-center gap-2 text-zinc-300 text-[11px]">
              <span>{t("top_bar_guarantee")}</span>
            </div>

            {/* Direct Language Switcher in Top Bar */}
            <div className="flex items-center bg-zinc-800/90 dark:bg-zinc-900/90 rounded-lg p-0.5 border border-zinc-700/70 text-[11px] font-semibold">
              <button
                id="top-lang-bn-btn"
                onClick={() => setLanguage("bn")}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  language === "bn"
                    ? "bg-emerald-500 text-white font-bold shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="বাংলা ভাষায় পরিবর্তন করুন"
              >
                বাংলা
              </button>
              <button
                id="top-lang-en-btn"
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  language === "en"
                    ? "bg-emerald-500 text-white font-bold shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Switch to English"
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          {/* Brand Logo with Language Awareness */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory("All");
                setSearchQuery("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-zinc-900 dark:text-white">
                  {language === "bn" ? (
                    <>
                      নিরাপদ<span className="text-emerald-500">ক্রয়</span>
                    </>
                  ) : (
                    <>
                      Nirapod<span className="text-emerald-500">Kroy</span>
                    </>
                  )}
                </span>
                <span className="hidden sm:block text-[10px] font-medium tracking-wide text-zinc-400 dark:text-zinc-400 -mt-1">
                  {language === "bn"
                    ? "Nirapod Kroy • সব ধরনের পণ্যের বিশ্বস্ত বাজার"
                    : "Safe & Trusted All-in-One Marketplace"}
                </span>
              </div>
            </a>
          </div>

          {/* Search Bar & Category Dropdown */}
          <div className="flex-1 max-w-xl mx-2 hidden md:flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search_placeholder")}
                className="w-full pl-10 pr-9 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Dropdown in Navbar */}
            <div className="relative">
              <select
                id="category-nav-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
                className="appearance-none pl-3.5 pr-8 py-2.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryName(cat)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Prominent Language Switcher Button in Navbar */}
            <button
              id="language-toggle-btn"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-emerald-500/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs font-semibold"
              title={language === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
              aria-label="Change language / ভাষা পরিবর্তন"
            >
              <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="hidden sm:inline">{language === "bn" ? "English" : "বাংলা"}</span>
              <span className="sm:hidden font-bold">{language === "bn" ? "EN" : "বাং"}</span>
            </button>

            {/* Elegant Dual Theme Switch */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="relative p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-5 h-5 text-zinc-600 transition-transform -rotate-12 hover:rotate-0" />
              )}
            </button>

            {/* Shopping Cart Button with Dynamic Badge Counter */}
            <button
              id="cart-toggle-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              aria-label="Open shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-md shadow-emerald-500/30 animate-scaleIn">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Customer Auth / Profile Button */}
            <div className="relative">
              {currentUser ? (
                <div className="relative">
                  <button
                    id="user-profile-menu-btn"
                    onClick={() => setUserDropdownOpen(prev => !prev)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all text-sm font-medium"
                    aria-label="User profile menu"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[100px] truncate hidden sm:inline">{currentUser.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-fadeIn"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("signed_in_as")}</p>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {currentUser.email}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 flex items-center gap-2.5 transition-colors"
                      >
                        <Package className="w-4 h-4 text-emerald-500" />
                        {t("my_orders")}
                      </button>

                      <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logoutCustomer();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t("logout")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    id="signin-btn"
                    onClick={() => {
                      setAuthModalTab("signin");
                      setIsAuthModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {t("login_btn")}
                  </button>
                  <button
                    id="signup-btn"
                    onClick={() => {
                      setAuthModalTab("signup");
                      setIsAuthModalOpen(true);
                    }}
                    className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 transition-all hover:shadow-md"
                  >
                    {language === "bn" ? "নিবন্ধন" : "Register"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search_placeholder")}
              className="w-full pl-9 pr-8 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
