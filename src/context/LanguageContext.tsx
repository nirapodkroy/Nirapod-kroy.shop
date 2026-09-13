import React, { createContext, useContext, useEffect, useState } from "react";
import { Language } from "../types";
import { safeGetLocalStorage, safeSetLocalStorage } from "../utils/storage";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  formatPrice: (price: number) => string;
  getCategoryName: (category: string) => string;
}

const DICTIONARY: Record<Language, Record<string, string>> = {
  bn: {
    // Brand & Header
    brand_name: "নিরাপদ ক্রয়",
    brand_subname: "Nirapod Kroy",
    brand_tagline: "নিরাপদ ক্রয় • সব ধরনের পণ্যের বিশ্বস্ত বাজার",
    live_ticker_label: "সরাসরি অর্ডার (Live):",
    top_bar_guarantee: "ক্যাশ অন ডেলিভারি ও দ্রুত হোম ডেলিভারি • ১০০% আসল পণ্যের নিশ্চয়তা",
    search_placeholder: "যেকোনো পণ্য খুঁজুন (চাল, তেল, হেডফোন, শাড়ি, ক্রিম...)...",
    search_aria: "পণ্য অনুসন্ধান",
    categories_menu: "ক্যাটাগরি",
    all_categories: "সব ক্যাটাগরি",
    cart_title: "আপনার শপিং ব্যাগ",
    view_cart: "কার্ট দেখুন",
    login_btn: "লগইন",
    account_menu: "আমার অ্যাকাউন্ট",
    my_orders: "আমার অর্ডার ও প্রোফাইল",
    logout: "লগআউট",
    signed_in_as: "লগইন আছেন:",

    // Filter & Sort
    filter_all: "সব পণ্য (All)",
    cat_Groceries: "মুদি ও খাদ্য (Groceries)",
    cat_Electronics: "ইলেকট্রনিক্স (Electronics)",
    cat_Fashion: "পোশাক ও ফ্যাশন (Fashion)",
    cat_HealthBeauty: "রূপচর্চা ও স্বাস্থ্য (Beauty)",
    cat_HomeKitchen: "গৃহস্থালি ও কিচেন (Home)",
    cat_BabyKids: "শিশু ও খেলনা (Kids)",
    cat_Sports: "খেলাধুলা ও ফিটনেস (Sports)",
    cat_Books: "বই ও স্টেশনারি (Books)",
    cat_Accessories: "এক্সেসরিজ (Accessories)",
    
    sort_label: "সাজান:",
    sort_featured: "ফিচার্ড কালেকশন",
    sort_price_low: "দাম: কম থেকে বেশি",
    sort_price_high: "দাম: বেশি থেকে কম",
    sort_rating: "সেরা রেটিং",
    items_count: "টি পণ্য পাওয়া গেছে",

    // Product Card & Modal
    add_to_cart: "কার্টে নিন",
    in_cart: "কার্টে আছে",
    buy_now: "এখনই কিনুন",
    out_of_stock: "স্টক শেষ",
    in_stock: "স্টকে আছে",
    only_left: "আর মাত্র বাকি আছে",
    verified_reviews: "যাচাইকৃত রিভিউ",
    quick_view: "দ্রুত দেখুন",
    quantity: "পরিমাণ",
    free_delivery_above: "৳১৫০০ এর বেশি অর্ডারে ফ্রি ডেলিভারি",
    warranty_note: "অফিশিয়াল কোয়ালিটি ও নিরাপদ ক্যাশ অন ডেলিভারি",
    return_note: "৭ দিনের সহজ রিটার্ন পলিসি",

    // Cart Drawer
    cart_drawer_title: "আপনার শপিং কার্ট",
    clear_cart: "সব মুছুন",
    free_shipping_unlocked: "🎉 আপনি ফ্রি ডেলিভারি অফার পেয়েছেন!",
    add_more_for_free_shipping: "আরও ৳{amount} কেনাকাটায় ফ্রি ডেলিভারি!",
    subtotal: "উপমোট (Subtotal)",
    delivery_fee: "ডেলিভারি চার্জ",
    free: "ফ্রি (FREE)",
    discount: "ডিসকাউন্ট",
    total_payable: "সর্বমোট প্রদেয়",
    empty_cart_message: "আপনার কার্টে কোনো পণ্য যোগ করা নেই।",
    start_shopping: "কেনাকাটা শুরু করুন",
    apply_coupon: "কুপন কোড প্রয়োগ",
    apply: "প্রয়োগ",
    proceed_to_checkout: "অর্ডার কনফার্ম করুন (চেকআউট)",

    // Checkout
    checkout_title: "অর্ডার সম্পন্ন করুন",
    delivery_details: "ডেলিভারি তথ্য",
    full_name: "আপনার পুরো নাম",
    mobile_number: "মোবাইল নম্বর (১১ ডিজিট)",
    email_address: "ইমেইল ঠিকানা",
    full_address: "সম্পূর্ণ ঠিকানা (বাসা/রোড/এলাকা/জেলা)",
    payment_method: "পেমেন্ট মাধ্যম",
    cod: "ক্যাশ অন ডেলিভারি (পণ্য পেয়ে মূল্য পরিশোধ)",
    bkash_nagad: "বিকাশ / নগদ / মোবাইল ব্যাংকিং",
    confirm_order_btn: "অর্ডার নিশ্চিত করুন (Confirm Order)",

    // Footer
    newsletter_heading: "Nirapod Kroy কমিউনিটিতে যুক্ত হোন",
    newsletter_desc: "বিশেষ ডিসকাউন্ট কুপন, নতুন পণ্যের আপডেট ও অফার পেতে সাবস্ক্রাইব করুন।",
    email_placeholder: "আপনার ইমেইল দিন",
    subscribe_btn: "সাবস্ক্রাইব",
    footer_about: "নিরাপদ ক্রয় (Nirapod Kroy) — বাংলাদেশের প্রতিটি প্রান্তের ক্রেতাদের জন্য খাঁটি মুদি পণ্য, লেটেস্ট গ্যাজেট, লাইফস্টাইল ফ্যাশন, রূপচর্চা ও গৃহস্থালি সামগ্রীর শতভাগ বিশ্বস্ত নির্ভরযোগ্য অনলাইন মার্কেটপ্লেস।",
    ssl_secure: "SSL নিরাপদ লেনদেন",
    authentic_products: "১০০% আসল পণ্যের নিশ্চয়তা",
    categories_heading: "ক্যাটাগরি",
    customer_care_heading: "কাস্টমার কেয়ার",
    order_tracking: "অর্ডার ট্র্যাকিং",
    delivery_policy: "ডেলিভারি পলিসি",
    refund_policy: "রিটার্ন ও রিফান্ড",
    privacy_policy: "গোপনীয়তা নীতি",
    contact_heading: "যোগাযোগ ও সোশ্যাল",
    facebook_page: "Facebook (@nirapodkroy)",
    instagram_page: "Instagram (@nirapodkroy)",
    whatsapp_help: "WhatsApp হেল্পলাইন",
    copyright: "সর্বস্বত্ব সংরক্ষিত।",

    // Language Toggle
    switch_lang: "English এ দেখুন"
  },
  en: {
    // Brand & Header
    brand_name: "Nirapod Kroy",
    brand_subname: "নিরাপদ ক্রয়",
    brand_tagline: "Nirapod Kroy • Safe & Trusted All-in-One Marketplace",
    live_ticker_label: "Live Orders:",
    top_bar_guarantee: "Cash on Delivery & Fast Delivery • 100% Authentic Guarantee",
    search_placeholder: "Search anything (rice, oil, headphones, saree, skincare...)...",
    search_aria: "Search products",
    categories_menu: "Categories",
    all_categories: "All Categories",
    cart_title: "Shopping Bag",
    view_cart: "View Cart",
    login_btn: "Login",
    account_menu: "My Account",
    my_orders: "My Orders & Profile",
    logout: "Logout",
    signed_in_as: "Signed in as:",

    // Filter & Sort
    filter_all: "All Products",
    cat_Groceries: "Groceries & Food",
    cat_Electronics: "Electronics & Gadgets",
    cat_Fashion: "Fashion & Apparel",
    cat_HealthBeauty: "Health & Beauty",
    cat_HomeKitchen: "Home & Kitchen",
    cat_BabyKids: "Baby & Kids",
    cat_Sports: "Sports & Fitness",
    cat_Books: "Books & Stationery",
    cat_Accessories: "Accessories",

    sort_label: "Sort By:",
    sort_featured: "Featured Collection",
    sort_price_low: "Price: Low to High",
    sort_price_high: "Price: High to Low",
    sort_rating: "Highest Rated",
    items_count: "products available",

    // Product Card & Modal
    add_to_cart: "Add to Cart",
    in_cart: "In Cart",
    buy_now: "Buy Now",
    out_of_stock: "Out of Stock",
    in_stock: "In Stock",
    only_left: "Only left:",
    verified_reviews: "verified reviews",
    quick_view: "Quick View",
    quantity: "Quantity",
    free_delivery_above: "Free express delivery on orders over ৳1500",
    warranty_note: "Official quality guarantee & safe Cash on Delivery",
    return_note: "7-day hassle-free return policy",

    // Cart Drawer
    cart_drawer_title: "Your Shopping Cart",
    clear_cart: "Clear All",
    free_shipping_unlocked: "🎉 You unlocked Free Delivery!",
    add_more_for_free_shipping: "Add ৳{amount} more to get Free Delivery!",
    subtotal: "Subtotal",
    delivery_fee: "Delivery Fee",
    free: "FREE",
    discount: "Discount",
    total_payable: "Total Payable",
    empty_cart_message: "Your shopping bag is currently empty.",
    start_shopping: "Start Shopping",
    apply_coupon: "Coupon code (e.g. NIRAPOD10)",
    apply: "Apply",
    proceed_to_checkout: "Proceed to Checkout",

    // Checkout
    checkout_title: "Complete Your Order",
    delivery_details: "Delivery Details",
    full_name: "Full Name",
    mobile_number: "Phone Number (11 digits)",
    email_address: "Email Address",
    full_address: "Full Street Address, Area & District",
    payment_method: "Payment Method",
    cod: "Cash on Delivery (Pay when received)",
    bkash_nagad: "bKash / Nagad / Mobile Banking",
    confirm_order_btn: "Confirm Order Now",

    // Footer
    newsletter_heading: "Join Nirapod Kroy Community",
    newsletter_desc: "Subscribe for exclusive discount vouchers, seasonal promotions, and latest arrivals.",
    email_placeholder: "Enter your email address",
    subscribe_btn: "Subscribe",
    footer_about: "Nirapod Kroy — Bangladesh's premier trusted e-commerce marketplace delivering 100% pure organic groceries, trending electronics, fashion apparel, beauty essentials, and home appliances nationwide.",
    ssl_secure: "SSL Encrypted Checkout",
    authentic_products: "100% Authentic Quality",
    categories_heading: "Categories",
    customer_care_heading: "Customer Care",
    order_tracking: "Track Order",
    delivery_policy: "Delivery Policy",
    refund_policy: "Return & Refund",
    privacy_policy: "Privacy Policy",
    contact_heading: "Social & Contact",
    facebook_page: "Facebook (@nirapodkroy)",
    instagram_page: "Instagram (@nirapodkroy)",
    whatsapp_help: "WhatsApp Helpline",
    copyright: "All rights reserved.",

    // Language Toggle
    switch_lang: "বাংলায় দেখুন"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = safeGetLocalStorage("nirapodkroy_language") as Language;
      if (saved === "bn" || saved === "en") return saved;
    } catch {}
    return "bn"; // Default to Bangla as requested
  });

  useEffect(() => {
    try {
      safeSetLocalStorage("nirapodkroy_language", language);
      document.documentElement.lang = language === "bn" ? "bn" : "en";
    } catch {}
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === "bn" ? "en" : "bn"));
  };

  const t = (key: string, fallback?: string): string => {
    const translation = DICTIONARY[language]?.[key];
    if (translation) return translation;
    return fallback || DICTIONARY["en"]?.[key] || key;
  };

  const formatPrice = (price: number): string => {
    return `৳${price.toLocaleString()}`;
  };

  const getCategoryName = (cat: string): string => {
    const c = cat.toLowerCase().trim();
    if (c === "all") return language === "bn" ? "সব পণ্য (Home)" : "All Products";
    if (c === "groceries") return language === "bn" ? "মুদি ও খাদ্য" : "Groceries & Food";
    if (c === "honey") return language === "bn" ? "মধু ও সুইটনার" : "Honey";
    if (c === "oil & ghee" || c === "oil" || c === "ghee") return language === "bn" ? "তেল ও ঘি" : "Oil & Ghee";
    if (c === "dates") return language === "bn" ? "প্রিমিয়াম খেজুর" : "Dates";
    if (c === "spices") return language === "bn" ? "খাঁটি মশলা" : "Spices";
    if (c === "nuts & seeds" || c === "nuts") return language === "bn" ? "বাদাম ও বীজ" : "Nuts & Seeds";
    if (c === "beverage" || c === "tea" || c === "coffee") return language === "bn" ? "চা ও পানীয়" : "Beverage";
    if (c === "rice") return language === "bn" ? "প্রিমিয়াম চাল" : "Rice";
    if (c === "flours & lentils" || c === "flour" || c === "lentils") return language === "bn" ? "আটা ও ডাল" : "Flours & Lentils";
    if (c === "pickle") return language === "bn" ? "আচার" : "Pickle";
    if (c === "certified") return language === "bn" ? "সার্টিফাইড পণ্য" : "Certified";
    if (c === "electronics") return language === "bn" ? "ইলেকট্রনিক্স (Electronics)" : "Electronics & Gadgets";
    if (c === "fashion") return language === "bn" ? "পোশাক ও ফ্যাশন" : "Fashion & Apparel";
    if (c === "health & beauty") return language === "bn" ? "রূপচর্চা ও স্বাস্থ্য" : "Health & Beauty";
    if (c === "home & kitchen") return language === "bn" ? "গৃহস্থালি ও কিচেন" : "Home & Kitchen";
    if (c === "baby & kids" || c === "baby") return language === "bn" ? "শিশু ও খেলনা" : "Baby & Kids";
    if (c === "sports") return language === "bn" ? "খেলাধুলা ও ফিটনেস" : "Sports & Fitness";
    if (c === "books") return language === "bn" ? "বই ও স্টেশনারি" : "Books & Stationery";
    if (c === "accessories") return language === "bn" ? "অন্যান্য (Accessories)" : "Accessories";
    return cat;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        formatPrice,
        getCategoryName
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
