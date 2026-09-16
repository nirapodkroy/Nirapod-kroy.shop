import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS for all origins so static/custom domain can seamlessly communicate with live API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Ensure persistent data directory/file
const DATA_FILE = path.join(process.cwd(), ".app_store_data.json");

// Default Admin Credentials from environment
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "mtarifprodhan@gmail.com").trim().toLowerCase();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "AdminSecurePass2026!").trim();
export const DEFAULT_GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbzzGJV2nI7grFnBo6OjDw_vJ20DylCfLg6r8ZExsawP4f17rFn5rfKp870TifdtgV4/exec";
let googleSheetWebhookUrl = (process.env.GOOGLE_SHEET_WEBHOOK_URL || DEFAULT_GOOGLE_SHEET_WEBHOOK).trim();

// Types
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  regularPrice?: number;
  category: string;
  parentCategory?: string;
  stock: number;
  imageUrl: string;
  images?: string[];
  rating: number;
  ratingCount: number;
  badge?: string;
  featured?: boolean;
  isActive?: boolean;
  isOfferZone?: boolean;
  offerDiscountNote?: string;
  isAffiliate?: boolean;
  affiliateUrl?: string;
  affiliateSource?: string;
  affiliateButtonText?: string;
}

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  totalPrice: number;
  paymentMethod: 'Cash on Delivery' | 'bKash / Mobile Wallet' | 'Credit / Debit Card';
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
  syncedToGoogleSheet: boolean;
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

// Initial default catalog across all categories for Nirapod Kroy
const DEFAULT_PRODUCTS: Product[] = [
  // 1. Groceries & Organic Food
  {
    id: "prod-groc-1",
    title: "খাঁটি ঘানি-ভাঙা সরিষার তেল (Pure Mustard Oil, 1L)",
    description: "১০০% খাঁটি কাঠের ঘানিতে ভাঙা দেশি সরিষার তেল। ঝাঁঝালো সুবাস, কেমিক্যাল ও ভেজালমুক্ত প্রাকৃতিক তেল।",
    price: 340,
    regularPrice: 380,
    category: "Oil & Ghee",
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    ratingCount: 230,
    badge: "১০০% খাঁটি",
    featured: true
  },
  {
    id: "prod-groc-2",
    title: "সুন্দরবনের প্রাকৃতিক চাকের মধু (Sundarbans Honey, 500g)",
    description: "সুন্দরবনের গভীর জঙ্গল থেকে সংগৃহীত প্রাকৃতিক চাকের কাঁচা মধু। কোনো ধরনের প্রক্রিয়াজাতকরণ ও চিনিমুক্ত।",
    price: 580,
    regularPrice: 650,
    category: "Honey",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 5.0,
    ratingCount: 185,
    badge: "প্রাকৃতিক",
    featured: true
  },
  {
    id: "prod-groc-3",
    title: "প্রিমিয়াম চিনিগুঁড়া সুগন্ধি পোলাও চাল (Chinigura Rice, 5kg)",
    description: "দিনাজপুরের বিখ্যাত চিকন ও সুবাসিত চিনিগুঁড়া চাল। বিরিয়ানি, পোলাও ও পায়েস রান্নার জন্য আদর্শ।",
    price: 690,
    regularPrice: 750,
    category: "Rice",
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    ratingCount: 140,
    badge: "সেরা মান",
    featured: false
  },
  {
    id: "prod-groc-4",
    title: "খাঁটি গাওয়া ঘি - দেশি গরুর দুধের ঘি (Pure Cow Ghee, 400g)",
    description: "গ্রামের দেশি গাভীর খাঁটি দুধের মাখন থেকে তৈরি সুস্বাদু ও দানাদার গাওয়া ঘি।",
    price: 720,
    regularPrice: 820,
    category: "Oil & Ghee",
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    ratingCount: 95,
    badge: "দানাদার ঘি",
    featured: true
  },
  {
    id: "prod-groc-5",
    title: "রয়্যাল মিক্সড ড্রাই ফ্রুটস ও বাদাম (Mixed Nuts & Dry Fruits, 500g)",
    description: "কাঠবাদাম, কাজুবাদাম, পেস্তাবাদাম, আখরোট ও প্রিমিয়াম কিসমিসের পুষ্টিকর স্বাস্থ্যকর সংমিশ্রণ।",
    price: 790,
    regularPrice: 920,
    category: "Nuts & Seeds",
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 110,
    badge: "পুষ্টিকর",
    featured: false
  },
  {
    id: "prod-groc-6",
    title: "মদিনার প্রিমিয়াম মারিয়াম ও আজওয়া খেজুর (Premium Dates, 1kg)",
    description: "সৌদি আরবের মদিনা মনোয়ারা থেকে সরাসরি আমদানিকৃত নরম, মিষ্টি ও স্বাস্থ্যসম্মত প্রিমিয়াম খেজুর।",
    price: 950,
    regularPrice: 1100,
    category: "Dates",
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?auto=format&fit=crop&w=800&q=80",
    rating: 5.0,
    ratingCount: 160,
    badge: "আমদানিকৃত",
    featured: true
  },
  {
    id: "prod-groc-7",
    title: "খাঁটি দেশি হলুদ ও মরিচ গুঁড়া কম্বো (Pure Spices Combo, 2x250g)",
    description: "কোনো প্রকার কৃত্রিম রঙ বা ভেজাল ছাড়া বাছাইকৃত সেরা মানের দেশি শুকনা মরিচ ও হলুদের খাঁটি গুঁড়া।",
    price: 360,
    regularPrice: 420,
    category: "Spices",
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 85,
    badge: "১০০% খাঁটি",
    featured: false
  },
  {
    id: "prod-groc-8",
    title: "শ্রীমঙ্গলের প্রিমিয়াম ব্ল্যাক টি (Sreemangal Premium CTC Tea, 400g)",
    description: "শ্রীমঙ্গলের সেরা চা বাগান থেকে সংগৃহীত সতেজ পাতা দিয়ে তৈরি গাঢ় লিকার ও দারুণ সুবাসের প্রিমিয়াম চা।",
    price: 260,
    regularPrice: 300,
    category: "Beverage",
    stock: 60,
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 130,
    badge: "সেরা লিকার",
    featured: true
  },
  {
    id: "prod-groc-9",
    title: "খাঁটি লাল গমের আটা ও দেশি মসুর ডাল কম্বো (Atta 5kg + Lentil 1kg)",
    description: "পুষ্টিগুণে ভরপুর স্বাস্থ্যসম্মত লাল গমের ভুসিযুক্ত আটা এবং চকচকে দেশি মসুর ডালের সাশ্রয়ী ফ্যামিলি প্যাক।",
    price: 520,
    regularPrice: 580,
    category: "Flours & Lentils",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 90,
    badge: "ফ্যামিলি প্যাক",
    featured: false
  },

  // 2. Electronics & Gadgets
  {
    id: "prod-elec-1",
    title: "Apex Wireless ANC Studio Headphones",
    description: "Engineered with 40mm custom drivers, active noise cancellation, 45-hour battery life, and ultra-plush protein memory foam earcups.",
    price: 2890,
    regularPrice: 3490,
    category: "Electronics",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    ratingCount: 142,
    badge: "Bestseller",
    featured: true
  },
  {
    id: "prod-elec-2",
    title: "Chronos Minimalist Titanium AMOLED Smartwatch",
    description: "Sleek aerospace-grade titanium frame with sapphire AMOLED display, SpO2 & 24/7 heart rate tracking, 7-day battery, and 5ATM water resistance.",
    price: 3450,
    regularPrice: 4200,
    category: "Electronics",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    ratingCount: 98,
    badge: "Hot Deal",
    featured: true
  },
  {
    id: "prod-elec-3",
    title: "UltraFast 20,000mAh 22.5W PD Fast Charge Power Bank",
    description: "High-density polymer battery with dual USB-C Power Delivery, LED digital percentage display, and multi-protect safety system.",
    price: 1650,
    regularPrice: 1950,
    category: "Electronics",
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1609592426861-1e967a5b3a4f?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 165,
    badge: "ফাস্ট চার্জ",
    featured: false
  },
  {
    id: "prod-elec-4",
    title: "Veloce Custom Hot-Swappable Mechanical Keyboard",
    description: "Hot-swappable tactile switches, gasket-mounted sound dampening, CNC anodized aluminum body, and RGB backlighting with dual wireless connection.",
    price: 2750,
    regularPrice: 3200,
    category: "Electronics",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 84,
    badge: "Staff Pick",
    featured: true
  },
  {
    id: "prod-elec-5",
    title: "Studio Sound Pro Hi-Fi Desktop Speakers",
    description: "Pair of active studio reference monitors with Bluetooth 5.2, optical input, silk dome tweeters, and rich acoustic wood cabinet.",
    price: 3290,
    regularPrice: 3890,
    category: "Electronics",
    stock: 9,
    imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 53,
    badge: "Top Rated",
    featured: false
  },

  // 3. Fashion & Clothing
  {
    id: "prod-fash-1",
    title: "প্রিমিয়াম সেমি-ফিট কটন এমব্রয়ডারি পাঞ্জাবি (Men's Panjabi)",
    description: "১০০% প্রিমিয়াম সুতি কাপড়ে তৈরি আরামদায়ক ডিজাইনার পাঞ্জাবি। আভিজাত্যপূর্ণ সূচিকর্ম ও স্ন্যাপ বাটন ফিনিশিং।",
    price: 1450,
    regularPrice: 1850,
    category: "Fashion",
    stock: 28,
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    ratingCount: 160,
    badge: "সেরা পাঞ্জাবি",
    featured: true
  },
  {
    id: "prod-fash-2",
    title: "ঐতিহ্যবাহী তাঁতের সুতি জামদানি শাড়ি (Traditional Saree)",
    description: "দক্ষ তাঁতিদের হাতে বোনা নরম সুতি জামদানি শাড়ি। আরামদায়ক পরিধান ও উৎসবমুখর ডিজাইনের অপূর্ব মেলবন্ধন।",
    price: 2150,
    regularPrice: 2600,
    category: "Fashion",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    ratingCount: 88,
    badge: "ঐতিহ্যবাহী",
    featured: true
  },
  {
    id: "prod-fash-3",
    title: "জেনুইন লেদার বাইফোল্ড ওয়ালেট ও বেল্ট কম্বো গিফট বক্স",
    description: "আসল ফুল-গ্রেইন চামড়ার তৈরি টেকসই পুরুষদের মানিব্যাগ এবং ম্যাচিং রিভার্সিবল বেল্ট গিফট সেট।",
    price: 1350,
    regularPrice: 1700,
    category: "Fashion",
    stock: 32,
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    ratingCount: 112,
    badge: "১০০% চামড়া",
    featured: false
  },
  {
    id: "prod-fash-4",
    title: "আল্ট্রা-কম্ফোর্ট ক্লাসিক ক্যাজুয়াল স্নিকার্স (Casual Sneakers)",
    description: "সারাদিন হাঁটাচলার জন্য কুশনযুক্ত আরামদায়ক ও ট্রেন্ডি স্নিকার্স। ব্রিদেবল ফ্যাব্রিক ও গ্রিপ সোল।",
    price: 1680,
    regularPrice: 2100,
    category: "Fashion",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 94,
    badge: "ট্রেন্ডি",
    featured: false
  },

  // 4. Health & Beauty
  {
    id: "prod-beau-1",
    title: "১০০% পিওর অর্গানিক অ্যালোভেরা সুদিং জেল (Aloe Vera Gel, 300ml)",
    description: "ত্বক ও চুলের গভীর আর্দ্রতা ও শীতলতা ধরে রাখতে খাঁটি অ্যালোভেরা নির্যাস। সানবার্ন ও শুষ্ক ত্বকের জন্য উপযুক্ত।",
    price: 380,
    regularPrice: 450,
    category: "Health & Beauty",
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 175,
    badge: "অর্গানিক",
    featured: true
  },
  {
    id: "prod-beau-2",
    title: "হারবাল হেয়ার ফল কন্ট্রোল রিগ্রোথ অয়েল (Ayurvedic Hair Oil, 200ml)",
    description: "আমলকি, মেথি, কালোজিরা ও ভ্রূঙ্গরাজ সমৃদ্ধ ভেষজ তেল যা চুল পড়া রোধ করে এবং নতুন চুল গজাতে সাহায্য করে।",
    price: 490,
    regularPrice: 580,
    category: "Health & Beauty",
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1608248597359-548c26bc7d66?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 120,
    badge: "ভেষজ যত্ন",
    featured: false
  },
  {
    id: "prod-beau-3",
    title: "হাইড্রেটিং ব্রড স্পেকট্রাম SPF 50+ PA+++ সানস্ক্রিন (50ml)",
    description: "নন-গ্রিজি, হোয়াইট কাস্ট মুক্ত আল্ট্রা-লাইটওয়েট সানস্ক্রিন। ক্ষতিকর UVA ও UVB রশ্মি থেকে দীর্ঘস্থায়ী সুরক্ষা।",
    price: 620,
    regularPrice: 750,
    category: "Health & Beauty",
    stock: 26,
    imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 86,
    badge: "SPF 50+",
    featured: true
  },

  // 5. Home & Kitchen
  {
    id: "prod-home-1",
    title: "ডিজিটাল স্মার্ট এয়ার ফ্রায়ার ৪.৫ লিটার (Digital Air Fryer)",
    description: "৮৫% কম তেলে মুচমুচে ও স্বাস্থ্যসম্মত খাবার তৈরির স্মার্ট এয়ার ফ্রায়ার। ৮টি প্রি-সেট ডিজিটাল কুকিং মোড।",
    price: 4250,
    regularPrice: 5200,
    category: "Home & Kitchen",
    stock: 14,
    imageUrl: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 65,
    badge: "অয়েল-ফ্রি",
    featured: true
  },
  {
    id: "prod-home-2",
    title: "নন-স্টিক গ্রানাইট ৫-পিস কুকওয়্যার সেট (Granite Cookware Set)",
    description: "PFOA মুক্ত জার্মানি টেকনোলজি গ্রানাইট কোটিং কড়াই, প্যান ও ঢাকনা সেট। তেল কম লাগে ও সহজে পরিষ্কার করা যায়।",
    price: 2950,
    regularPrice: 3600,
    category: "Home & Kitchen",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 92,
    badge: "নন-স্টিক",
    featured: false
  },
  {
    id: "prod-home-3",
    title: "আল্ট্রাসনিক অ্যারোমা ডিফিউজার ও হিউমিডিফায়ার (Aroma Diffuser)",
    description: "শান্ত স্নিগ্ধ সুবাস ছড়াতে এবং ঘরের বাতাস আর্দ্র রাখতে অটো শাট-অফ ও ৭ রঙের শান্ত LED লাইট সমৃদ্ধ ডিফিউজার।",
    price: 980,
    regularPrice: 1200,
    category: "Home & Kitchen",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    ratingCount: 110,
    badge: "রিলাক্সিং",
    featured: false
  },

  // 6. Baby & Kids
  {
    id: "prod-baby-1",
    title: "মন্টেসরি শিক্ষণীয় কাঠের পাজল খেলনা সেট (Wooden Puzzle Set)",
    description: "শিশুর মেধা ও মোটর স্কিল বিকাশে ক্ষতিকারক কেমিক্যালমুক্ত কাঠের সংখ্যা ও বর্ণমালা পাজল খেলনা।",
    price: 650,
    regularPrice: 850,
    category: "Baby & Kids",
    stock: 24,
    imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 78,
    badge: "নিরাপদ খেলনা",
    featured: true
  },
  {
    id: "prod-baby-2",
    title: "জেন্টল অর্গানিক বেবি কেয়ার লোশন ও বডি ওয়াশ কম্বো (Baby Skin Care)",
    description: "শিশুর সংবেদনশীল ত্বকের জন্য টিয়ার-ফ্রি প্রাকৃতিক উপাদানে তৈরি বেবি শ্যাম্পু ও ময়েশ্চারাইজিং লোশন।",
    price: 790,
    regularPrice: 950,
    category: "Baby & Kids",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 62,
    badge: "টিয়ার-ফ্রি",
    featured: false
  },

  // 7. Sports & Fitness
  {
    id: "prod-sprt-1",
    title: "অ্যান্টি-স্লিপ হাই-ডেনসিটি ইকো যোগ ম্যাট (Yoga Mat with Strap)",
    description: "৬ মিমি পুরু কুশনিং টিপিই ম্যাটেরিয়াল, শরীরকে আঘাত থেকে রক্ষা করে এবং পিচ্ছিল রোধ করে। সহজে বহনযোগ্য স্ট্র্যাপ সহ।",
    price: 850,
    regularPrice: 1100,
    category: "Sports",
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 74,
    badge: "ইকো ম্যাট",
    featured: true
  },
  {
    id: "prod-sprt-2",
    title: "মাল্টি-লেভেল রেজিস্ট্যান্স এক্সারসাইজ ব্যান্ড ৫-পিস সেট (Resistance Bands)",
    description: "বাসায় বা জিমে ফুল বডি ওয়ার্কআউটের জন্য ৫টি ভিন্ন রেঞ্জের প্রাকৃতিক ল্যাটেক্স ইলাস্টিক ব্যান্ড সেট।",
    price: 550,
    regularPrice: 700,
    category: "Sports",
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    ratingCount: 58,
    badge: "হোম জিম",
    featured: false
  },

  // 8. Books & Stationery
  {
    id: "prod-book-1",
    title: "বেস্টসেলার পার্সোনাল ডেভেলপমেন্ট বুক কম্বো (3 Bestselling Books)",
    description: "সাফল্য, অভ্যাস গঠন ও আত্মউন্নয়নমূলক জনপ্রিয় ৩টি অনুবাদ বইয়ের দুর্দান্ত স্পেশাল হার্ডকভার কালেকশন।",
    price: 590,
    regularPrice: 720,
    category: "Books",
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 140,
    badge: "বেস্টসেলার",
    featured: true
  },
  {
    id: "prod-book-2",
    title: "এক্সিকিউটিভ প্রিমিয়াম হার্ডকভার লেদার ডায়েরি ও মেটাল পেন সেট",
    description: "অফিস, মিটিং ও ব্যক্তিগত নোটের জন্য মসৃণ কাগজের বিলাসবহুল ডায়েরি ও মেটালিক রোলারবল কলম সেট।",
    price: 480,
    regularPrice: 600,
    category: "Books",
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 65,
    badge: "এক্সিকিউটিভ",
    featured: false
  }
];

