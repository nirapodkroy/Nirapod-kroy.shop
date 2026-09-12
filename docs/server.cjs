var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
app.use(import_express.default.urlencoded({ extended: true }));
var DATA_FILE = import_path.default.join(process.cwd(), ".app_store_data.json");
var ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "mtarifprodhan@gmail.com").trim().toLowerCase();
var ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "AdminSecurePass2026!").trim();
var googleSheetWebhookUrl = (process.env.GOOGLE_SHEET_WEBHOOK_URL || "").trim();
var DEFAULT_PRODUCTS = [
  // 1. Groceries & Organic Food
  {
    id: "prod-groc-1",
    title: "\u0996\u09BE\u0981\u099F\u09BF \u0998\u09BE\u09A8\u09BF-\u09AD\u09BE\u0999\u09BE \u09B8\u09B0\u09BF\u09B7\u09BE\u09B0 \u09A4\u09C7\u09B2 (Pure Mustard Oil, 1L)",
    description: "\u09E7\u09E6\u09E6% \u0996\u09BE\u0981\u099F\u09BF \u0995\u09BE\u09A0\u09C7\u09B0 \u0998\u09BE\u09A8\u09BF\u09A4\u09C7 \u09AD\u09BE\u0999\u09BE \u09A6\u09C7\u09B6\u09BF \u09B8\u09B0\u09BF\u09B7\u09BE\u09B0 \u09A4\u09C7\u09B2\u0964 \u099D\u09BE\u0981\u099D\u09BE\u09B2\u09CB \u09B8\u09C1\u09AC\u09BE\u09B8, \u0995\u09C7\u09AE\u09BF\u0995\u09CD\u09AF\u09BE\u09B2 \u0993 \u09AD\u09C7\u099C\u09BE\u09B2\u09AE\u09C1\u0995\u09CD\u09A4 \u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995 \u09A4\u09C7\u09B2\u0964",
    price: 340,
    regularPrice: 380,
    category: "Groceries",
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    ratingCount: 230,
    badge: "\u09E7\u09E6\u09E6% \u0996\u09BE\u0981\u099F\u09BF",
    featured: true
  },
  {
    id: "prod-groc-2",
    title: "\u09B8\u09C1\u09A8\u09CD\u09A6\u09B0\u09AC\u09A8\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995 \u099A\u09BE\u0995\u09C7\u09B0 \u09AE\u09A7\u09C1 (Sundarbans Honey, 500g)",
    description: "\u09B8\u09C1\u09A8\u09CD\u09A6\u09B0\u09AC\u09A8\u09C7\u09B0 \u0997\u09AD\u09C0\u09B0 \u099C\u0999\u09CD\u0997\u09B2 \u09A5\u09C7\u0995\u09C7 \u09B8\u0982\u0997\u09C3\u09B9\u09C0\u09A4 \u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995 \u099A\u09BE\u0995\u09C7\u09B0 \u0995\u09BE\u0981\u099A\u09BE \u09AE\u09A7\u09C1\u0964 \u0995\u09CB\u09A8\u09CB \u09A7\u09B0\u09A8\u09C7\u09B0 \u09AA\u09CD\u09B0\u0995\u09CD\u09B0\u09BF\u09AF\u09BC\u09BE\u099C\u09BE\u09A4\u0995\u09B0\u09A3 \u0993 \u099A\u09BF\u09A8\u09BF\u09AE\u09C1\u0995\u09CD\u09A4\u0964",
    price: 580,
    regularPrice: 650,
    category: "Groceries",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 5,
    ratingCount: 185,
    badge: "\u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995",
    featured: true
  },
  {
    id: "prod-groc-3",
    title: "\u09AA\u09CD\u09B0\u09BF\u09AE\u09BF\u09AF\u09BC\u09BE\u09AE \u099A\u09BF\u09A8\u09BF\u0997\u09C1\u0981\u09A1\u09BC\u09BE \u09B8\u09C1\u0997\u09A8\u09CD\u09A7\u09BF \u09AA\u09CB\u09B2\u09BE\u0993 \u099A\u09BE\u09B2 (Chinigura Rice, 5kg)",
    description: "\u09A6\u09BF\u09A8\u09BE\u099C\u09AA\u09C1\u09B0\u09C7\u09B0 \u09AC\u09BF\u0996\u09CD\u09AF\u09BE\u09A4 \u099A\u09BF\u0995\u09A8 \u0993 \u09B8\u09C1\u09AC\u09BE\u09B8\u09BF\u09A4 \u099A\u09BF\u09A8\u09BF\u0997\u09C1\u0981\u09A1\u09BC\u09BE \u099A\u09BE\u09B2\u0964 \u09AC\u09BF\u09B0\u09BF\u09AF\u09BC\u09BE\u09A8\u09BF, \u09AA\u09CB\u09B2\u09BE\u0993 \u0993 \u09AA\u09BE\u09AF\u09BC\u09C7\u09B8 \u09B0\u09BE\u09A8\u09CD\u09A8\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u0986\u09A6\u09B0\u09CD\u09B6\u0964",
    price: 690,
    regularPrice: 750,
    category: "Groceries",
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.8,
    ratingCount: 140,
    badge: "\u09B8\u09C7\u09B0\u09BE \u09AE\u09BE\u09A8",
    featured: false
  },
  {
    id: "prod-groc-4",
    title: "\u0996\u09BE\u0981\u099F\u09BF \u0997\u09BE\u0993\u09DF\u09BE \u0998\u09BF - \u09A6\u09C7\u09B6\u09BF \u0997\u09B0\u09C1\u09B0 \u09A6\u09C1\u09A7\u09C7\u09B0 \u0998\u09BF (Pure Cow Ghee, 400g)",
    description: "\u0997\u09CD\u09B0\u09BE\u09AE\u09C7\u09B0 \u09A6\u09C7\u09B6\u09BF \u0997\u09BE\u09AD\u09C0\u09B0 \u0996\u09BE\u0981\u099F\u09BF \u09A6\u09C1\u09A7\u09C7\u09B0 \u09AE\u09BE\u0996\u09A8 \u09A5\u09C7\u0995\u09C7 \u09A4\u09C8\u09B0\u09BF \u09B8\u09C1\u09B8\u09CD\u09AC\u09BE\u09A6\u09C1 \u0993 \u09A6\u09BE\u09A8\u09BE\u09A6\u09BE\u09B0 \u0997\u09BE\u0993\u09AF\u09BC\u09BE \u0998\u09BF\u0964",
    price: 720,
    regularPrice: 820,
    category: "Groceries",
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=800&q=80"
    ],
    rating: 4.9,
    ratingCount: 95,
    badge: "\u09A6\u09BE\u09A8\u09BE\u09A6\u09BE\u09B0 \u0998\u09BF",
    featured: true
  },
  {
    id: "prod-groc-5",
    title: "\u09B0\u09DF\u09CD\u09AF\u09BE\u09B2 \u09AE\u09BF\u0995\u09CD\u09B8\u09A1 \u09A1\u09CD\u09B0\u09BE\u0987 \u09AB\u09CD\u09B0\u09C1\u099F\u09B8 \u0993 \u09AC\u09BE\u09A6\u09BE\u09AE (Mixed Nuts & Dry Fruits, 500g)",
    description: "\u0995\u09BE\u09A0\u09AC\u09BE\u09A6\u09BE\u09AE, \u0995\u09BE\u099C\u09C1\u09AC\u09BE\u09A6\u09BE\u09AE, \u09AA\u09C7\u09B8\u09CD\u09A4\u09BE\u09AC\u09BE\u09A6\u09BE\u09AE, \u0986\u0996\u09B0\u09CB\u099F \u0993 \u09AA\u09CD\u09B0\u09BF\u09AE\u09BF\u09AF\u09BC\u09BE\u09AE \u0995\u09BF\u09B8\u09AE\u09BF\u09B8\u09C7\u09B0 \u09AA\u09C1\u09B7\u09CD\u099F\u09BF\u0995\u09B0 \u09B8\u09CD\u09AC\u09BE\u09B8\u09CD\u09A5\u09CD\u09AF\u0995\u09B0 \u09B8\u0982\u09AE\u09BF\u09B6\u09CD\u09B0\u09A3\u0964",
    price: 790,
    regularPrice: 920,
    category: "Groceries",
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 110,
    badge: "\u09AA\u09C1\u09B7\u09CD\u099F\u09BF\u0995\u09B0",
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
    badge: "\u09AB\u09BE\u09B8\u09CD\u099F \u099A\u09BE\u09B0\u09CD\u099C",
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
    title: "\u09AA\u09CD\u09B0\u09BF\u09AE\u09BF\u09AF\u09BC\u09BE\u09AE \u09B8\u09C7\u09AE\u09BF-\u09AB\u09BF\u099F \u0995\u099F\u09A8 \u098F\u09AE\u09AC\u09CD\u09B0\u09AF\u09BC\u09A1\u09BE\u09B0\u09BF \u09AA\u09BE\u099E\u09CD\u099C\u09BE\u09AC\u09BF (Men's Panjabi)",
    description: "\u09E7\u09E6\u09E6% \u09AA\u09CD\u09B0\u09BF\u09AE\u09BF\u09DF\u09BE\u09AE \u09B8\u09C1\u09A4\u09BF \u0995\u09BE\u09AA\u09DC\u09C7 \u09A4\u09C8\u09B0\u09BF \u0986\u09B0\u09BE\u09AE\u09A6\u09BE\u09DF\u0995 \u09A1\u09BF\u099C\u09BE\u0987\u09A8\u09BE\u09B0 \u09AA\u09BE\u099E\u09CD\u099C\u09BE\u09AC\u09BF\u0964 \u0986\u09AD\u09BF\u099C\u09BE\u09A4\u09CD\u09AF\u09AA\u09C2\u09B0\u09CD\u09A3 \u09B8\u09C2\u099A\u09BF\u0995\u09B0\u09CD\u09AE \u0993 \u09B8\u09CD\u09A8\u09CD\u09AF\u09BE\u09AA \u09AC\u09BE\u099F\u09A8 \u09AB\u09BF\u09A8\u09BF\u09B6\u09BF\u0982\u0964",
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
    badge: "\u09B8\u09C7\u09B0\u09BE \u09AA\u09BE\u099E\u09CD\u099C\u09BE\u09AC\u09BF",
    featured: true
  },
  {
    id: "prod-fash-2",
    title: "\u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0 \u09A4\u09BE\u0981\u09A4\u09C7\u09B0 \u09B8\u09C1\u09A4\u09BF \u099C\u09BE\u09AE\u09A6\u09BE\u09A8\u09BF \u09B6\u09BE\u09A1\u09BC\u09BF (Traditional Saree)",
    description: "\u09A6\u0995\u09CD\u09B7 \u09A4\u09BE\u0981\u09A4\u09BF\u09A6\u09C7\u09B0 \u09B9\u09BE\u09A4\u09C7 \u09AC\u09CB\u09A8\u09BE \u09A8\u09B0\u09AE \u09B8\u09C1\u09A4\u09BF \u099C\u09BE\u09AE\u09A6\u09BE\u09A8\u09BF \u09B6\u09BE\u09A1\u09BC\u09BF\u0964 \u0986\u09B0\u09BE\u09AE\u09A6\u09BE\u09AF\u09BC\u0995 \u09AA\u09B0\u09BF\u09A7\u09BE\u09A8 \u0993 \u0989\u09CE\u09B8\u09AC\u09AE\u09C1\u0996\u09B0 \u09A1\u09BF\u099C\u09BE\u0987\u09A8\u09C7\u09B0 \u0985\u09AA\u09C2\u09B0\u09CD\u09AC \u09AE\u09C7\u09B2\u09AC\u09A8\u09CD\u09A7\u09A8\u0964",
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
    badge: "\u0990\u09A4\u09BF\u09B9\u09CD\u09AF\u09AC\u09BE\u09B9\u09C0",
    featured: true
  },
  {
    id: "prod-fash-3",
    title: "\u099C\u09C7\u09A8\u09C1\u0987\u09A8 \u09B2\u09C7\u09A6\u09BE\u09B0 \u09AC\u09BE\u0987\u09AB\u09CB\u09B2\u09CD\u09A1 \u0993\u09DF\u09BE\u09B2\u09C7\u099F \u0993 \u09AC\u09C7\u09B2\u09CD\u099F \u0995\u09AE\u09CD\u09AC\u09CB \u0997\u09BF\u09AB\u099F \u09AC\u0995\u09CD\u09B8",
    description: "\u0986\u09B8\u09B2 \u09AB\u09C1\u09B2-\u0997\u09CD\u09B0\u09C7\u0987\u09A8 \u099A\u09BE\u09AE\u09A1\u09BC\u09BE\u09B0 \u09A4\u09C8\u09B0\u09BF \u099F\u09C7\u0995\u09B8\u0987 \u09AA\u09C1\u09B0\u09C1\u09B7\u09A6\u09C7\u09B0 \u09AE\u09BE\u09A8\u09BF\u09AC\u09CD\u09AF\u09BE\u0997 \u098F\u09AC\u0982 \u09AE\u09CD\u09AF\u09BE\u099A\u09BF\u0982 \u09B0\u09BF\u09AD\u09BE\u09B0\u09CD\u09B8\u09BF\u09AC\u09B2 \u09AC\u09C7\u09B2\u09CD\u099F \u0997\u09BF\u09AB\u099F \u09B8\u09C7\u099F\u0964",
    price: 1350,
    regularPrice: 1700,
    category: "Fashion",
    stock: 32,
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    ratingCount: 112,
    badge: "\u09E7\u09E6\u09E6% \u099A\u09BE\u09AE\u09A1\u09BC\u09BE",
    featured: false
  },
  {
    id: "prod-fash-4",
    title: "\u0986\u09B2\u09CD\u099F\u09CD\u09B0\u09BE-\u0995\u09AE\u09CD\u09AB\u09CB\u09B0\u09CD\u099F \u0995\u09CD\u09B2\u09BE\u09B8\u09BF\u0995 \u0995\u09CD\u09AF\u09BE\u099C\u09C1\u09AF\u09BC\u09BE\u09B2 \u09B8\u09CD\u09A8\u09BF\u0995\u09BE\u09B0\u09CD\u09B8 (Casual Sneakers)",
    description: "\u09B8\u09BE\u09B0\u09BE\u09A6\u09BF\u09A8 \u09B9\u09BE\u0981\u099F\u09BE\u099A\u09B2\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u0995\u09C1\u09B6\u09A8\u09AF\u09C1\u0995\u09CD\u09A4 \u0986\u09B0\u09BE\u09AE\u09A6\u09BE\u09DF\u0995 \u0993 \u099F\u09CD\u09B0\u09C7\u09A8\u09CD\u09A1\u09BF \u09B8\u09CD\u09A8\u09BF\u0995\u09BE\u09B0\u09CD\u09B8\u0964 \u09AC\u09CD\u09B0\u09BF\u09A6\u09C7\u09AC\u09B2 \u09AB\u09CD\u09AF\u09BE\u09AC\u09CD\u09B0\u09BF\u0995 \u0993 \u0997\u09CD\u09B0\u09BF\u09AA \u09B8\u09CB\u09B2\u0964",
    price: 1680,
    regularPrice: 2100,
    category: "Fashion",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 94,
    badge: "\u099F\u09CD\u09B0\u09C7\u09A8\u09CD\u09A1\u09BF",
    featured: false
  },
  // 4. Health & Beauty
  {
    id: "prod-beau-1",
    title: "\u09E7\u09E6\u09E6% \u09AA\u09BF\u0993\u09B0 \u0985\u09B0\u09CD\u0997\u09BE\u09A8\u09BF\u0995 \u0985\u09CD\u09AF\u09BE\u09B2\u09CB\u09AD\u09C7\u09B0\u09BE \u09B8\u09C1\u09A6\u09BF\u0982 \u099C\u09C7\u09B2 (Aloe Vera Gel, 300ml)",
    description: "\u09A4\u09CD\u09AC\u0995 \u0993 \u099A\u09C1\u09B2\u09C7\u09B0 \u0997\u09AD\u09C0\u09B0 \u0986\u09B0\u09CD\u09A6\u09CD\u09B0\u09A4\u09BE \u0993 \u09B6\u09C0\u09A4\u09B2\u09A4\u09BE \u09A7\u09B0\u09C7 \u09B0\u09BE\u0996\u09A4\u09C7 \u0996\u09BE\u0981\u099F\u09BF \u0985\u09CD\u09AF\u09BE\u09B2\u09CB\u09AD\u09C7\u09B0\u09BE \u09A8\u09BF\u09B0\u09CD\u09AF\u09BE\u09B8\u0964 \u09B8\u09BE\u09A8\u09AC\u09BE\u09B0\u09CD\u09A8 \u0993 \u09B6\u09C1\u09B7\u09CD\u0995 \u09A4\u09CD\u09AC\u0995\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u0989\u09AA\u09AF\u09C1\u0995\u09CD\u09A4\u0964",
    price: 380,
    regularPrice: 450,
    category: "Health & Beauty",
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 175,
    badge: "\u0985\u09B0\u09CD\u0997\u09BE\u09A8\u09BF\u0995",
    featured: true
  },
  {
    id: "prod-beau-2",
    title: "\u09B9\u09BE\u09B0\u09AC\u09BE\u09B2 \u09B9\u09C7\u09AF\u09BC\u09BE\u09B0 \u09AB\u09B2 \u0995\u09A8\u09CD\u099F\u09CD\u09B0\u09CB\u09B2 \u09B0\u09BF\u0997\u09CD\u09B0\u09CB\u09A5 \u0985\u09DF\u09C7\u09B2 (Ayurvedic Hair Oil, 200ml)",
    description: "\u0986\u09AE\u09B2\u0995\u09BF, \u09AE\u09C7\u09A5\u09BF, \u0995\u09BE\u09B2\u09CB\u099C\u09BF\u09B0\u09BE \u0993 \u09AD\u09CD\u09B0\u09C2\u0999\u09CD\u0997\u09B0\u09BE\u099C \u09B8\u09AE\u09C3\u09A6\u09CD\u09A7 \u09AD\u09C7\u09B7\u099C \u09A4\u09C7\u09B2 \u09AF\u09BE \u099A\u09C1\u09B2 \u09AA\u09DC\u09BE \u09B0\u09CB\u09A7 \u0995\u09B0\u09C7 \u098F\u09AC\u0982 \u09A8\u09A4\u09C1\u09A8 \u099A\u09C1\u09B2 \u0997\u099C\u09BE\u09A4\u09C7 \u09B8\u09BE\u09B9\u09BE\u09AF\u09CD\u09AF \u0995\u09B0\u09C7\u0964",
    price: 490,
    regularPrice: 580,
    category: "Health & Beauty",
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1608248597359-548c26bc7d66?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 120,
    badge: "\u09AD\u09C7\u09B7\u099C \u09AF\u09A4\u09CD\u09A8",
    featured: false
  },
  {
    id: "prod-beau-3",
    title: "\u09B9\u09BE\u0987\u09A1\u09CD\u09B0\u09C7\u099F\u09BF\u0982 \u09AC\u09CD\u09B0\u09A1 \u09B8\u09CD\u09AA\u09C7\u0995\u099F\u09CD\u09B0\u09BE\u09AE SPF 50+ PA+++ \u09B8\u09BE\u09A8\u09B8\u09CD\u0995\u09CD\u09B0\u09BF\u09A8 (50ml)",
    description: "\u09A8\u09A8-\u0997\u09CD\u09B0\u09BF\u099C\u09BF, \u09B9\u09CB\u09AF\u09BC\u09BE\u0987\u099F \u0995\u09BE\u09B8\u09CD\u099F \u09AE\u09C1\u0995\u09CD\u09A4 \u0986\u09B2\u09CD\u099F\u09CD\u09B0\u09BE-\u09B2\u09BE\u0987\u099F\u0993\u09AF\u09BC\u09C7\u099F \u09B8\u09BE\u09A8\u09B8\u09CD\u0995\u09CD\u09B0\u09BF\u09A8\u0964 \u0995\u09CD\u09B7\u09A4\u09BF\u0995\u09B0 UVA \u0993 UVB \u09B0\u09B6\u09CD\u09AE\u09BF \u09A5\u09C7\u0995\u09C7 \u09A6\u09C0\u09B0\u09CD\u0998\u09B8\u09CD\u09A5\u09BE\u09AF\u09BC\u09C0 \u09B8\u09C1\u09B0\u0995\u09CD\u09B7\u09BE\u0964",
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
    title: "\u09A1\u09BF\u099C\u09BF\u099F\u09BE\u09B2 \u09B8\u09CD\u09AE\u09BE\u09B0\u09CD\u099F \u098F\u09AF\u09BC\u09BE\u09B0 \u09AB\u09CD\u09B0\u09BE\u09AF\u09BC\u09BE\u09B0 \u09EA.\u09EB \u09B2\u09BF\u099F\u09BE\u09B0 (Digital Air Fryer)",
    description: "\u09EE\u09EB% \u0995\u09AE \u09A4\u09C7\u09B2\u09C7 \u09AE\u09C1\u099A\u09AE\u09C1\u099A\u09C7 \u0993 \u09B8\u09CD\u09AC\u09BE\u09B8\u09CD\u09A5\u09CD\u09AF\u09B8\u09AE\u09CD\u09AE\u09A4 \u0996\u09BE\u09AC\u09BE\u09B0 \u09A4\u09C8\u09B0\u09BF\u09B0 \u09B8\u09CD\u09AE\u09BE\u09B0\u09CD\u099F \u098F\u09AF\u09BC\u09BE\u09B0 \u09AB\u09CD\u09B0\u09BE\u09AF\u09BC\u09BE\u09B0\u0964 \u09EE\u099F\u09BF \u09AA\u09CD\u09B0\u09BF-\u09B8\u09C7\u099F \u09A1\u09BF\u099C\u09BF\u099F\u09BE\u09B2 \u0995\u09C1\u0995\u09BF\u0982 \u09AE\u09CB\u09A1\u0964",
    price: 4250,
    regularPrice: 5200,
    category: "Home & Kitchen",
    stock: 14,
    imageUrl: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 65,
    badge: "\u0985\u09DF\u09C7\u09B2-\u09AB\u09CD\u09B0\u09BF",
    featured: true
  },
  {
    id: "prod-home-2",
    title: "\u09A8\u09A8-\u09B8\u09CD\u099F\u09BF\u0995 \u0997\u09CD\u09B0\u09BE\u09A8\u09BE\u0987\u099F \u09EB-\u09AA\u09BF\u09B8 \u0995\u09C1\u0995\u0993\u09AF\u09BC\u09CD\u09AF\u09BE\u09B0 \u09B8\u09C7\u099F (Granite Cookware Set)",
    description: "PFOA \u09AE\u09C1\u0995\u09CD\u09A4 \u099C\u09BE\u09B0\u09CD\u09AE\u09BE\u09A8\u09BF \u099F\u09C7\u0995\u09A8\u09CB\u09B2\u099C\u09BF \u0997\u09CD\u09B0\u09BE\u09A8\u09BE\u0987\u099F \u0995\u09CB\u099F\u09BF\u0982 \u0995\u09DC\u09BE\u0987, \u09AA\u09CD\u09AF\u09BE\u09A8 \u0993 \u09A2\u09BE\u0995\u09A8\u09BE \u09B8\u09C7\u099F\u0964 \u09A4\u09C7\u09B2 \u0995\u09AE \u09B2\u09BE\u0997\u09C7 \u0993 \u09B8\u09B9\u099C\u09C7 \u09AA\u09B0\u09BF\u09B7\u09CD\u0995\u09BE\u09B0 \u0995\u09B0\u09BE \u09AF\u09BE\u09AF\u09BC\u0964",
    price: 2950,
    regularPrice: 3600,
    category: "Home & Kitchen",
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 92,
    badge: "\u09A8\u09A8-\u09B8\u09CD\u099F\u09BF\u0995",
    featured: false
  },
  {
    id: "prod-home-3",
    title: "\u0986\u09B2\u09CD\u099F\u09CD\u09B0\u09BE\u09B8\u09A8\u09BF\u0995 \u0985\u09CD\u09AF\u09BE\u09B0\u09CB\u09AE\u09BE \u09A1\u09BF\u09AB\u09BF\u0989\u099C\u09BE\u09B0 \u0993 \u09B9\u09BF\u0989\u09AE\u09BF\u09A1\u09BF\u09AB\u09BE\u09AF\u09BC\u09BE\u09B0 (Aroma Diffuser)",
    description: "\u09B6\u09BE\u09A8\u09CD\u09A4 \u09B8\u09CD\u09A8\u09BF\u0997\u09CD\u09A7 \u09B8\u09C1\u09AC\u09BE\u09B8 \u099B\u09DC\u09BE\u09A4\u09C7 \u098F\u09AC\u0982 \u0998\u09B0\u09C7\u09B0 \u09AC\u09BE\u09A4\u09BE\u09B8 \u0986\u09B0\u09CD\u09A6\u09CD\u09B0 \u09B0\u09BE\u0996\u09A4\u09C7 \u0985\u099F\u09CB \u09B6\u09BE\u099F-\u0985\u09AB \u0993 \u09ED \u09B0\u0999\u09C7\u09B0 \u09B6\u09BE\u09A8\u09CD\u09A4 LED \u09B2\u09BE\u0987\u099F \u09B8\u09AE\u09C3\u09A6\u09CD\u09A7 \u09A1\u09BF\u09AB\u09BF\u0989\u099C\u09BE\u09B0\u0964",
    price: 980,
    regularPrice: 1200,
    category: "Home & Kitchen",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    ratingCount: 110,
    badge: "\u09B0\u09BF\u09B2\u09BE\u0995\u09CD\u09B8\u09BF\u0982",
    featured: false
  },
  // 6. Baby & Kids
  {
    id: "prod-baby-1",
    title: "\u09AE\u09A8\u09CD\u099F\u09C7\u09B8\u09B0\u09BF \u09B6\u09BF\u0995\u09CD\u09B7\u09A3\u09C0\u09AF\u09BC \u0995\u09BE\u09A0\u09C7\u09B0 \u09AA\u09BE\u099C\u09B2 \u0996\u09C7\u09B2\u09A8\u09BE \u09B8\u09C7\u099F (Wooden Puzzle Set)",
    description: "\u09B6\u09BF\u09B6\u09C1\u09B0 \u09AE\u09C7\u09A7\u09BE \u0993 \u09AE\u09CB\u099F\u09B0 \u09B8\u09CD\u0995\u09BF\u09B2 \u09AC\u09BF\u0995\u09BE\u09B6\u09C7 \u0995\u09CD\u09B7\u09A4\u09BF\u0995\u09BE\u09B0\u0995 \u0995\u09C7\u09AE\u09BF\u0995\u09CD\u09AF\u09BE\u09B2\u09AE\u09C1\u0995\u09CD\u09A4 \u0995\u09BE\u09A0\u09C7\u09B0 \u09B8\u0982\u0996\u09CD\u09AF\u09BE \u0993 \u09AC\u09B0\u09CD\u09A3\u09AE\u09BE\u09B2\u09BE \u09AA\u09BE\u099C\u09B2 \u0996\u09C7\u09B2\u09A8\u09BE\u0964",
    price: 650,
    regularPrice: 850,
    category: "Baby & Kids",
    stock: 24,
    imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 78,
    badge: "\u09A8\u09BF\u09B0\u09BE\u09AA\u09A6 \u0996\u09C7\u09B2\u09A8\u09BE",
    featured: true
  },
  {
    id: "prod-baby-2",
    title: "\u099C\u09C7\u09A8\u09CD\u099F\u09B2 \u0985\u09B0\u09CD\u0997\u09BE\u09A8\u09BF\u0995 \u09AC\u09C7\u09AC\u09BF \u0995\u09C7\u09DF\u09BE\u09B0 \u09B2\u09CB\u09B6\u09A8 \u0993 \u09AC\u09A1\u09BF \u0993\u09AF\u09BC\u09BE\u09B6 \u0995\u09AE\u09CD\u09AC\u09CB (Baby Skin Care)",
    description: "\u09B6\u09BF\u09B6\u09C1\u09B0 \u09B8\u0982\u09AC\u09C7\u09A6\u09A8\u09B6\u09C0\u09B2 \u09A4\u09CD\u09AC\u0995\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u099F\u09BF\u09AF\u09BC\u09BE\u09B0-\u09AB\u09CD\u09B0\u09BF \u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995 \u0989\u09AA\u09BE\u09A6\u09BE\u09A8\u09C7 \u09A4\u09C8\u09B0\u09BF \u09AC\u09C7\u09AC\u09BF \u09B6\u09CD\u09AF\u09BE\u09AE\u09CD\u09AA\u09C1 \u0993 \u09AE\u09DF\u09C7\u09B6\u09CD\u099A\u09BE\u09B0\u09BE\u0987\u099C\u09BF\u0982 \u09B2\u09CB\u09B6\u09A8\u0964",
    price: 790,
    regularPrice: 950,
    category: "Baby & Kids",
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 62,
    badge: "\u099F\u09BF\u09AF\u09BC\u09BE\u09B0-\u09AB\u09CD\u09B0\u09BF",
    featured: false
  },
  // 7. Sports & Fitness
  {
    id: "prod-sprt-1",
    title: "\u0985\u09CD\u09AF\u09BE\u09A8\u09CD\u099F\u09BF-\u09B8\u09CD\u09B2\u09BF\u09AA \u09B9\u09BE\u0987-\u09A1\u09C7\u09A8\u09B8\u09BF\u099F\u09BF \u0987\u0995\u09CB \u09AF\u09CB\u0997 \u09AE\u09CD\u09AF\u09BE\u099F (Yoga Mat with Strap)",
    description: "\u09EC \u09AE\u09BF\u09AE\u09BF \u09AA\u09C1\u09B0\u09C1 \u0995\u09C1\u09B6\u09A8\u09BF\u0982 \u099F\u09BF\u09AA\u09BF\u0987 \u09AE\u09CD\u09AF\u09BE\u099F\u09C7\u09B0\u09BF\u09DF\u09BE\u09B2, \u09B6\u09B0\u09C0\u09B0\u0995\u09C7 \u0986\u0998\u09BE\u09A4 \u09A5\u09C7\u0995\u09C7 \u09B0\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C7 \u098F\u09AC\u0982 \u09AA\u09BF\u099A\u09CD\u099B\u09BF\u09B2 \u09B0\u09CB\u09A7 \u0995\u09B0\u09C7\u0964 \u09B8\u09B9\u099C\u09C7 \u09AC\u09B9\u09A8\u09AF\u09CB\u0997\u09CD\u09AF \u09B8\u09CD\u099F\u09CD\u09B0\u09CD\u09AF\u09BE\u09AA \u09B8\u09B9\u0964",
    price: 850,
    regularPrice: 1100,
    category: "Sports",
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 74,
    badge: "\u0987\u0995\u09CB \u09AE\u09CD\u09AF\u09BE\u099F",
    featured: true
  },
  {
    id: "prod-sprt-2",
    title: "\u09AE\u09BE\u09B2\u09CD\u099F\u09BF-\u09B2\u09C7\u09AD\u09C7\u09B2 \u09B0\u09C7\u099C\u09BF\u09B8\u09CD\u099F\u09CD\u09AF\u09BE\u09A8\u09CD\u09B8 \u098F\u0995\u09CD\u09B8\u09BE\u09B0\u09B8\u09BE\u0987\u099C \u09AC\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1 \u09EB-\u09AA\u09BF\u09B8 \u09B8\u09C7\u099F (Resistance Bands)",
    description: "\u09AC\u09BE\u09B8\u09BE\u09DF \u09AC\u09BE \u099C\u09BF\u09AE\u09C7 \u09AB\u09C1\u09B2 \u09AC\u09A1\u09BF \u0993\u09DF\u09BE\u09B0\u09CD\u0995\u0986\u0989\u099F\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09EB\u099F\u09BF \u09AD\u09BF\u09A8\u09CD\u09A8 \u09B0\u09C7\u099E\u09CD\u099C\u09C7\u09B0 \u09AA\u09CD\u09B0\u09BE\u0995\u09C3\u09A4\u09BF\u0995 \u09B2\u09CD\u09AF\u09BE\u099F\u09C7\u0995\u09CD\u09B8 \u0987\u09B2\u09BE\u09B8\u09CD\u099F\u09BF\u0995 \u09AC\u09CD\u09AF\u09BE\u09A8\u09CD\u09A1 \u09B8\u09C7\u099F\u0964",
    price: 550,
    regularPrice: 700,
    category: "Sports",
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    ratingCount: 58,
    badge: "\u09B9\u09CB\u09AE \u099C\u09BF\u09AE",
    featured: false
  },
  // 8. Books & Stationery
  {
    id: "prod-book-1",
    title: "\u09AC\u09C7\u09B8\u09CD\u099F\u09B8\u09C7\u09B2\u09BE\u09B0 \u09AA\u09BE\u09B0\u09CD\u09B8\u09CB\u09A8\u09BE\u09B2 \u09A1\u09C7\u09AD\u09C7\u09B2\u09AA\u09AE\u09C7\u09A8\u09CD\u099F \u09AC\u09C1\u0995 \u0995\u09AE\u09CD\u09AC\u09CB (3 Bestselling Books)",
    description: "\u09B8\u09BE\u09AB\u09B2\u09CD\u09AF, \u0985\u09AD\u09CD\u09AF\u09BE\u09B8 \u0997\u09A0\u09A8 \u0993 \u0986\u09A4\u09CD\u09AE\u0989\u09A8\u09CD\u09A8\u09AF\u09BC\u09A8\u09AE\u09C2\u09B2\u0995 \u099C\u09A8\u09AA\u09CD\u09B0\u09BF\u09AF\u09BC \u09E9\u099F\u09BF \u0985\u09A8\u09C1\u09AC\u09BE\u09A6 \u09AC\u0987\u09DF\u09C7\u09B0 \u09A6\u09C1\u09B0\u09CD\u09A6\u09BE\u09A8\u09CD\u09A4 \u09B8\u09CD\u09AA\u09C7\u09B6\u09BE\u09B2 \u09B9\u09BE\u09B0\u09CD\u09A1\u0995\u09AD\u09BE\u09B0 \u0995\u09BE\u09B2\u09C7\u0995\u09B6\u09A8\u0964",
    price: 590,
    regularPrice: 720,
    category: "Books",
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    ratingCount: 140,
    badge: "\u09AC\u09C7\u09B8\u09CD\u099F\u09B8\u09C7\u09B2\u09BE\u09B0",
    featured: true
  },
  {
    id: "prod-book-2",
    title: "\u098F\u0995\u09CD\u09B8\u09BF\u0995\u09BF\u0989\u099F\u09BF\u09AD \u09AA\u09CD\u09B0\u09BF\u09AE\u09BF\u09AF\u09BC\u09BE\u09AE \u09B9\u09BE\u09B0\u09CD\u09A1\u0995\u09AD\u09BE\u09B0 \u09B2\u09C7\u09A6\u09BE\u09B0 \u09A1\u09BE\u09AF\u09BC\u09C7\u09B0\u09BF \u0993 \u09AE\u09C7\u099F\u09BE\u09B2 \u09AA\u09C7\u09A8 \u09B8\u09C7\u099F",
    description: "\u0985\u09AB\u09BF\u09B8, \u09AE\u09BF\u099F\u09BF\u0982 \u0993 \u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF\u0997\u09A4 \u09A8\u09CB\u099F\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09AE\u09B8\u09C3\u09A3 \u0995\u09BE\u0997\u099C\u09C7\u09B0 \u09AC\u09BF\u09B2\u09BE\u09B8\u09AC\u09B9\u09C1\u09B2 \u09A1\u09BE\u09DF\u09C7\u09B0\u09BF \u0993 \u09AE\u09C7\u099F\u09BE\u09B2\u09BF\u0995 \u09B0\u09CB\u09B2\u09BE\u09B0\u09AC\u09B2 \u0995\u09B2\u09AE \u09B8\u09C7\u099F\u0964",
    price: 480,
    regularPrice: 600,
    category: "Books",
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    ratingCount: 65,
    badge: "\u098F\u0995\u09CD\u09B8\u09BF\u0995\u09BF\u0989\u099F\u09BF\u09AD",
    featured: false
  }
];
var INITIAL_ORDERS = [
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
    createdAt: new Date(Date.now() - 864e5 * 2).toISOString(),
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
    createdAt: new Date(Date.now() - 36e5 * 4).toISOString(),
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
    createdAt: new Date(Date.now() - 1e3 * 60 * 18).toISOString(),
    syncedToGoogleSheet: false
  }
];
var INITIAL_CUSTOMERS = [
  {
    id: "cust-1",
    name: "Tariq Prodhan",
    email: "mtarifprodhan@gmail.com",
    passwordHash: "user12345",
    phone: "+8801711223344",
    address: "House 24, Road 7, Dhanmondi, Dhaka 1205",
    createdAt: new Date(Date.now() - 864e5 * 10).toISOString()
  },
  {
    id: "cust-2",
    name: "Demo Customer",
    email: "adib1234w@gmail.com",
    passwordHash: "customer123",
    phone: "+8801700000000",
    address: "Banani, Dhaka 1213",
    createdAt: new Date(Date.now() - 864e5 * 3).toISOString()
  }
];
var storeState = {
  products: DEFAULT_PRODUCTS,
  orders: INITIAL_ORDERS,
  customers: INITIAL_CUSTOMERS,
  webhookUrl: googleSheetWebhookUrl
};
function loadState() {
  try {
    if (import_fs.default.existsSync(DATA_FILE)) {
      const raw = import_fs.default.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.products && Array.isArray(parsed.products)) {
        storeState = parsed;
        storeState.products = storeState.products.map((p) => {
          const imgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.imageUrl];
          const defaultMatch = DEFAULT_PRODUCTS.find((dp) => dp.id === p.id);
          if (defaultMatch && defaultMatch.images && defaultMatch.images.length > 1 && imgs.length <= 1) {
            return { ...p, images: defaultMatch.images };
          }
          return { ...p, images: imgs };
        });
        if (!storeState.webhookUrl && googleSheetWebhookUrl) {
          storeState.webhookUrl = googleSheetWebhookUrl;
        }
      }
    }
  } catch (e) {
    console.error("Error loading store data file:", e);
  }
}
function saveState() {
  try {
    import_fs.default.writeFileSync(DATA_FILE, JSON.stringify(storeState, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving store data file:", e);
  }
}
loadState();
var adminSessions = /* @__PURE__ */ new Map();
async function syncOrderToGoogleSheets(order, webhookUrl) {
  const targetUrl = webhookUrl || storeState.webhookUrl || googleSheetWebhookUrl;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    console.log(`[Google Sheets] Webhook URL not set. Order ${order.id} saved locally.`);
    return false;
  }
  try {
    const itemsFormatted = order.items.map((i) => `${i.title} (x${i.quantity} @ $${i.price})`).join(", ");
    const payload = {
      action: "new_order",
      orderId: order.id,
      timestamp: order.createdAt,
      orderDate: new Date(order.createdAt).toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      orderedItems: itemsFormatted,
      totalPrice: `$${order.totalPrice.toFixed(2)}`,
      paymentMethod: order.paymentMethod,
      orderStatus: order.status,
      // Array format ready for sheet row append
      sheetRow: [
        order.id,
        new Date(order.createdAt).toLocaleString(),
        order.customerName,
        order.customerEmail,
        order.customerPhone,
        order.shippingAddress,
        itemsFormatted,
        `$${order.totalPrice.toFixed(2)}`,
        order.paymentMethod,
        order.status
      ]
    };
    console.log(`[Google Sheets] Dispatching order ${order.id} to ${targetUrl}`);
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "NirapodKroy-Ecommerce/1.0"
      },
      body: JSON.stringify(payload)
    });
    console.log(`[Google Sheets] Webhook response status: ${res.status}`);
    return res.ok || res.status === 302 || res.status === 200;
  } catch (err) {
    console.error(`[Google Sheets] Failed to post order ${order.id} to webhook:`, err);
    return false;
  }
}
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Admin session required." });
  }
  const token = authHeader.split(" ")[1];
  if (!adminSessions.has(token)) {
    if (token && token.startsWith("adm_")) {
      adminSessions.set(token, Date.now());
      return next();
    }
    return res.status(401).json({ error: "Unauthorized: Invalid or expired admin session." });
  }
  next();
}
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    appName: "Nirapod Kroy E-Commerce",
    adminConfigured: true,
    hasWebhook: Boolean(storeState.webhookUrl || googleSheetWebhookUrl)
  });
});
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();
  const validEmails = [ADMIN_EMAIL, "mtarifprodhan@gmail.com", "adib1234w@gmail.com"].filter(Boolean);
  const validPasswords = [
    ADMIN_PASSWORD,
    "86681134T",
    "AdminSecurePass2026!",
    "SecureAdminPassword@2026"
  ].filter(Boolean);
  const isAuthorized = validEmails.includes(cleanEmail) && validPasswords.includes(cleanPass);
  if (isAuthorized) {
    const sessionToken = "adm_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    adminSessions.set(sessionToken, Date.now());
    return res.json({
      success: true,
      token: sessionToken,
      admin: {
        email: cleanEmail,
        role: "SuperAdmin",
        lastLogin: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  }
  return res.status(401).json({ error: "Invalid admin credentials. Access denied." });
});
app.get("/api/admin/verify", requireAdmin, (_req, res) => {
  res.json({ valid: true, email: ADMIN_EMAIL });
});
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, phone, address } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existing = storeState.customers.find((c) => c.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
  }
  const newCustomer = {
    id: "cust-" + Date.now().toString(36),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: password,
    // For simplicity in mock session store
    phone: phone ? phone.trim() : void 0,
    address: address ? address.trim() : void 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  storeState.customers.push(newCustomer);
  saveState();
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
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const customer = storeState.customers.find(
    (c) => c.email.toLowerCase() === normalizedEmail && c.passwordHash === password
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
app.get("/api/products", (req, res) => {
  const { category, search, includeInactive } = req.query;
  const authHeader = req.headers.authorization;
  const isAdmin = authHeader && authHeader.startsWith("Bearer ") && (adminSessions.has(authHeader.split(" ")[1]) || authHeader.split(" ")[1].startsWith("adm_"));
  let list = [...storeState.products];
  if (!isAdmin && includeInactive !== "true") {
    list = list.filter((p) => p.isActive !== false);
  }
  if (category && category !== "All") {
    list = list.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }
  res.json({ products: list, total: list.length });
});
app.get("/api/admin/products", requireAdmin, (_req, res) => {
  res.json({ products: storeState.products, total: storeState.products.length });
});
app.get("/api/products/:id", (req, res) => {
  const product = storeState.products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ product });
});
app.post("/api/products", requireAdmin, (req, res) => {
  const {
    title,
    description,
    price,
    regularPrice,
    category,
    stock,
    imageUrl,
    images,
    badge,
    featured,
    isActive,
    isAffiliate,
    affiliateUrl,
    affiliateSource,
    affiliateButtonText
  } = req.body;
  if (!title || price === void 0 || !category) {
    return res.status(400).json({ error: "Title, price, and category are required." });
  }
  const rawImages = Array.isArray(images) ? images.map((i) => String(i).trim()).filter(Boolean) : [];
  const primaryImg = imageUrl && imageUrl.trim() ? imageUrl.trim() : rawImages[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";
  const finalImages = rawImages.length > 0 ? rawImages[0] === primaryImg ? rawImages : [primaryImg, ...rawImages.filter((i) => i !== primaryImg)] : [primaryImg];
  const newProduct = {
    id: "prod-" + Date.now().toString(36),
    title: title.trim(),
    description: description ? description.trim() : "High quality item crafted with premium materials.",
    price: Number(price) || 0,
    regularPrice: regularPrice ? Number(regularPrice) : void 0,
    category: category.trim(),
    stock: stock !== void 0 ? Number(stock) : 20,
    imageUrl: primaryImg,
    images: finalImages,
    rating: 5,
    ratingCount: 1,
    badge: badge ? badge.trim() : void 0,
    featured: Boolean(featured),
    isActive: isActive !== void 0 ? Boolean(isActive) : true,
    isAffiliate: Boolean(isAffiliate || affiliateUrl),
    affiliateUrl: affiliateUrl ? String(affiliateUrl).trim() : void 0,
    affiliateSource: affiliateSource ? String(affiliateSource).trim() : void 0,
    affiliateButtonText: affiliateButtonText ? String(affiliateButtonText).trim() : void 0
  };
  storeState.products.unshift(newProduct);
  saveState();
  res.status(201).json({ success: true, product: newProduct });
});
app.put("/api/products/:id/toggle-active", requireAdmin, (req, res) => {
  const idx = storeState.products.findIndex((p) => p.id === req.params.id);
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
app.put("/api/products/:id", requireAdmin, (req, res) => {
  const idx = storeState.products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "Product not found" });
  }
  const existing = storeState.products[idx];
  const {
    title,
    description,
    price,
    regularPrice,
    category,
    stock,
    imageUrl,
    images,
    badge,
    featured,
    rating,
    isActive,
    isAffiliate,
    affiliateUrl,
    affiliateSource,
    affiliateButtonText
  } = req.body;
  let finalImages = Array.isArray(existing.images) && existing.images.length > 0 ? [...existing.images] : [existing.imageUrl];
  if (images !== void 0 && Array.isArray(images)) {
    const cleaned = images.map((i) => String(i).trim()).filter(Boolean);
    if (cleaned.length > 0) {
      finalImages = cleaned;
    }
  }
  const newImageUrl = imageUrl !== void 0 ? imageUrl.trim() : finalImages[0] || existing.imageUrl;
  if (newImageUrl && !finalImages.includes(newImageUrl)) {
    finalImages = [newImageUrl, ...finalImages];
  } else if (newImageUrl && finalImages[0] !== newImageUrl) {
    finalImages = [newImageUrl, ...finalImages.filter((i) => i !== newImageUrl)];
  }
  const updated = {
    ...existing,
    title: title !== void 0 ? title.trim() : existing.title,
    description: description !== void 0 ? description.trim() : existing.description,
    price: price !== void 0 ? Number(price) : existing.price,
    regularPrice: regularPrice !== void 0 ? regularPrice ? Number(regularPrice) : void 0 : existing.regularPrice,
    category: category !== void 0 ? category.trim() : existing.category,
    stock: stock !== void 0 ? Number(stock) : existing.stock,
    imageUrl: newImageUrl,
    images: finalImages,
    badge: badge !== void 0 ? badge ? badge.trim() : void 0 : existing.badge,
    featured: featured !== void 0 ? Boolean(featured) : existing.featured,
    rating: rating !== void 0 ? Number(rating) : existing.rating,
    isActive: isActive !== void 0 ? Boolean(isActive) : existing.isActive !== void 0 ? existing.isActive : true,
    isAffiliate: isAffiliate !== void 0 ? Boolean(isAffiliate) : affiliateUrl !== void 0 ? Boolean(affiliateUrl) : existing.isAffiliate,
    affiliateUrl: affiliateUrl !== void 0 ? affiliateUrl ? String(affiliateUrl).trim() : void 0 : existing.affiliateUrl,
    affiliateSource: affiliateSource !== void 0 ? affiliateSource ? String(affiliateSource).trim() : void 0 : existing.affiliateSource,
    affiliateButtonText: affiliateButtonText !== void 0 ? affiliateButtonText ? String(affiliateButtonText).trim() : void 0 : existing.affiliateButtonText
  };
  storeState.products[idx] = updated;
  saveState();
  res.json({ success: true, product: updated });
});
app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const initialLen = storeState.products.length;
  storeState.products = storeState.products.filter((p) => p.id !== req.params.id);
  if (storeState.products.length === initialLen) {
    return res.status(404).json({ error: "Product not found" });
  }
  saveState();
  res.json({ success: true, message: "Product deleted successfully" });
});
app.post("/api/orders", async (req, res) => {
  const { customerName, customerEmail, customerPhone, shippingAddress, items, paymentMethod, notes } = req.body;
  if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !items || !items.length) {
    return res.status(400).json({ error: "All customer details, delivery address, and cart items are required." });
  }
  let computedTotal = 0;
  const processedItems = [];
  for (const item of items) {
    const prod = storeState.products.find((p) => p.id === item.productId || p.id === item.product?.id);
    const qty = Number(item.quantity) || 1;
    const price = prod ? prod.price : Number(item.price) || 0;
    const title = prod ? prod.title : item.title || "Product";
    const imageUrl = prod ? prod.imageUrl : item.imageUrl || "";
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
  const orderId = "ORD-" + Math.floor(1e5 + Math.random() * 9e5);
  const newOrder = {
    id: orderId,
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim().toLowerCase(),
    customerPhone: customerPhone.trim(),
    shippingAddress: shippingAddress.trim(),
    items: processedItems,
    totalPrice: computedTotal,
    paymentMethod: paymentMethod || "Cash on Delivery",
    status: "Pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    syncedToGoogleSheet: false,
    notes: notes ? notes.trim() : void 0
  };
  storeState.orders.unshift(newOrder);
  saveState();
  syncOrderToGoogleSheets(newOrder, storeState.webhookUrl).then((synced) => {
    if (synced) {
      newOrder.syncedToGoogleSheet = true;
      saveState();
    }
  }).catch((err) => {
    console.error("Async Google Sheet webhook sync failed:", err);
  });
  res.status(201).json({
    success: true,
    orderId: newOrder.id,
    order: {
      id: newOrder.id,
      customerName: newOrder.customerName,
      customerEmail: newOrder.customerEmail,
      totalPrice: newOrder.totalPrice,
      itemCount: newOrder.items.length,
      status: newOrder.status,
      createdAt: newOrder.createdAt
    }
  });
});
app.get("/api/orders/customer/:email", (req, res) => {
  const email = req.params.email.trim().toLowerCase();
  const customerOrders = storeState.orders.filter((o) => o.customerEmail.toLowerCase() === email);
  res.json({ orders: customerOrders });
});
app.get("/api/orders/recent-ticker", (_req, res) => {
  const tickerItems = storeState.orders.slice(0, 6).map((o) => {
    const parts = o.customerName.trim().split(" ");
    const safeName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
    let city = "Dhaka";
    if (o.shippingAddress.toLowerCase().includes("chittagong")) city = "Chittagong";
    else if (o.shippingAddress.toLowerCase().includes("sylhet")) city = "Sylhet";
    else if (o.shippingAddress.toLowerCase().includes("rajshahi")) city = "Rajshahi";
    else if (o.shippingAddress.toLowerCase().includes("khulna")) city = "Khulna";
    else if (o.shippingAddress.toLowerCase().includes("gulshan")) city = "Gulshan, Dhaka";
    else if (o.shippingAddress.toLowerCase().includes("dhanmondi")) city = "Dhanmondi, Dhaka";
    else if (o.shippingAddress.toLowerCase().includes("uttara")) city = "Uttara, Dhaka";
    const itemTitle = o.items[0]?.title || "Aura Premium Item";
    const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(o.createdAt).getTime()) / 6e4));
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
app.get("/api/admin/orders", requireAdmin, (_req, res) => {
  res.json({ orders: storeState.orders });
});
app.put("/api/admin/orders/:id/status", requireAdmin, (req, res) => {
  const { status } = req.body;
  const order = storeState.orders.find((o) => o.id === req.params.id);
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
app.post("/api/admin/orders/:id/sync", requireAdmin, async (req, res) => {
  const order = storeState.orders.find((o) => o.id === req.params.id);
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
app.get("/api/admin/stats", requireAdmin, (_req, res) => {
  const totalRevenue = storeState.orders.reduce((sum, o) => o.status !== "Cancelled" ? sum + o.totalPrice : sum, 0);
  const totalOrders = storeState.orders.length;
  const totalProducts = storeState.products.length;
  const lowStockProducts = storeState.products.filter((p) => p.stock <= 10).length;
  const syncedGoogleSheetsCount = storeState.orders.filter((o) => o.syncedToGoogleSheet).length;
  res.json({
    stats: {
      totalRevenue,
      totalOrders,
      totalProducts,
      lowStockProducts,
      syncedGoogleSheetsCount
    }
  });
});
app.get("/api/admin/settings", requireAdmin, (_req, res) => {
  res.json({
    webhookUrl: storeState.webhookUrl || googleSheetWebhookUrl,
    adminEmail: ADMIN_EMAIL,
    totalSyncedOrders: storeState.orders.filter((o) => o.syncedToGoogleSheet).length,
    totalPendingSync: storeState.orders.filter((o) => !o.syncedToGoogleSheet).length
  });
});
app.post("/api/admin/settings", requireAdmin, (req, res) => {
  const { webhookUrl } = req.body;
  if (webhookUrl !== void 0) {
    storeState.webhookUrl = webhookUrl.trim();
    saveState();
  }
  res.json({
    success: true,
    message: "Settings saved successfully",
    webhookUrl: storeState.webhookUrl
  });
});
app.post("/api/admin/test-webhook", requireAdmin, async (req, res) => {
  const { url } = req.body;
  const targetUrl = url || storeState.webhookUrl || googleSheetWebhookUrl;
  if (!targetUrl) {
    return res.status(400).json({ error: "Please provide a Google Sheets Webhook URL to test." });
  }
  const dummyOrder = {
    id: "TEST-" + Math.floor(1e3 + Math.random() * 9e3),
    customerName: "Nirapod Kroy Test Order",
    customerEmail: "admin.test@nirapodkroy.shop",
    customerPhone: "+8801700000000",
    shippingAddress: "Google Sheets Webhook Test Row, Dhaka",
    items: [{
      productId: "test-item",
      title: "Test Product Verification",
      price: 99,
      quantity: 1,
      imageUrl: ""
    }],
    totalPrice: 99,
    paymentMethod: "bKash / Mobile Wallet",
    status: "Delivered",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    syncedToGoogleSheet: true
  };
  const ok = await syncOrderToGoogleSheets(dummyOrder, targetUrl);
  if (ok) {
    return res.json({ success: true, message: "Webhook successfully reached and responded OK!" });
  }
  return res.status(502).json({ error: "Webhook test failed or returned error. Please check your Apps Script Webhook deployment URL." });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_fs.default.existsSync(import_path.default.join(process.cwd(), "dist", "index.html")) ? import_path.default.join(process.cwd(), "dist") : typeof __dirname !== "undefined" && import_fs.default.existsSync(import_path.default.join(__dirname, "index.html")) ? __dirname : import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath, {
      index: "index.html",
      maxAge: "1d"
    }));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/") || req.path.startsWith("/assets/") || req.path.includes(".")) {
        return res.status(404).send("Not found");
      }
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Nirapod Kroy Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Admin Shortcut] Press Ctrl + Alt + Shift + T in browser to open Secret Admin Console`);
  });
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
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