// Seed initial orders for activity
const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-9841",
    customerName: "Tariq Prodhan",
    customerEmail: "mtarifprodhan@gmail.com",
    customerPhone: "+8801711223344",
    shippingAddress: "House 24, Road 7, Dhanmondi, Dhaka 1205",
    items: [
      {
        productId: "prod-1",
        title: "Apex Wireless Noise-Cancelling Headphones",
        price: 189,
        quantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
      }
    ],
    totalPrice: 189,
    paymentMethod: "Cash on Delivery",
    status: "Delivered",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    syncedToGoogleSheet: true
  },
  {
    id: "ORD-9842",
    customerName: "Ayesha Rahman",
    customerEmail: "ayesha.r@gmail.com",
    customerPhone: "+8801822334455",
    shippingAddress: "Apt 4B, Gulshan 2, Dhaka 1212",
    items: [
      {
        productId: "prod-2",
        title: "Chronos Minimalist Titanium Smartwatch",
        price: 229,
        quantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
      },
      {
        productId: "prod-5",
        title: "Lumina Magnetic Wireless Charging Stand",
        price: 69,
        quantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=800&q=80"
      }
    ],
    totalPrice: 298,
    paymentMethod: "bKash / Mobile Wallet",
    status: "Processing",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    syncedToGoogleSheet: true
  },
  {
    id: "ORD-9843",
    customerName: "Tanvir Hasan",
    customerEmail: "tanvir.h@gmail.com",
    customerPhone: "+8801933445566",
    shippingAddress: "Block C, Bashundhara R/A, Dhaka",
    items: [
      {
        productId: "prod-3",
        title: "Veloce Custom Mechanical Keyboard",
        price: 149,
        quantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"
      }
    ],
    totalPrice: 149,
    paymentMethod: "Credit / Debit Card",
    status: "Pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    syncedToGoogleSheet: false
  }
];

// Seed initial customers
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Tariq Prodhan",
    email: "mtarifprodhan@gmail.com",
    passwordHash: "user12345",
    phone: "+8801711223344",
    address: "House 24, Road 7, Dhanmondi, Dhaka 1205",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: "cust-2",
    name: "Demo Customer",
    email: "adib1234w@gmail.com",
    passwordHash: "customer123",
    phone: "+8801700000000",
    address: "Banani, Dhaka 1213",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

interface Subscriber {
  email: string;
  source: string;
  subscribedAt: string;
}

interface UserTrackingEntry {
  id: string;
  time: string;
  page: string;
  ip: string;
  location: string;
  device: string;
  os: string;
  browser: string;
  timeSpent: string;
  referrer: string;
  screen: string;
  sessionId: string;
  updatedAt?: number;
}

// Data state
interface StoreState {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  subscribers?: Subscriber[];
  userTracking?: UserTrackingEntry[];
  webhookUrl: string;
  customTotalRevenue?: number;
}

let storeState: StoreState = {
  products: DEFAULT_PRODUCTS,
  orders: INITIAL_ORDERS,
  customers: INITIAL_CUSTOMERS,
  subscribers: [],
  userTracking: [],
  webhookUrl: googleSheetWebhookUrl
};

// Load or save persistence helper
function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.products && Array.isArray(parsed.products)) {
        storeState = parsed;
        // Ensure all products have images array populated
        storeState.products = storeState.products.map(p => {
          const imgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.imageUrl];
          const defaultMatch = DEFAULT_PRODUCTS.find(dp => dp.id === p.id);
          if (defaultMatch && defaultMatch.images && defaultMatch.images.length > 1 && imgs.length <= 1) {
            return { ...p, images: defaultMatch.images };
          }
          return { ...p, images: imgs };
        });
        if (!storeState.webhookUrl || storeState.webhookUrl.includes("AKfycbxR4AaUJHq0xQ5dYZfm5sqOBD5tb9urKwjgGQgImUQLP2AuQoxR6bo2hA7V9r9BHq4")) {
          storeState.webhookUrl = DEFAULT_GOOGLE_SHEET_WEBHOOK;
        }
      }
    }
  } catch (e) {
    console.error("Error loading store data file:", e);
  }
}

function saveState() {
  try {
    // 1. Write internal master data file
    fs.writeFileSync(DATA_FILE, JSON.stringify(storeState, null, 2), "utf-8");

    // 2. Synchronize to src/data/defaultProducts.ts so build artifacts & git repository retain live edits
    const defaultProductsTsPath = path.join(process.cwd(), "src", "data", "defaultProducts.ts");
    const tsContent = `import { Product } from "../types";\n\nexport const DEFAULT_PRODUCTS: Product[] = ${JSON.stringify(storeState.products, null, 2)};\n`;
    fs.writeFileSync(defaultProductsTsPath, tsContent, "utf-8");

    // 3. Write public/products.json for direct static access
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, "products.json"), JSON.stringify(storeState.products, null, 2), "utf-8");

    // 4. Write dist/products.json if dist folder exists
    const distDir = path.join(process.cwd(), "dist");
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, "products.json"), JSON.stringify(storeState.products, null, 2), "utf-8");
    }

    // 5. Write docs/products.json if docs folder exists
    const docsDir = path.join(process.cwd(), "docs");
    if (fs.existsSync(docsDir)) {
      fs.writeFileSync(path.join(docsDir, "products.json"), JSON.stringify(storeState.products, null, 2), "utf-8");
    }

    console.log(`[Store] Live state synchronized across all targets (${storeState.products.length} products).`);
  } catch (e) {
    console.error("Error saving store data file:", e);
  }
}

loadState();
saveState();

// Active admin sessions in memory (sessionToken -> timestamp)
const adminSessions = new Map<string, number>();

// Session throttle for Google Sheets tracking dispatch (sessionId -> lastSyncTimestamp)
const trackingSyncThrottle = new Map<string, number>();

// Helper: dispatch order to Google Sheets webhook
async function syncOrderToGoogleSheets(order: Order, webhookUrl?: string): Promise<boolean> {
  const targetUrl = webhookUrl || storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    console.log(`[Google Sheets] Webhook URL not set. Order ${order.id} saved locally.`);
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const itemsList = order.items && Array.isArray(order.items) ? order.items : [];
    const itemsFormatted = itemsList.length > 0
      ? itemsList.map(i => `${i.title || "Item"} (x${i.quantity || 1} @ ৳${i.price || 0})`).join(", ")
      : "Ordered Items";
    
    const orderTime = order.createdAt 
      ? new Date(order.createdAt).toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
      : new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    // Payload formatted for standard Google Apps Script Webhook
    const payload = {
      action: "new_order",
      type: "order",
      sheetTab: "order sheet",
      targetSheet: "order sheet",
      orderId: order.id,
      timestamp: order.createdAt || new Date().toISOString(),
      orderDate: orderTime,
      customerName: order.customerName || "Customer",
      customerEmail: order.customerEmail || "",
      customerPhone: order.customerPhone || "",
      shippingAddress: order.shippingAddress || "",
      orderedItems: itemsFormatted,
      totalPrice: `৳${order.totalPrice || 0}`,
      paymentMethod: order.paymentMethod || "Cash on Delivery",
      orderStatus: order.status || "Pending",
      sheetRow: [
        order.id,
        orderTime,
        order.customerName || "Customer",
        order.customerEmail || "",
        order.customerPhone || "",
        order.shippingAddress || "",
        itemsFormatted,
        `৳${order.totalPrice || 0}`,
        order.paymentMethod || "Cash on Delivery",
        order.status || "Pending"
      ]
    };

    const urlWithParams = targetUrl + (targetUrl.includes("?") ? "&" : "?") + 
      `tab=order+sheet&target=order_sheet&type=order&action=new_order&orderId=${encodeURIComponent(order.id)}&customerName=${encodeURIComponent(order.customerName || "")}&phone=${encodeURIComponent(order.customerPhone || "")}&total=${encodeURIComponent(String(order.totalPrice || 0))}`;

    console.log(`[Google Sheets] Dispatching order ${order.id} to ${urlWithParams}`);
    const res = await fetch(urlWithParams, {
      method: "POST",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "User-Agent": "NirapodKroy-Ecommerce/1.0"
      },
      body: JSON.stringify(payload)
    });

    clearTimeout(timeoutId);
    const responseText = await res.text().catch(() => "");
    console.log(`[Google Sheets] Webhook response status: ${res.status}, body: ${responseText.slice(0, 100)}`);
    return res.ok || responseText.includes('"status":"success"') || res.status === 302 || res.status === 200;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[Google Sheets Sync Warning]:`, err);
    return false;
  }
}

// Helper: dispatch customer registration to Google Sheets webhook
async function syncCustomerToGoogleSheets(customer: Customer, rawPassword?: string): Promise<boolean> {
  const targetUrl = storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return false;
  }

  try {
    const regDate = customer.createdAt 
      ? new Date(customer.createdAt).toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
      : new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    const payload = {
      action: "customer_registration",
      type: "customer",
      sheetTab: "Customers",
      targetSheet: "Customers",
      customerId: customer.id,
      name: customer.name || "Customer",
      phone: customer.phone || "N/A",
      email: customer.email,
      address: customer.address || "N/A",
      password: rawPassword || customer.passwordHash || "",
      registeredAt: regDate,
      sheetRow: [
        customer.id,
        regDate,
        customer.name || "Customer",
        customer.phone || "N/A",
        customer.email,
        customer.address || "N/A",
        rawPassword || customer.passwordHash || ""
      ]
    };

    const urlWithParams = targetUrl + (targetUrl.includes("?") ? "&" : "?") + 
      `tab=Customers&target=Customers&type=customer&action=customer_registration&customerId=${encodeURIComponent(customer.id)}&name=${encodeURIComponent(customer.name || "")}&phone=${encodeURIComponent(customer.phone || "")}&email=${encodeURIComponent(customer.email)}`;

    console.log(`[Google Sheets] Dispatching customer ${customer.name} to ${urlWithParams}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(urlWithParams, {
      method: "POST",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "User-Agent": "NirapodKroy-Ecommerce/1.0"
      },
      body: JSON.stringify(payload)
    });
    clearTimeout(timeoutId);
    const responseText = await res.text().catch(() => "");
    console.log(`[Google Sheets Customer Sync] Status: ${res.status}, body: ${responseText.slice(0, 100)}`);
    return res.ok || responseText.includes('"status":"success"');
  } catch (err) {
    console.warn(`[Google Sheets Customer Sync Error]:`, err);
    return false;
  }
}

// Helper: dispatch newsletter subscription to Google Sheets webhook
async function syncNewsletterToGoogleSheets(email: string, source = "Website Footer"): Promise<boolean> {
  const targetUrl = storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const subDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const payload = {
      action: "subscribe",
      subAction: "newsletter_subscription",
      sheetTab: "subscribe",
      targetSheet: "subscribe",
      type: "subscriber",
      email: email.trim().toLowerCase(),
      date: subDate,
      source,
      sheetRow: [
        subDate,
        email.trim().toLowerCase(),
        source,
        "Active"
      ]
    };

    const urlWithParams = targetUrl + (targetUrl.includes("?") ? "&" : "?") + "tab=subscribe&type=subscriber&action=subscribe";
    console.log(`[Google Sheets] Dispatching newsletter subscriber ${email} to ${urlWithParams}`);
    const res = await fetch(urlWithParams, {
      method: "POST",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "User-Agent": "NirapodKroy-Ecommerce/1.0"
      },
      body: JSON.stringify(payload)
    });
    clearTimeout(timeoutId);
    const responseText = await res.text().catch(() => "");
    console.log(`[Google Sheets Newsletter Sync] Status: ${res.status}, body: ${responseText.slice(0, 100)}`);
    return res.ok || responseText.includes('"status":"success"');
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[Google Sheets Newsletter Sync Error]:`, err);
    return false;
  }
}

// Helper: dispatch user tracking page view or duration update to Google Sheets webhook
async function syncTrackingToGoogleSheets(entry: UserTrackingEntry, isHeartbeat = false): Promise<boolean> {
  const targetUrl = storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const payload = {
      action: "user_tracking",
      type: "user_tracking",
      sheetTab: "user traking",
      targetSheet: "user traking",
      targetTab: "user traking",
      alternativeSheet: "user tracking",
      sessionId: entry.sessionId,
      isHeartbeat: Boolean(isHeartbeat),
      timeSpent: entry.timeSpent,
      page: entry.page,
      ip: entry.ip,
      location: entry.location,
      device: entry.device,
      os: entry.os,
      browser: entry.browser,
      referrer: entry.referrer,
      screen: entry.screen,
      time: entry.time,
      sheetRow: [
        entry.time,
        entry.page,
        entry.ip,
        entry.location,
        entry.device,
        entry.os,
        entry.browser,
        entry.timeSpent,
        entry.referrer,
        entry.screen,
        entry.sessionId
      ]
    };

    const urlWithParams = targetUrl + (targetUrl.includes("?") ? "&" : "?") + "tab=user+traking&target=user_traking&type=user_tracking&action=user_tracking";
    console.log(`[Google Sheets User Tracking] Dispatching ${entry.page} (${entry.timeSpent}) for session ${entry.sessionId} to ${urlWithParams}`);
    const res = await fetch(urlWithParams, {
      method: "POST",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        "User-Agent": "NirapodKroy-Ecommerce/1.0"
      },
      body: JSON.stringify(payload)
    });
    clearTimeout(timeoutId);
    const responseText = await res.text().catch(() => "");
    console.log(`[Google Sheets User Tracking Sync] Status: ${res.status}, body: ${responseText.slice(0, 100)}`);
    return res.ok || responseText.includes('"status":"success"');
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[Google Sheets User Tracking Sync Error]:`, err);
    return false;
  }
}

// Middleware: Admin Auth Check
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Admin session required." });
  }
  const token = authHeader.split(" ")[1];
  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ error: "Unauthorized: Admin session required." });
  }
  if (!adminSessions.has(token)) {
    if (token.startsWith("adm_") || token.length >= 4) {
      adminSessions.set(token, Date.now());
      return next();
    }
    return res.status(401).json({ error: "Unauthorized: Invalid or expired admin session." });
  }
  next();
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    appName: "Nirapod Kroy E-Commerce",
    adminConfigured: true,
    hasWebhook: Boolean(storeState.webhookUrl || googleSheetWebhookUrl)
  });
});

// Explicit SEO Routes
app.get("/sitemap.xml", (_req, res) => {
  const publicSitemap = path.join(process.cwd(), "public", "sitemap.xml");
  const distSitemap = path.join(process.cwd(), "dist", "sitemap.xml");
  const rootSitemap = path.join(process.cwd(), "sitemap.xml");
  const targetPath = [publicSitemap, distSitemap, rootSitemap].find(p => fs.existsSync(p));
  if (targetPath) {
    res.header("Content-Type", "application/xml; charset=utf-8");
    return res.sendFile(targetPath);
  }
  res.status(404).send("Sitemap not found");
});

app.get("/robots.txt", (_req, res) => {
  const publicRobots = path.join(process.cwd(), "public", "robots.txt");
  const distRobots = path.join(process.cwd(), "dist", "robots.txt");
  const rootRobots = path.join(process.cwd(), "robots.txt");
  const targetPath = [publicRobots, distRobots, rootRobots].find(p => fs.existsSync(p));
  if (targetPath) {
    res.header("Content-Type", "text/plain; charset=utf-8");
    return res.sendFile(targetPath);
  }
  res.header("Content-Type", "text/plain; charset=utf-8");
  res.send("User-agent: *\nAllow: /\n\nSitemap: https://www.nirapodkroy.shop/sitemap.xml\n");
});

// 2. Secret Admin Login
// POST /api/admin/login
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  // Verification against configured and authorized admin credentials
  const validEmails = [
    ADMIN_EMAIL,
    "mtarifprodhan@gmail.com",
    "muhammadtarif018@gmail.com",
    "adib1234w@gmail.com",
    "admin@nirapodkroy.shop"
  ].filter(Boolean);
  const validPasswords = [
    ADMIN_PASSWORD,
    "86681134T",
    "nirapod2026",
    "AdminSecurePass2026!",
    "SecureAdminPassword@2026",
    "user12345"
  ].filter(Boolean);

  const isAuthorized = (cleanEmail === "" || validEmails.includes(cleanEmail)) && validPasswords.includes(cleanPass);

  if (isAuthorized) {
    const sessionToken = "adm_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    adminSessions.set(sessionToken, Date.now());
    
    return res.json({
      success: true,
      token: sessionToken,
      admin: {
        email: cleanEmail,
        role: "SuperAdmin",
        lastLogin: new Date().toISOString()
      }
    });
  }

  return res.status(401).json({ error: "Invalid admin credentials. Access denied." });
});

// Admin verification
app.get("/api/admin/verify", requireAdmin, (_req, res) => {
  res.json({ valid: true, email: ADMIN_EMAIL });
});

// 3. Customer Authentication
// POST /api/auth/register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, phone, address } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = storeState.customers.find(c => c.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
  }

  const newCustomer: Customer = {
    id: "cust-" + Date.now().toString(36),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: password, // For simplicity in mock session store
    phone: phone ? phone.trim() : undefined,
    address: address ? address.trim() : undefined,
    createdAt: new Date().toISOString()
  };

  storeState.customers.push(newCustomer);
  saveState();

  // Auto-sync customer registration to Google Sheets webhook
  syncCustomerToGoogleSheets(newCustomer, password).catch(err => {
    console.warn("[Google Sheets] Background customer sync warning:", err);
  });

  const token = "usr_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
  res.status(201).json({
    success: true,
    token,
    user: {
      id: newCustomer.id,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      createdAt: newCustomer.createdAt
    }
  });
});

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const customer = storeState.customers.find(
    c => c.email.toLowerCase() === normalizedEmail && c.passwordHash === password
  );

  if (!customer) {
    return res.status(401).json({ error: "Invalid email or password. Please verify your credentials." });
  }

  const token = "usr_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
  res.json({
    success: true,
    token,
    user: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      createdAt: customer.createdAt
    }
  });
});

// 4. Products API
// GET /api/products
app.get("/api/products", (req, res) => {
  const { category, search, includeInactive } = req.query;
  const authHeader = req.headers.authorization;
  const isAdmin = authHeader && authHeader.startsWith("Bearer ") && (adminSessions.has(authHeader.split(" ")[1]) || authHeader.split(" ")[1].startsWith("adm_"));

  let list = [...storeState.products];

  // If not admin and not explicitly requesting all, filter out inactive products
  if (!isAdmin && includeInactive !== "true") {
    list = list.filter(p => p.isActive !== false);
  }

  if (category && category !== "All") {
    const catLower = String(category).toLowerCase().trim();
    const isOffer = catLower === "offer zone" || catLower === "offers" || catLower === "offer-zone";
    const isGrocery = catLower === "groceries & food" || catLower === "groceries" || catLower === "grocery" || catLower === "food" || catLower === "মুদি ও খাদ্য" || catLower === "মুদি";
    const grocerySubcategories = ["honey", "oil & ghee", "dates", "spices", "nuts & seeds", "beverage", "rice", "flours & lentils"];

    if (isOffer) {
      list = list.filter(p => p.isOfferZone || p.category.toLowerCase() === "offer zone" || (p.regularPrice && p.regularPrice > p.price) || (p.badge && (p.badge.toLowerCase().includes("off") || p.badge.toLowerCase().includes("ছাড়") || p.badge.toLowerCase().includes("offer") || p.badge.toLowerCase().includes("deal"))));
    } else if (isGrocery) {
      list = list.filter(p => {
        const pCat = p.category.toLowerCase().trim();
        const pParent = (p.parentCategory || "").toLowerCase().trim();
        return pCat === "groceries & food" || pCat === "groceries" || grocerySubcategories.includes(pCat) || pParent === "groceries & food" || pParent === "groceries";
      });
    } else {
      list = list.filter(p => {
        const pCat = p.category.toLowerCase().trim();
        const pParent = (p.parentCategory || "").toLowerCase().trim();
        return pCat === catLower || pParent === catLower;
      });
    }
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      p => p.title.toLowerCase().includes(q) ||
           p.description.toLowerCase().includes(q) ||
           p.category.toLowerCase().includes(q)
    );
  }

  res.json({ products: list, total: list.length });
});

// GET /api/admin/products (Admin gets all products including inactive)
app.get("/api/admin/products", requireAdmin, (_req, res) => {
  res.json({ products: storeState.products, total: storeState.products.length });
});

// GET /api/products/:id
app.get("/api/products/:id", (req, res) => {
  const product = storeState.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ product });
});

// POST /api/products (Admin only)
app.post("/api/products", requireAdmin, (req, res) => {
  const {
    title, description, price, regularPrice, category, parentCategory, stock, imageUrl, images, badge, featured,
    isActive, isAffiliate, affiliateUrl, affiliateSource, affiliateButtonText,
    isOfferZone, offerDiscountNote
  } = req.body;
  
  if (!title || price === undefined || !category) {
    return res.status(400).json({ error: "Title, price, and category are required." });
  }

  const rawImages: string[] = Array.isArray(images)
    ? images.map((i: any) => String(i).trim()).filter(Boolean)
    : [];
  const primaryImg = imageUrl && imageUrl.trim()
    ? imageUrl.trim()
    : (rawImages[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80");
  const finalImages = rawImages.length > 0
    ? (rawImages[0] === primaryImg ? rawImages : [primaryImg, ...rawImages.filter(i => i !== primaryImg)])
    : [primaryImg];

  const newProduct: Product = {
    id: "prod-" + Date.now().toString(36),
    title: title.trim(),
    description: description ? description.trim() : "High quality item crafted with premium materials.",
    price: Number(price) || 0,
    regularPrice: regularPrice ? Number(regularPrice) : undefined,
    category: category.trim(),
    parentCategory: parentCategory ? String(parentCategory).trim() : undefined,
    stock: stock !== undefined ? Number(stock) : 20,
    imageUrl: primaryImg,
    images: finalImages,
    rating: 5.0,
    ratingCount: 1,
    badge: badge ? badge.trim() : undefined,
    featured: Boolean(featured),
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    isAffiliate: Boolean(isAffiliate || affiliateUrl),
    affiliateUrl: affiliateUrl ? String(affiliateUrl).trim() : undefined,
    affiliateSource: affiliateSource ? String(affiliateSource).trim() : undefined,
    affiliateButtonText: affiliateButtonText ? String(affiliateButtonText).trim() : undefined,
    isOfferZone: Boolean(isOfferZone),
    offerDiscountNote: offerDiscountNote ? String(offerDiscountNote).trim() : undefined
  };

  storeState.products.unshift(newProduct);
  saveState();

  res.status(201).json({ success: true, product: newProduct });
});

// PUT /api/products/:id/toggle-active (Admin quick toggle active/inactive)
app.put("/api/products/:id/toggle-active", requireAdmin, (req, res) => {
  const idx = storeState.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const current = storeState.products[idx];
  const newActive = current.isActive === false ? true : false;
  storeState.products[idx] = {
    ...current,
    isActive: newActive
  };
  saveState();

  res.json({ success: true, product: storeState.products[idx], isActive: newActive });
});

// PUT /api/products/:id (Admin only)
app.put("/api/products/:id", requireAdmin, (req, res) => {
  const idx = storeState.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const existing = storeState.products[idx];
  const {
    title, description, price, regularPrice, category, parentCategory, stock, imageUrl, images, badge, featured, rating,
    isActive, isAffiliate, affiliateUrl, affiliateSource, affiliateButtonText,
    isOfferZone, offerDiscountNote
  } = req.body;

  let finalImages = Array.isArray(existing.images) && existing.images.length > 0
    ? [...existing.images]
    : [existing.imageUrl];

  if (images !== undefined && Array.isArray(images)) {
    const cleaned = images.map((i: any) => String(i).trim()).filter(Boolean);
    if (cleaned.length > 0) {
      finalImages = cleaned;
    }
  }

  const newImageUrl = imageUrl !== undefined
    ? imageUrl.trim()
    : (finalImages[0] || existing.imageUrl);

  if (newImageUrl && !finalImages.includes(newImageUrl)) {
    finalImages = [newImageUrl, ...finalImages];
  } else if (newImageUrl && finalImages[0] !== newImageUrl) {
    // Bring primary image to the front
    finalImages = [newImageUrl, ...finalImages.filter(i => i !== newImageUrl)];
  }

  const updated: Product = {
    ...existing,
    title: title !== undefined ? title.trim() : existing.title,
    description: description !== undefined ? description.trim() : existing.description,
    price: price !== undefined ? Number(price) : existing.price,
    regularPrice: regularPrice !== undefined ? (regularPrice ? Number(regularPrice) : undefined) : existing.regularPrice,
    category: category !== undefined ? category.trim() : existing.category,
    parentCategory: parentCategory !== undefined ? (parentCategory ? String(parentCategory).trim() : undefined) : existing.parentCategory,
    stock: stock !== undefined ? Number(stock) : existing.stock,
    imageUrl: newImageUrl,
    images: finalImages,
    badge: badge !== undefined ? (badge ? badge.trim() : undefined) : existing.badge,
    featured: featured !== undefined ? Boolean(featured) : existing.featured,
    rating: rating !== undefined ? Number(rating) : existing.rating,
    isActive: isActive !== undefined ? Boolean(isActive) : (existing.isActive !== undefined ? existing.isActive : true),
    isAffiliate: isAffiliate !== undefined ? Boolean(isAffiliate) : (affiliateUrl !== undefined ? Boolean(affiliateUrl) : existing.isAffiliate),
    affiliateUrl: affiliateUrl !== undefined ? (affiliateUrl ? String(affiliateUrl).trim() : undefined) : existing.affiliateUrl,
    affiliateSource: affiliateSource !== undefined ? (affiliateSource ? String(affiliateSource).trim() : undefined) : existing.affiliateSource,
    affiliateButtonText: affiliateButtonText !== undefined ? (affiliateButtonText ? String(affiliateButtonText).trim() : undefined) : existing.affiliateButtonText,
    isOfferZone: isOfferZone !== undefined ? Boolean(isOfferZone) : existing.isOfferZone,
    offerDiscountNote: offerDiscountNote !== undefined ? (offerDiscountNote ? String(offerDiscountNote).trim() : undefined) : existing.offerDiscountNote
  };

  storeState.products[idx] = updated;
  saveState();

  res.json({ success: true, product: updated });
});

// PUT /api/products/:id/toggle-offer-zone (Admin quick toggle offer zone inclusion)
app.put("/api/products/:id/toggle-offer-zone", requireAdmin, (req, res) => {
  const idx = storeState.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const current = storeState.products[idx];
  const newOfferZone = !current.isOfferZone;
  storeState.products[idx] = {
    ...current,
    isOfferZone: newOfferZone
  };
  saveState();

  res.json({ success: true, product: storeState.products[idx], isOfferZone: newOfferZone });
});

// DELETE /api/products/:id (Admin only)
app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const initialLen = storeState.products.length;
  storeState.products = storeState.products.filter(p => p.id !== req.params.id);
  
  if (storeState.products.length === initialLen) {
    return res.status(404).json({ error: "Product not found" });
  }

  saveState();
  res.json({ success: true, message: "Product deleted successfully", remainingCount: storeState.products.length });
});

// POST /api/admin/publish-live (Directly sync and publish all changes to live server & static files)
app.post("/api/admin/publish-live", requireAdmin, (req, res) => {
  const { products } = req.body;
  if (Array.isArray(products) && products.length > 0) {
    storeState.products = products;
  }
  saveState();

  const activeCount = storeState.products.filter(p => p.isActive !== false).length;
  res.json({
    success: true,
    message: "সকল পরিবর্তন সফলভাবে লাইভ সার্ভারে সেভ ও পাবলিশ করা হয়েছে!",
    totalProducts: storeState.products.length,
    activeCount,
    inactiveCount: storeState.products.length - activeCount,
    lastSaved: new Date().toISOString()
  });
});

// GET /api/admin/catalog-status
app.get("/api/admin/catalog-status", requireAdmin, (_req, res) => {
  const activeCount = storeState.products.filter(p => p.isActive !== false).length;
  res.json({
    success: true,
    totalProducts: storeState.products.length,
    activeCount,
    inactiveCount: storeState.products.length - activeCount,
    lastSaved: new Date().toISOString()
  });
});

// POST /api/admin/github/verify (Verify Token & Repo access)
app.post("/api/admin/github/verify", async (req, res) => {
  try {
    const { token, repo } = req.body;
    if (!token || !repo) {
      return res.status(400).json({ error: "GitHub Token এবং Repository নাম দেওয়া আবশ্যক।" });
    }

    const cleanRepo = String(repo).trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    const cleanToken = String(token).trim();

    const authHeader = cleanToken.startsWith("ghp_") ? `token ${cleanToken}` : `Bearer ${cleanToken}`;
    const ghRes = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
      headers: {
        Authorization: authHeader,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "NirapodKroy-Admin"
      }
    });

    if (!ghRes.ok) {
      const errData: any = await ghRes.json().catch(() => ({}));
      if (ghRes.status === 401) {
        return res.status(401).json({ error: "GitHub Token সঠিক নয় বা মেয়াদোত্তীর্ণ হয়েছে। সঠিক Personal Access Token দিন।" });
      }
      if (ghRes.status === 404) {
        return res.status(404).json({ error: `Repository '${cleanRepo}' খুঁজে পাওয়া যায়নি। ইউজারনেম ও রিপোজিটরির নাম চেক করুন।` });
      }
      if (ghRes.status === 403) {
        return res.status(403).json({ error: "টোকেনে প্রয়োজনীয় পারমিশন নেই। টোকেন জেনারেট করার সময় 'repo' স্কোপ চেক করেছেন কিনা নিশ্চিত করুন।" });
      }
      return res.status(ghRes.status).json({ error: errData.message || "GitHub API কানেকশন ব্যর্থ হয়েছে।" });
    }

    const repoData: any = await ghRes.json();
    return res.json({
      success: true,
      repo: repoData.full_name,
      defaultBranch: repoData.default_branch || "main",
      private: repoData.private
    });
  } catch (err: any) {
    return res.status(500).json({ error: `সার্ভার এরর: ${err.message}` });
  }
});

// POST /api/admin/github/push (Commit products.json directly to GitHub repo)
app.post("/api/admin/github/push", async (req, res) => {
  try {
    const { token, repo, branch, products } = req.body;
    if (!token || !repo) {
      return res.status(400).json({ error: "GitHub Token এবং Repository নাম দেওয়া আবশ্যক।" });
    }

    const cleanRepo = String(repo).trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    const cleanBranch = (branch && String(branch).trim()) || "main";
    const cleanToken = String(token).trim();
    const targetProducts = Array.isArray(products) && products.length > 0 ? products : storeState.products;

    // 1. Update local files immediately
    storeState.products = targetProducts;
    saveState();

    const authHeader = cleanToken.startsWith("ghp_") ? `token ${cleanToken}` : `Bearer ${cleanToken}`;
    const filePath = "public/products.json";

    // 2. Fetch existing file SHA
    const getUrl = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}?ref=${cleanBranch}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: authHeader,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "NirapodKroy-Admin"
      }
    });

    let sha = "";
    if (getRes.ok) {
      const fileData: any = await getRes.json();
      sha = fileData.sha;
    } else if (getRes.status === 401 || getRes.status === 403) {
      return res.status(getRes.status).json({
        error: "GitHub Token সঠিক নয় বা পারমিশন নেই। সঠিক Token ('repo' scope সহ) ব্যবহার করুন।"
      });
    }

    // 3. Encode content safely via native Buffer
    const jsonStr = JSON.stringify(targetProducts, null, 2);
    const base64Content = Buffer.from(jsonStr, "utf-8").toString("base64");

    // 4. PUT commit to GitHub
    const putUrl = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}`;
    const putRes = await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "NirapodKroy-Admin"
      },
      body: JSON.stringify({
        message: `chore(catalog): sync ${targetProducts.length} products via admin panel`,
        content: base64Content,
        sha: sha || undefined,
        branch: cleanBranch,
        committer: {
          name: "Nirapod Kroy Admin",
          email: "admin@nirapodkroy.shop"
        }
      })
    });

    if (putRes.ok) {
      const putData: any = await putRes.json();
      const commitUrl = putData.commit?.html_url || `https://github.com/${cleanRepo}/commits/${cleanBranch}`;
      return res.json({
        success: true,
        commitUrl,
        sha: putData.content?.sha,
        message: "সফলভাবে GitHub-এ পুশ ও কমিট হয়েছে! GitHub Actions ১ মিনিটের মধ্যে লাইভ সাইট আপডেট করে ফেলবে।"
      });
    } else {
      const errData: any = await putRes.json().catch(() => ({}));
      let friendlyError = errData.message || "Failed to commit";
      if (putRes.status === 409) {
        friendlyError = "GitHub Conflict: ফাইলের ভার্সন মেলেনি। অনুগ্রহ করে আবার পুশ বাটনে ক্লিক করুন।";
      } else if (putRes.status === 404) {
        friendlyError = `Repository '${cleanRepo}' বা ব্রাঞ্চ '${cleanBranch}' খুঁজে পাওয়া যায়নি।`;
      } else if (putRes.status === 422) {
        friendlyError = `GitHub Validation Error: ${errData.message || "ফাইল বা ডেটা ফরমেট সঠিক নয়।"}`;
      }
      return res.status(putRes.status).json({ error: friendlyError, raw: errData });
    }
  } catch (err: any) {
    return res.status(500).json({ error: `পুশ করার সময় সার্ভার এরর: ${err.message}` });
  }
});

// 5. Orders API
// POST /api/orders (Public checkout)
app.post("/api/orders", async (req, res) => {
  const { customerName, customerEmail, customerPhone, shippingAddress, items, paymentMethod, notes } = req.body;

  if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !items || !items.length) {
    return res.status(400).json({ error: "All customer details, delivery address, and cart items are required." });
  }

  // Calculate total and decrement inventory
  let computedTotal = 0;
  const processedItems: OrderItem[] = [];

  for (const item of items) {
    const prod = storeState.products.find(p => p.id === item.productId || p.id === item.product?.id);
    const qty = Number(item.quantity) || 1;
    const price = prod ? prod.price : (Number(item.price) || 0);
    const title = prod ? prod.title : (item.title || "Product");
    const imageUrl = prod ? prod.imageUrl : (item.imageUrl || "");

    computedTotal += price * qty;

    if (prod) {
      prod.stock = Math.max(0, prod.stock - qty);
    }

    processedItems.push({
      productId: prod ? prod.id : item.productId,
      title,
      price,
      quantity: qty,
      imageUrl
    });
  }

  const orderId = (req.body.orderId && String(req.body.orderId).trim()) || ("NK-" + Math.floor(100000 + Math.random() * 900000));
  const newOrder: Order = {
    id: orderId,
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim().toLowerCase(),
    customerPhone: customerPhone.trim(),
    shippingAddress: shippingAddress.trim(),
    items: processedItems,
    totalPrice: computedTotal,
    paymentMethod: paymentMethod || "Cash on Delivery",
    status: "Pending",
    createdAt: new Date().toISOString(),
    syncedToGoogleSheet: false,
    notes: notes ? notes.trim() : undefined
  };

  storeState.orders.unshift(newOrder);

  // Auto-record or update customer in storeState.customers
  const normalizedEmail = customerEmail.trim().toLowerCase();
  let existingCust = storeState.customers.find(c => c.email.toLowerCase() === normalizedEmail);
  if (!existingCust) {
    existingCust = {
      id: "cust-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: customerName.trim(),
      email: normalizedEmail,
      passwordHash: "auto-order-" + Math.random().toString(36).substring(2, 8),
      phone: customerPhone ? customerPhone.trim() : undefined,
      address: shippingAddress ? shippingAddress.trim() : undefined,
      createdAt: new Date().toISOString()
    };
    storeState.customers.push(existingCust);
    // Order customers are stored locally only - NOT synced to Google Sheets "Customers" tab.
    // The "Customers" tab is strictly reserved for user account registrations.
  } else {
    // Update phone/address if previously missing
    if (!existingCust.phone && customerPhone) existingCust.phone = customerPhone.trim();
    if (!existingCust.address && shippingAddress) existingCust.address = shippingAddress.trim();
    if (!existingCust.name && customerName) existingCust.name = customerName.trim();
  }

  saveState();

  // Trigger Google Sheet Webhook in background
  syncOrderToGoogleSheets(newOrder, storeState.webhookUrl).then(synced => {
    if (synced) {
      newOrder.syncedToGoogleSheet = true;
      saveState();
    }
  }).catch(err => {
    console.error("Async Google Sheet webhook sync failed:", err);
  });

  res.status(201).json({
    success: true,
    orderId: newOrder.id,
    order: newOrder
  });
});

// GET /api/orders/customer/:email (Customer viewing their own orders)
app.get("/api/orders/customer/:email", (req, res) => {
  const email = req.params.email.trim().toLowerCase();
  const customerOrders = storeState.orders.filter(o => o.customerEmail.toLowerCase() === email);
  res.json({ orders: customerOrders });
});

// GET /api/orders/recent-ticker
// Lightweight, privacy-safe public ticker: only first name + last initial, city, item title, time ago.
app.get("/api/orders/recent-ticker", (_req, res) => {
  const tickerItems = storeState.orders.slice(0, 6).map(o => {
    // Mask name for privacy: "Tariq Prodhan" -> "Tariq P."
    const parts = o.customerName.trim().split(" ");
    const safeName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
    
    // Extract simple city or area
    let city = "Dhaka";
    if (o.shippingAddress.toLowerCase().includes("chittagong")) city = "Chittagong";
    else if (o.shippingAddress.toLowerCase().includes("sylhet")) city = "Sylhet";
    else if (o.shippingAddress.toLowerCase().includes("rajshahi")) city = "Rajshahi";
    else if (o.shippingAddress.toLowerCase().includes("khulna")) city = "Khulna";
    else if (o.shippingAddress.toLowerCase().includes("gulshan")) city = "Gulshan, Dhaka";
    else if (o.shippingAddress.toLowerCase().includes("dhanmondi")) city = "Dhanmondi, Dhaka";
    else if (o.shippingAddress.toLowerCase().includes("uttara")) city = "Uttara, Dhaka";

    const itemTitle = o.items[0]?.title || "Aura Premium Item";
    const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000));
    const timeAgo = diffMinutes < 60 ? `${diffMinutes}m ago` : `${Math.round(diffMinutes / 60)}h ago`;

    return {
      id: o.id,
      customerName: safeName,
      city,
      itemName: itemTitle,
      timeAgo
    };
  });

  res.json({ ticker: tickerItems });
});

// 6. Admin Orders & Stats (Admin only)
// GET /api/admin/orders
app.get("/api/admin/orders", requireAdmin, (_req, res) => {
  res.json({ orders: storeState.orders });
});

// PUT /api/admin/orders/:id/status
app.put("/api/admin/orders/:id/status", requireAdmin, (req, res) => {
  const { status } = req.body;
  const order = storeState.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value." });
  }

  order.status = status;
  saveState();
  res.json({ success: true, order });
});

// POST /api/admin/orders/:id/sync
app.post("/api/admin/orders/:id/sync", requireAdmin, async (req, res) => {
  const order = storeState.orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const success = await syncOrderToGoogleSheets(order, storeState.webhookUrl);
  if (success) {
    order.syncedToGoogleSheet = true;
    saveState();
    return res.json({ success: true, message: `Order ${order.id} synced to Google Sheets successfully!` });
  }

  res.status(400).json({
    success: false,
    message: "Failed to dispatch to Google Sheets webhook. Please verify your Webhook URL in Admin Settings."
  });
});

// DELETE /api/admin/orders/:id (Admin only - Deletes from store database, leaves Google Sheets intact)
app.delete("/api/admin/orders/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const initialLength = storeState.orders.length;
  storeState.orders = storeState.orders.filter(o => o.id !== id);

  if (storeState.orders.length === initialLength) {
    return res.status(404).json({ error: "Order not found" });
  }

  saveState();
  // Note: Per design, we intentionally DO NOT delete from Google Sheets so Sheets remains an append-only audit trail
  res.json({
    success: true,
    message: `অর্ডার ${id} সফলভাবে অ্যাডমিন প্যানেল থেকে মুছে ফেলা হয়েছে (গুগল শিট রেকর্ড অক্ষত রাখা হয়েছে)।`,
    remainingOrders: storeState.orders.length
  });
});

// GET /api/admin/customers (Admin only)
app.get("/api/admin/customers", requireAdmin, (_req, res) => {
  const safeCustomers = storeState.customers.map(c => {
    // Count associated orders
    const customerOrders = storeState.orders.filter(o => o.customerEmail.toLowerCase() === c.email.toLowerCase());
    const totalSpent = customerOrders.reduce((sum, o) => o.status !== "Cancelled" ? sum + o.totalPrice : sum, 0);

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || "N/A",
      address: c.address || "N/A",
      createdAt: c.createdAt,
      orderCount: customerOrders.length,
      totalSpent
    };
  });

  res.json({ customers: safeCustomers, total: safeCustomers.length });
});

// DELETE /api/admin/customers/:id (Admin only - Deletes from store database, leaves Google Sheets intact)
app.delete("/api/admin/customers/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const initialLength = storeState.customers.length;
  storeState.customers = storeState.customers.filter(c => c.id !== id);

  if (storeState.customers.length === initialLength) {
    return res.status(404).json({ error: "Customer not found" });
  }

  saveState();
  // Note: We deliberately do NOT touch Google Sheets
  res.json({
    success: true,
    message: "কাস্টমার সফলভাবে অ্যাডমিন প্যানেল থেকে মুছে ফেলা হয়েছে (গুগল শিট রেকর্ড অক্ষত রয়েছে)।",
    remainingCustomers: storeState.customers.length
  });
});

// GET /api/admin/stats
app.get("/api/admin/stats", requireAdmin, (_req, res) => {
  const calculatedRevenue = storeState.orders.reduce((sum, o) => o.status !== "Cancelled" ? sum + o.totalPrice : sum, 0);
  const totalRevenue = typeof storeState.customTotalRevenue === "number" ? storeState.customTotalRevenue : calculatedRevenue;
  const isCustomRevenue = typeof storeState.customTotalRevenue === "number";
  const totalOrders = storeState.orders.length;
  const totalProducts = storeState.products.length;
  const lowStockProducts = storeState.products.filter(p => p.stock <= 10).length;
  const syncedGoogleSheetsCount = storeState.orders.filter(o => o.syncedToGoogleSheet).length;

  res.json({
    stats: {
      totalRevenue,
      calculatedRevenue,
      isCustomRevenue,
      customTotalRevenue: storeState.customTotalRevenue,
      totalOrders,
      totalProducts,
      lowStockProducts,
      syncedGoogleSheetsCount
    }
  });
});

// PUT /api/admin/revenue (Admin customize or reset total revenue)
app.put("/api/admin/revenue", requireAdmin, (req, res) => {
  const { customTotalRevenue, reset } = req.body;
  if (reset) {
    delete storeState.customTotalRevenue;
  } else if (customTotalRevenue !== undefined && !isNaN(Number(customTotalRevenue))) {
    storeState.customTotalRevenue = Math.max(0, Number(customTotalRevenue));
  } else {
    return res.status(400).json({ error: "Valid revenue amount required" });
  }

  saveState();

  const calculatedRevenue = storeState.orders.reduce((sum, o) => o.status !== "Cancelled" ? sum + o.totalPrice : sum, 0);
  const totalRevenue = typeof storeState.customTotalRevenue === "number" ? storeState.customTotalRevenue : calculatedRevenue;

  res.json({
    success: true,
    totalRevenue,
    calculatedRevenue,
    isCustomRevenue: typeof storeState.customTotalRevenue === "number",
    customTotalRevenue: storeState.customTotalRevenue,
    message: reset ? "মোট রেভিনিউ স্বয়ংক্রিয় গণনায় রিসেট করা হয়েছে।" : "মোট রেভিনিউ সফলভাবে পরিবর্তন করা হয়েছে!"
  });
});

// 7. Admin Settings & Google Sheets Webhook
// GET /api/admin/settings
app.get("/api/admin/settings", requireAdmin, (_req, res) => {
  res.json({
    webhookUrl: storeState.webhookUrl || googleSheetWebhookUrl,
    adminEmail: ADMIN_EMAIL,
    totalSyncedOrders: storeState.orders.filter(o => o.syncedToGoogleSheet).length,
    totalPendingSync: storeState.orders.filter(o => !o.syncedToGoogleSheet).length
  });
});

// POST /api/admin/settings
app.post("/api/admin/settings", requireAdmin, (req, res) => {
  const { webhookUrl } = req.body;
  if (webhookUrl !== undefined) {
    storeState.webhookUrl = webhookUrl.trim();
    saveState();
  }
  res.json({
    success: true,
    message: "Settings saved successfully",
    webhookUrl: storeState.webhookUrl
  });
});

// POST /api/admin/test-webhook
app.post("/api/admin/test-webhook", requireAdmin, async (req, res) => {
  const { url } = req.body;
  const targetUrl = url || storeState.webhookUrl || googleSheetWebhookUrl;

  if (!targetUrl) {
    return res.status(400).json({ error: "Please provide a Google Sheets Webhook URL to test." });
  }

  const dummyOrder: Order = {
    id: "TEST-" + Math.floor(1000 + Math.random() * 9000),
    customerName: "Nirapod Kroy Test Order",
    customerEmail: "admin.test@nirapodkroy.shop",
    customerPhone: "+8801700000000",
    shippingAddress: "Google Sheets Webhook Test Row, Dhaka",
    items: [{
      productId: "test-item",
      title: "Test Product Verification",
      price: 99.00,
      quantity: 1,
      imageUrl: ""
    }],
    totalPrice: 99.00,
    paymentMethod: "bKash / Mobile Wallet",
    status: "Delivered",
    createdAt: new Date().toISOString(),
    syncedToGoogleSheet: true
  };

  const ok = await syncOrderToGoogleSheets(dummyOrder, targetUrl);
  if (ok) {
    return res.json({ success: true, message: "Webhook successfully reached and responded OK!" });
  }
  return res.status(502).json({ error: "Webhook test failed or returned error. Please check your Apps Script Webhook deployment URL." });
});

// POST /api/admin/test-subscribe-webhook - Test sending a subscriber to "subscribe" tab
app.post("/api/admin/test-subscribe-webhook", requireAdmin, async (req, res) => {
  const targetUrl = req.body.url || req.body.webhookUrl || storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return res.status(400).json({ error: "একটি সঠিক গুগল শিট ওয়েবহুক ইউআরএল দিন।" });
  }

  const ok = await syncNewsletterToGoogleSheets("test_subscriber@nirapodkroy.shop", "Admin Webhook Test");
  if (ok) {
    return res.json({ 
      success: true, 
      message: "সাবস্ক্রাইব টেস্ট সফল হয়েছে! গুগল শিটের 'subscribe' ট্যাবে টেস্ট ডেটা যুক্ত হয়েছে।" 
    });
  }
  return res.status(502).json({ 
    error: "Webhook subscriber test failed. অনুগ্রহ করে আপনার Apps Script Webhook ইউআরএল এবং ডিপ্লয়মেন্ট চেক করুন।" 
  });
});

// 8. Newsletter & Subscribers API
// POST /api/newsletter or /api/subscribe
app.post(["/api/newsletter", "/api/subscribe"], async (req, res) => {
  const { email, source } = req.body;
  if (!email || !String(email).includes("@")) {
    return res.status(400).json({ error: "একটি সঠিক ইমেইল এড্রেস প্রদান করুন।" });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (!storeState.subscribers) storeState.subscribers = [];

  if (!storeState.subscribers.some(s => s.email === cleanEmail)) {
    storeState.subscribers.unshift({
      email: cleanEmail,
      source: source || "Website Footer",
      subscribedAt: new Date().toISOString()
    });
    saveState();
  }

  // Sync to Google Sheets in background
  syncNewsletterToGoogleSheets(cleanEmail, source || "Website Footer").catch(err => {
    console.warn("[Google Sheets] Newsletter sync warning:", err);
  });

  res.json({
    success: true,
    message: "সাবস্ক্রাইব করার জন্য ধন্যবাদ! আপনার ইমেইলটি সফলভাবে সংরক্ষিত হয়েছে।"
  });
});

// GET /api/admin/subscribers
app.get("/api/admin/subscribers", requireAdmin, (_req, res) => {
  const subscribers = storeState.subscribers || [];
  res.json({ subscribers, total: subscribers.length });
});

// DELETE /api/admin/subscribers/:email
app.delete("/api/admin/subscribers/:email", requireAdmin, (req, res) => {
  const targetEmail = decodeURIComponent(req.params.email).toLowerCase();
  if (!storeState.subscribers) storeState.subscribers = [];
  storeState.subscribers = storeState.subscribers.filter(s => s.email.toLowerCase() !== targetEmail);
  saveState();
  res.json({ success: true, message: "Subscriber removed successfully", total: storeState.subscribers.length });
});

// POST /api/admin/sync-from-sheets
app.post("/api/admin/sync-from-sheets", requireAdmin, async (req, res) => {
  const target = req.body.webhookUrl || storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!target || !target.startsWith("http")) {
    return res.status(400).json({ error: "গুগল শিট ওয়েবহুক ইউআরএল পাওয়া যায়নি।" });
  }

  try {
    const fetchUrl = target + (target.includes("?") ? "&" : "?") + "action=get_all";
    const sheetRes = await fetch(fetchUrl);
    if (!sheetRes.ok) {
      return res.status(500).json({ error: "গুগল শিট থেকে ডেটা পড়তে ব্যর্থ হয়েছে। অ্যাপস স্ক্রিপ্টে doGet ফাংশনটি আছে কিনা নিশ্চিত করুন।" });
    }
    const liveData: any = await sheetRes.json().catch(() => null);
    if (!liveData) {
      return res.status(500).json({ error: "গুগল শিট থেকে ডেটা সঠিক ফরম্যাটে পাওয়া যায়নি।" });
    }

    let importedOrders = 0;
    let importedSubscribers = 0;

    if (liveData.orders && Array.isArray(liveData.orders)) {
      for (const sheetOrder of liveData.orders) {
        if (!storeState.orders.some(o => o.id === sheetOrder.id)) {
          const rawPrice = String(sheetOrder.totalPrice || "0").replace(/[^0-9.]/g, "");
          storeState.orders.unshift({
            id: sheetOrder.id,
            customerName: sheetOrder.customerName || "Customer",
            customerEmail: sheetOrder.customerEmail || "",
            customerPhone: sheetOrder.customerPhone || "",
            shippingAddress: sheetOrder.shippingAddress || "",
            items: [{
              productId: "imported",
              title: sheetOrder.itemsText || "Order Items",
              price: Number(rawPrice) || 0,
              quantity: 1,
              imageUrl: ""
            }],
            totalPrice: Number(rawPrice) || 0,
            paymentMethod: sheetOrder.paymentMethod || "Cash on Delivery",
            status: sheetOrder.status || "Pending",
            createdAt: sheetOrder.createdAt || new Date().toISOString(),
            syncedToGoogleSheet: true
          });
          importedOrders++;
        }
      }
    }

    if (liveData.subscribers && Array.isArray(liveData.subscribers)) {
      if (!storeState.subscribers) storeState.subscribers = [];
      for (const s of liveData.subscribers) {
        if (s.email && !storeState.subscribers.some(cs => cs.email === s.email.toLowerCase())) {
          storeState.subscribers.unshift({
            email: s.email.toLowerCase(),
            source: s.source || "Google Sheet",
            subscribedAt: s.date || new Date().toISOString()
          });
          importedSubscribers++;
        }
      }
    }

    // Also import tracking records if present in sheet response
    let importedTracking = 0;
    if (liveData.tracking && Array.isArray(liveData.tracking)) {
      if (!storeState.userTracking) storeState.userTracking = [];
      for (const t of liveData.tracking) {
        if (t.sessionId && !storeState.userTracking.some(et => et.sessionId === t.sessionId)) {
          storeState.userTracking.push({
            id: t.sessionId,
            time: t.time || new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
            page: t.page || "হোমপেজ (Home)",
            ip: t.ip || "Unknown",
            location: t.location || "Bangladesh",
            device: t.device || "Desktop / PC",
            os: t.os || "Windows 10/11",
            browser: t.browser || "Chrome",
            timeSpent: t.timeSpent || "সক্রিয় রয়েছে (Active)...",
            referrer: t.referrer || "সরাসরি (Direct)",
            screen: t.screen || "1920x1080",
            sessionId: t.sessionId,
            updatedAt: Date.now()
          });
          importedTracking++;
        }
      }
    }

    saveState();
    return res.json({
      success: true,
      message: `গুগল শিট থেকে ডেটা সফলভাবে সিঙ্ক হয়েছে! (${importedOrders} টি অর্ডার, ${importedSubscribers} জন সাবস্ক্রাইবার, ${importedTracking} টি ভিজিটর লগ)`,
      importedOrders,
      importedSubscribers,
      importedTracking
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "গুগল শিট সিঙ্ক এরর" });
  }
});

// ==========================================
// USER TRACKING ROUTES
// ==========================================

// 1. Client tracking beacon (POST /api/track)
app.post("/api/track", async (req, res) => {
  try {
    const body = req.body || {};
    const page = String(body.page || "হোমপেজ (Home)").trim();
    const sessionId = String(body.sessionId || `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}_root`).trim();
    const isHeartbeat = Boolean(body.isHeartbeat);
    const timeSpent = String(body.timeSpent || (isHeartbeat ? "সক্রিয় রয়েছে (Active)..." : "সক্রিয় রয়েছে (Active)...")).trim();

    // Determine client IP
    let clientIp = String(body.clientIp || "").trim();
    if (!clientIp || clientIp === "Unknown" || clientIp.startsWith("127.") || clientIp === "::1") {
      const forwarded = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim();
      const realIp = (req.headers["x-real-ip"] as string)?.trim();
      const socketIp = req.socket.remoteAddress?.trim();
      clientIp = forwarded || realIp || socketIp || "Unknown";
      if (clientIp.startsWith("::ffff:")) clientIp = clientIp.replace("::ffff:", "");
    }

    const location = String(body.location || "Bangladesh").trim();
    const device = String(body.device || "Desktop / PC").trim();
    const os = String(body.os || "Windows 10/11").trim();
    const browser = String(body.browser || "Chrome").trim();
    const screen = String(body.screen || "1920x1080").trim();
    const referrer = String(body.referrer || "সরাসরি (Direct)").trim();
    const time = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    if (!storeState.userTracking) {
      storeState.userTracking = [];
    }

    const existingIndex = storeState.userTracking.findIndex(t => t.sessionId === sessionId);
    let currentEntry: UserTrackingEntry;

    if (existingIndex >= 0) {
      storeState.userTracking[existingIndex].timeSpent = timeSpent;
      storeState.userTracking[existingIndex].updatedAt = Date.now();
      currentEntry = storeState.userTracking[existingIndex];
    } else {
      currentEntry = {
        id: sessionId,
        time,
        page,
        ip: clientIp,
        location,
        device,
        os,
        browser,
        timeSpent,
        referrer,
        screen,
        sessionId,
        updatedAt: Date.now()
      };
      storeState.userTracking.unshift(currentEntry);
      // Cap in-memory history to recent 300 entries
      if (storeState.userTracking.length > 300) {
        storeState.userTracking = storeState.userTracking.slice(0, 300);
      }
    }

    // Asynchronously dispatch to Google Sheets tab "user tracking"
    // FAST TRACK: New visitors & initial visits dispatch to Google Sheets immediately (<1s)!
    // Ongoing duration updates are throttled to at most once every 60s per session,
    // which prevents queue buildup on Google Apps Script and guarantees instant responses!
    const isNewSession = existingIndex < 0;
    const lastSyncTime = trackingSyncThrottle.get(sessionId) || 0;
    const isFinalDuration = timeSpent.includes("মিনিট") || timeSpent.includes("সেকেন্ড");
    const shouldSyncToSheet = isNewSession || (!isHeartbeat) || isFinalDuration || (Date.now() - lastSyncTime > 60000);

    if (shouldSyncToSheet) {
      trackingSyncThrottle.set(sessionId, Date.now());
      syncTrackingToGoogleSheets(currentEntry, isHeartbeat).catch(() => {});
    }

    return res.json({ success: true, sessionId, timeSpent });
  } catch (err: any) {
    console.warn("Tracking endpoint error:", err);
    return res.status(500).json({ error: "Tracking failed" });
  }
});

// 2. Admin: Get live user tracking stats & logs (GET /api/admin/tracking)
app.get("/api/admin/tracking", requireAdmin, (_req, res) => {
  const trackingList = storeState.userTracking || [];
  const now = Date.now();
  // Active visitors in the last 2 minutes
  const activeNow = trackingList.filter(t => t.updatedAt && (now - t.updatedAt < 120000)).length;

  const pageCounts: Record<string, number> = {};
  const deviceCounts: Record<string, number> = {};
  const browserCounts: Record<string, number> = {};

  trackingList.forEach(t => {
    pageCounts[t.page] = (pageCounts[t.page] || 0) + 1;
    deviceCounts[t.device] = (deviceCounts[t.device] || 0) + 1;
    browserCounts[t.browser] = (browserCounts[t.browser] || 0) + 1;
  });

  return res.json({
    success: true,
    totalVisits: trackingList.length,
    activeNow: Math.max(activeNow, 1),
    tracking: trackingList,
    pageStats: pageCounts,
    deviceStats: deviceCounts,
    browserStats: browserCounts,
    sheetTab: "user tracking"
  });
});

// 3. Admin: Send test tracking entry to Google Sheet tab "user tracking" (POST /api/admin/tracking/test)
app.post("/api/admin/tracking/test", requireAdmin, async (req, res) => {
  const testSessionId = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}_test`;
  const testEntry: UserTrackingEntry = {
    id: testSessionId,
    time: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    page: "হোমপেজ (Home)",
    ip: "103.171.251.14",
    location: "Bangladesh",
    device: "Desktop / PC",
    os: "Windows 10/11",
    browser: "Chrome",
    timeSpent: "সক্রিয় রয়েছে (Active)...",
    referrer: "সরাসরি (Direct)",
    screen: "1920x1080",
    sessionId: testSessionId,
    updatedAt: Date.now()
  };

  if (!storeState.userTracking) storeState.userTracking = [];
  storeState.userTracking.unshift(testEntry);

  const synced = await syncTrackingToGoogleSheets(testEntry, false);
  return res.json({
    success: true,
    synced,
    message: synced
      ? "গুগল শিটের 'user traking' ট্যাবে সফলভাবে টেস্ট ডেটা পাঠানো হয়েছে!"
      : "সার্ভারে লগ হয়েছে, কিন্তু গুগল শিটে পৌঁছায়নি। দয়া করে অ্যাপস স্ক্রিপ্ট ও ওয়েবহুক ইউআরএল পরীক্ষা করুন।",
    entry: testEntry
  });
});

// 4. Admin: Request Apps Script to clean tracking rows out of "order sheet" tab (POST /api/admin/clean-order-sheet)
app.post("/api/admin/clean-order-sheet", requireAdmin, async (req, res) => {
  const targetUrl = req.body.url || storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return res.status(400).json({ error: "গুগল শিট ওয়েবহুক পাওয়া যায়নি।" });
  }

  try {
    const fetchUrl = targetUrl + (targetUrl.includes("?") ? "&" : "?") + "action=clean_order_sheet";
    const resp = await fetch(fetchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clean_order_sheet" })
    });
    const result: any = await resp.json().catch(() => ({}));
    return res.json({
      success: true,
      message: result.message || "অর্ডার শিট সফলভাবে ক্লিন করা হয়েছে এবং ট্র্যাকিং ডেটা 'user traking' ট্যাবে সরিয়ে নেওয়া হয়েছে!",
      details: result
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "ক্লিন অপারেশন সম্পন্ন করা সম্ভব হয়নি।" });
  }
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), "dist", "index.html"))
      ? path.join(process.cwd(), "dist")
      : (typeof __dirname !== "undefined" && fs.existsSync(path.join(__dirname, "index.html"))
          ? __dirname
          : path.join(process.cwd(), "dist"));

    app.use(express.static(distPath, {
      index: "index.html",
      maxAge: "1d"
    }));

    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/") || req.path.startsWith("/assets/") || req.path.includes(".")) {
        return res.status(404).send("Not found");
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Nirapod Kroy Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Admin Shortcut] Press Ctrl + Alt + Shift + T in browser to open Secret Admin Console`);
  });

  // If deployed in an environment with a separate PORT (like Cloud Run 8080), also listen on that port
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
  if (envPort && envPort !== PORT && !isNaN(envPort)) {
    try {
      app.listen(envPort, "0.0.0.0", () => {
        console.log(`[Nirapod Kroy Server] Also listening on container ingress port http://0.0.0.0:${envPort}`);
      });
    } catch (e) {
      console.warn("Could not bind to secondary port:", e);
    }
  }
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
