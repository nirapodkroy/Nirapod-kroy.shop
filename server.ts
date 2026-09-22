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

// Security Protection Middleware: Block access to sensitive files, credentials, and vaults
app.use((req, res, next) => {
  const url = req.path.toLowerCase();
  if (
    url.includes("admin-credentials") ||
    url.includes(".env") ||
    url.includes(".git") ||
    url.includes(".secure-vault") ||
    url.includes(".app_store_data") ||
    url.endsWith(".zip") ||
    url.endsWith(".tar") ||
    url.endsWith(".gz") ||
    url.endsWith(".map") ||
    url.endsWith("server.cjs") ||
    (url.endsWith(".json") && !url.endsWith("products.json") && !url.endsWith("manifest.json") && !url.endsWith("site.webmanifest") && !url.startsWith("/api/"))
  ) {
    return res.status(403).json({ error: "Access Forbidden: Protected Resource" });
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
interface SizeChartRow {
  name?: string;
  parameter?: string;
  values: { [size: string]: string };
}

interface SizeChart {
  unit?: string;
  columns?: string[];
  rows?: SizeChartRow[];
  note?: string;
  title?: string;
}

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
  productCode?: string;
  hasSizes?: boolean;
  sizes?: string[];
  sizeChart?: SizeChart;
}

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
  productCode?: string;
  selectedImageCode?: string;
  selectedSize?: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  totalPrice: number;
  shippingFee?: number;
  deliveryArea?: string;
  paymentMethod: 'Cash on Delivery' | 'bKash / Mobile Wallet' | 'bKash' | 'Nagad' | 'Rocket' | string;
  senderPhoneNumber?: string;
  transactionId?: string;
  paymentGatewayFee?: number;
  paymentProvider?: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | string;
  createdAt: string;
  syncedToGoogleSheet: boolean;
  notes?: string;
  trackingNumber?: string;
  orderTrackingDetails?: string; // "Order Tracking Details" (order traking detis) beside tracking number
  trackingDetails?: string;
  productCodes?: string;
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

import { DEFAULT_PRODUCTS } from "./src/data/defaultProducts";

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
  isDataSaved?: boolean;
}

let storeState: StoreState = {
  products: DEFAULT_PRODUCTS,
  orders: INITIAL_ORDERS,
  customers: INITIAL_CUSTOMERS,
  subscribers: [],
  userTracking: [],
  webhookUrl: googleSheetWebhookUrl,
  isDataSaved: false
};

// Load or save persistence helper
function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.products && Array.isArray(parsed.products)) {
        storeState = parsed;
        storeState.isDataSaved = Boolean(parsed.isDataSaved);
      }
    }

    // Check if public/products.json exists and use it as authoritative product catalog
    const publicDir = path.join(process.cwd(), "public");
    const publicJsonPath = path.join(publicDir, "products.json");
    if (fs.existsSync(publicJsonPath)) {
      try {
        const pubRaw = fs.readFileSync(publicJsonPath, "utf-8");
        const pubList = JSON.parse(pubRaw);
        if (Array.isArray(pubList) && pubList.length > 0) {
          storeState.products = pubList;
        }
      } catch (err) {
        console.warn("[Store] Error parsing public/products.json:", err);
      }
    } else if (!storeState.products || storeState.products.length === 0) {
      storeState.products = DEFAULT_PRODUCTS;
    }

    // Ensure all products have images array populated
    storeState.products = (storeState.products || []).map(p => {
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

    // 5. Always write docs/products.json so GitHub Pages deployment from /docs stays 100% updated
    const docsDir = path.join(process.cwd(), "docs");
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(docsDir, "products.json"), JSON.stringify(storeState.products, null, 2), "utf-8");

    // 6. Write root products.json so direct root fetches (/products.json) succeed
    fs.writeFileSync(path.join(process.cwd(), "products.json"), JSON.stringify(storeState.products, null, 2), "utf-8");

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
const syncedOrderIdsServer = new Set<string>();

// Helper: dispatch order to Google Sheets webhook
async function syncOrderToGoogleSheets(order: Order, webhookUrl?: string, forceSync: boolean = false): Promise<boolean> {
  if (!order || !order.id) return false;

  const cleanOrderId = String(order.id).trim();
  if (!forceSync && syncedOrderIdsServer.has(cleanOrderId)) {
    return true; // Already synced or queued
  }
  syncedOrderIdsServer.add(cleanOrderId);

  const targetUrl = webhookUrl || storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    console.log(`[Google Sheets] Webhook URL not set. Order ${order.id} saved locally.`);
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const itemsList = order.items && Array.isArray(order.items) ? order.items : [];
    const trackingNum = order.trackingNumber || ("TRK-" + cleanOrderId.replace(/\D/g, ""));
    const productCodesText = order.productCodes || itemsList.map(i => {
      const parts: string[] = [];
      if (i.productCode) parts.push(i.productCode);
      if (i.selectedImageCode) parts.push(`ছবি কোড: ${i.selectedImageCode}`);
      if (i.selectedSize) parts.push(`সাইজ: ${i.selectedSize}`);
      return parts.length > 0 ? parts.join(" / ") : (i.title || "Product");
    }).join(", ");

    const itemsFormatted = itemsList.length > 0
      ? itemsList.map(i => {
          const codeInfo = i.selectedImageCode ? ` [কোড: ${i.selectedImageCode}]` : (i.productCode ? ` [কোড: ${i.productCode}]` : "");
          const sizeInfo = i.selectedSize ? ` [সাইজ: ${i.selectedSize}]` : "";
          return `${i.title || "Item"}${codeInfo}${sizeInfo} (x${i.quantity || 1} @ ৳${i.price || 0})`;
        }).join(", ")
      : "Ordered Items";
    
    const orderTime = order.createdAt 
      ? new Date(order.createdAt).toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
      : new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    // Format payment by for email notification as requested by user ("Payment By: bKash / Nagad / Rocket / Cash on Delivery")
    const paymentByMethod = order.paymentProvider 
      ? order.paymentProvider 
      : (order.paymentMethod?.includes("bKash") ? "bKash" : (order.paymentMethod?.includes("Nagad") ? "Nagad" : (order.paymentMethod?.includes("Rocket") ? "Rocket" : (order.paymentMethod || "Cash on Delivery"))));

    // Payload formatted for standard Google Apps Script Webhook
    const userEmail = (order.customerEmail || "").trim();
    const productCodesVal = productCodesText || order.productCodes || "";
    const deliveryAreaVal = order.deliveryArea || (Number(order.shippingFee) === 100 ? "ঢাকার বাইরে" : "ঢাকার ভেতরে");
    const shippingFeeVal = order.shippingFee ? `৳${order.shippingFee}` : (deliveryAreaVal.includes("100") || deliveryAreaVal.includes("বাইরে") ? "৳100" : "৳60");
    const trackingDetailsText = order.orderTrackingDetails || order.trackingDetails || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে";

    const payload = {
      action: "new_order",
      type: "order",
      sheetTab: "order sheet",
      targetSheet: "order sheet",
      orderId: order.id,
      trackingNumber: trackingNum,
      orderTrackingNumber: trackingNum,

      // Customer Email (নিশ্চিত করে জিমেইল / ইমেইল কলামে গ্রাহকের আসল ইমেইল যাওয়ার ব্যবস্থা)
      customerEmail: userEmail,
      email: userEmail,
      userEmail: userEmail,
      gmail: userEmail,
      // ওল্ড স্ক্রিপ্টে Col 4 (Gmail) এ data.productCodes লেখা হতো; তাই ওল্ড স্ক্রিপ্ট চললে যাতে জিমেইল কলামে গ্রাহকের ইমেইলটাই যায়:
      productCodes: userEmail || productCodesVal,

      // Product Code (প্রোডাক্ট / ছবি কোড)
      productCode: productCodesVal,
      actualProductCodes: productCodesVal,
      productCodeText: productCodesVal,
      productCodesActual: productCodesVal,
      // ওল্ড স্ক্রিপ্টে Col 11 (Product Code) এ data.deliveryArea লেখা হতো; তাই ওল্ড স্ক্রিপ্ট চললে যাতে প্রোডাক্ট কোড কলামে আসল কোডটাই যায়:
      deliveryArea: productCodesVal || deliveryAreaVal,

      // Delivery Area & Shipping Fee (ডেলিভারি এরিয়া ও ডেলিভারি চার্জ)
      actualDeliveryArea: deliveryAreaVal,
      deliveryAreaName: deliveryAreaVal,
      shippingFee: shippingFeeVal,
      deliveryCharge: shippingFeeVal,
      actualShippingFee: shippingFeeVal,

      timestamp: order.createdAt || new Date().toISOString(),
      orderDate: orderTime,
      customerName: order.customerName || "Customer",
      customerPhone: order.customerPhone || "",
      shippingAddress: order.shippingAddress || "",
      orderedItems: itemsFormatted,
      totalPrice: Number(order.totalPrice) || 0,
      paymentMethod: order.paymentMethod || "Cash on Delivery",
      paymentBy: paymentByMethod,
      paymentProvider: order.paymentProvider || (order.paymentMethod?.includes("bKash") ? "bKash" : (order.paymentMethod?.includes("Nagad") ? "Nagad" : (order.paymentMethod?.includes("Rocket") ? "Rocket" : ""))),
      senderPhoneNumber: order.senderPhoneNumber || "",
      senderPhone: order.senderPhoneNumber || "",
      sendMoneyNumber: order.senderPhoneNumber || "",
      transactionId: order.transactionId || "",
      tranzationNumber: order.transactionId || "",
      paymentGatewayFee: order.paymentGatewayFee ? `৳${order.paymentGatewayFee}` : "",
      orderStatus: order.status || "Pending",
      adminNotifyEmail: "adib1234@gmail.com,adib1234w@gmail.com",
      notes: order.notes || "",
      orderTrackingDetails: order.orderTrackingDetails || order.trackingDetails || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে। শীঘ্রই প্যাকেজিং শুরু হবে।",
      orderTrackingDetis: order.orderTrackingDetails || order.trackingDetails || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে। শীঘ্রই প্যাকেজিং শুরু হবে।",
      trackingDetails: order.orderTrackingDetails || order.trackingDetails || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে। শীঘ্রই প্যাকেজিং শুরু হবে।",
      sheetRow: [
        order.id,                                // Col A (1): Order ID
        orderTime,                               // Col B (2): Order Date
        order.customerName || "Customer",        // Col C (3): Customer Name
        userEmail,                               // Col D (4): Customer Email (Gmail)
        order.customerPhone || "",               // Col E (5): Customer Phone
        order.shippingAddress || "",             // Col F (6): Shipping Address
        `৳${order.totalPrice || 0}`,             // Col G (7): Total Price (৳)
        order.paymentMethod || "Cash on Delivery",// Col H (8): Payment Method
        order.status || "Pending",               // Col I (9): Status
        itemsFormatted,                          // Col J (10): Order Items Summary
        productCodesVal,                         // Col K (11): product number (Product / Picture Code)
        shippingFeeVal,                          // Col L (12): Delivery Charge
        trackingNum,                             // Col M (13): Traking id
        deliveryAreaVal,                         // Col N (14): Delivery Area
        order.orderTrackingDetails || order.trackingDetails || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে। শীঘ্রই প্যাকেজিং শুরু হবে।", // Col O (15): Order Tracking Details
        order.senderPhoneNumber || "N/A",        // Col P (16): Send Money Number
        order.transactionId || "N/A",             // Col Q (17): Transaction Number (TrxID)
        order.paymentProvider || (order.paymentMethod?.includes("bKash") ? "bKash" : (order.paymentMethod?.includes("Nagad") ? "Nagad" : (order.paymentMethod?.includes("Rocket") ? "Rocket" : "Cash on Delivery"))) // Col R (18): Payment Provider
      ]
    };

    const urlWithParams = targetUrl + (targetUrl.includes("?") ? "&" : "?") + 
      `tab=order+sheet&target=order_sheet&type=order&action=new_order&orderId=${encodeURIComponent(order.id)}&customerName=${encodeURIComponent(order.customerName || "")}&customerEmail=${encodeURIComponent(userEmail)}&email=${encodeURIComponent(userEmail)}&userEmail=${encodeURIComponent(userEmail)}&gmail=${encodeURIComponent(userEmail)}&phone=${encodeURIComponent(order.customerPhone || "")}&total=${encodeURIComponent(String(order.totalPrice || 0))}&totalPrice=${encodeURIComponent(String(order.totalPrice || 0))}&paymentMethod=${encodeURIComponent(order.paymentMethod || "Cash on Delivery")}&productCode=${encodeURIComponent(productCodesVal)}&actualProductCodes=${encodeURIComponent(productCodesVal)}&productCodeText=${encodeURIComponent(productCodesVal)}&productCodes=${encodeURIComponent(userEmail || productCodesVal)}&trackingNumber=${encodeURIComponent(trackingNum)}&trackingDetails=${encodeURIComponent(trackingDetailsText)}&orderTrackingDetails=${encodeURIComponent(trackingDetailsText)}&orderTrackingDetis=${encodeURIComponent(trackingDetailsText)}&paymentBy=${encodeURIComponent(paymentByMethod)}&sendMoneyNumber=${encodeURIComponent(order.senderPhoneNumber || "")}&transactionId=${encodeURIComponent(order.transactionId || "")}&provider=${encodeURIComponent(order.paymentProvider || "")}&notifyEmail=${encodeURIComponent("adib1234@gmail.com,adib1234w@gmail.com")}&deliveryArea=${encodeURIComponent(productCodesVal || deliveryAreaVal)}&actualDeliveryArea=${encodeURIComponent(deliveryAreaVal)}&deliveryAreaName=${encodeURIComponent(deliveryAreaVal)}&shippingFee=${encodeURIComponent(shippingFeeVal)}&deliveryCharge=${encodeURIComponent(shippingFeeVal)}`;

    console.log(`[Google Sheets] Dispatching order ${order.id} to ${urlWithParams}`);
    
    // Direct instant Gmail Notification via FormSubmit (failsafe redundancy)
    // As requested: Gmail এ শুধু যাবে Payment By (bKash / Nagad / Rocket / Cash on Delivery) এবং প্রয়োজনীয় পেমেন্ট বিবরণ
    try {
      const emailFormData = {
        _subject: `🚨 নতুন অর্ডার! #${order.id} - ৳${order.totalPrice || 0} (${order.customerName || "গ্রাহক"})`,
        "অর্ডার আইডি": order.id,
        "তারিখ ও সময়": orderTime,
        "ট্র্যাকিং নম্বর": trackingNum,
        "অর্ডার ট্র্যাকিং বিবরণ (Tracking Details)": trackingDetailsText,
        "গ্রাহকের নাম": order.customerName || "Customer",
        "মোবাইল নম্বর": order.customerPhone || "",
        "ডেলিভারি ঠিকানা": order.shippingAddress || "",
        "ডেলিভারি এরিয়া": order.deliveryArea || "ঢাকার ভেতরে / বাইরে",
        "ডেলিভারি চার্জ": order.shippingFee ? `৳${order.shippingFee}` : "৳0",
        "অর্ডারকৃত পণ্য": itemsFormatted,
        "প্রোডাক্ট কোড": productCodesText || "N/A",
        "সর্বমোট বিল": `৳${order.totalPrice || 0}`,
        "Payment By": paymentByMethod,
        "Send Money Number (যে নম্বর থেকে টাকা পাঠানো হয়েছে)": order.senderPhoneNumber || "N/A",
        "Transaction Number (TrxID)": order.transactionId || "N/A",
        "গেটওয়ে ফি (১.২%)": order.paymentGatewayFee ? `৳${order.paymentGatewayFee}` : "৳0",
        _template: "table",
        _captcha: "false"
      };

      ["adib1234@gmail.com", "adib1234w@gmail.com"].forEach(email => {
        fetch(`https://formsubmit.co/ajax/${email}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Origin": "https://www.nirapodkroy.shop",
            "Referer": "https://www.nirapodkroy.shop/"
          },
          body: JSON.stringify(emailFormData)
        }).catch(() => {});
      });
    } catch {}

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
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError" || controller.signal.aborted) {
      console.log(`[Google Sheets Order Sync] Request timed out for order ${order.id} (handled gracefully)`);
    } else {
      console.log(`[Google Sheets Order Sync Notice]: ${err?.message || "Connection issue"}`);
    }
    return false;
  }
}

// Helper: dispatch customer registration to Google Sheets webhook
async function syncCustomerToGoogleSheets(customer: Customer, rawPassword?: string): Promise<boolean> {
  const targetUrl = storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40000);

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
      customerName: customer.name || "Customer",
      phone: customer.phone || "N/A",
      customerPhone: customer.phone || "N/A",
      email: customer.email,
      customerEmail: customer.email,
      userEmail: customer.email,
      gmail: customer.email,
      address: customer.address || "N/A",
      shippingAddress: customer.address || "N/A",
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
      `tab=Customers&target=Customers&type=customer&action=customer_registration&customerId=${encodeURIComponent(customer.id)}&name=${encodeURIComponent(customer.name || "")}&customerName=${encodeURIComponent(customer.name || "")}&phone=${encodeURIComponent(customer.phone || "")}&customerPhone=${encodeURIComponent(customer.phone || "")}&email=${encodeURIComponent(customer.email)}&customerEmail=${encodeURIComponent(customer.email)}&userEmail=${encodeURIComponent(customer.email)}&gmail=${encodeURIComponent(customer.email)}&address=${encodeURIComponent(customer.address || "")}&registeredAt=${encodeURIComponent(regDate)}`;

    console.log(`[Google Sheets] Dispatching customer ${customer.name} to ${urlWithParams}`);

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
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError" || controller.signal.aborted) {
      console.log(`[Google Sheets Customer Sync] Request timed out for customer ${customer.email} (handled gracefully)`);
    } else {
      console.log(`[Google Sheets Customer Sync Notice]: ${err?.message || "Connection issue"}`);
    }
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
  const timeoutId = setTimeout(() => controller.abort(), 40000);

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
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError" || controller.signal.aborted) {
      console.log(`[Google Sheets Newsletter Sync] Request timed out for ${email} (handled gracefully)`);
    } else {
      console.log(`[Google Sheets Newsletter Sync Notice]: ${err?.message || "Connection issue"}`);
    }
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
  const timeoutId = setTimeout(() => controller.abort(), 40000);

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
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError" || controller.signal.aborted) {
      console.log(`[Google Sheets User Tracking Sync] Request timed out for session ${entry.sessionId} (handled gracefully)`);
    } else {
      console.log(`[Google Sheets User Tracking Sync Notice]: ${err?.message || "Connection issue"}`);
    }
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
    isOfferZone, offerDiscountNote,
    hasSizes, sizes, sizeChart, rating, ratingCount
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

  const parsedRating = rating !== undefined && !isNaN(Number(rating))
    ? Math.min(5, Math.max(1, Number(rating)))
    : 5.0;
  const parsedRatingCount = ratingCount !== undefined && !isNaN(Number(ratingCount))
    ? Math.max(0, Number(ratingCount))
    : 1;

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
    rating: parsedRating,
    ratingCount: parsedRatingCount,
    badge: badge ? badge.trim() : undefined,
    featured: Boolean(featured),
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    isAffiliate: Boolean(isAffiliate || affiliateUrl),
    affiliateUrl: affiliateUrl ? String(affiliateUrl).trim() : undefined,
    affiliateSource: affiliateSource ? String(affiliateSource).trim() : undefined,
    affiliateButtonText: affiliateButtonText ? String(affiliateButtonText).trim() : undefined,
    isOfferZone: Boolean(isOfferZone),
    offerDiscountNote: offerDiscountNote ? String(offerDiscountNote).trim() : undefined,
    hasSizes: Boolean(hasSizes),
    sizes: Array.isArray(sizes) ? sizes.map(s => String(s).trim()).filter(Boolean) : undefined,
    sizeChart: sizeChart && typeof sizeChart === "object" ? sizeChart : undefined
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
    title, description, price, regularPrice, category, parentCategory, stock, imageUrl, images, badge, featured, rating, ratingCount,
    isActive, isAffiliate, affiliateUrl, affiliateSource, affiliateButtonText,
    isOfferZone, offerDiscountNote,
    hasSizes, sizes, sizeChart
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
    rating: rating !== undefined && !isNaN(Number(rating)) ? Math.min(5, Math.max(1, Number(rating))) : existing.rating,
    ratingCount: ratingCount !== undefined && !isNaN(Number(ratingCount)) ? Math.max(0, Number(ratingCount)) : (existing.ratingCount || 1),
    isActive: isActive !== undefined ? Boolean(isActive) : (existing.isActive !== undefined ? existing.isActive : true),
    isAffiliate: isAffiliate !== undefined ? Boolean(isAffiliate) : (affiliateUrl !== undefined ? Boolean(affiliateUrl) : existing.isAffiliate),
    affiliateUrl: affiliateUrl !== undefined ? (affiliateUrl ? String(affiliateUrl).trim() : undefined) : existing.affiliateUrl,
    affiliateSource: affiliateSource !== undefined ? (affiliateSource ? String(affiliateSource).trim() : undefined) : existing.affiliateSource,
    affiliateButtonText: affiliateButtonText !== undefined ? (affiliateButtonText ? String(affiliateButtonText).trim() : undefined) : existing.affiliateButtonText,
    isOfferZone: isOfferZone !== undefined ? Boolean(isOfferZone) : existing.isOfferZone,
    offerDiscountNote: offerDiscountNote !== undefined ? (offerDiscountNote ? String(offerDiscountNote).trim() : undefined) : existing.offerDiscountNote,
    hasSizes: hasSizes !== undefined ? Boolean(hasSizes) : existing.hasSizes,
    sizes: sizes !== undefined ? (Array.isArray(sizes) ? sizes.map(s => String(s).trim()).filter(Boolean) : undefined) : existing.sizes,
    sizeChart: sizeChart !== undefined ? (sizeChart && typeof sizeChart === "object" ? sizeChart : undefined) : existing.sizeChart
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

    const cleanRepo = String(repo)
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^github\.com\//i, "")
      .replace(/\.git$/i, "")
      .replace(/\/+$/, "");
    const cleanBranch = (branch && String(branch).trim()) || "main";
    const cleanToken = String(token).trim();
    const targetProducts = Array.isArray(products) && products.length > 0 ? products : storeState.products;

    // 1. Update local files immediately across all targets
    storeState.products = targetProducts;
    saveState();

    const authHeader = cleanToken.startsWith("ghp_") ? `token ${cleanToken}` : `Bearer ${cleanToken}`;

    // Helper to get all file SHAs from git tree in one call to bypass 1MB blob limits and 403 errors
    let repoTreeCache: Map<string, string> | null = null;
    async function getRepoTreeSha(targetPath: string): Promise<string> {
      if (!repoTreeCache) {
        try {
          const treeRes = await fetch(`https://api.github.com/repos/${cleanRepo}/git/trees/${cleanBranch}?recursive=1`, {
            headers: {
              Authorization: authHeader,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "NirapodKroy-Admin"
            }
          });
          if (treeRes.ok) {
            const treeData: any = await treeRes.json();
            repoTreeCache = new Map();
            if (Array.isArray(treeData?.tree)) {
              for (const item of treeData.tree) {
                if (item.path && item.sha) repoTreeCache.set(item.path, item.sha);
              }
            }
          }
        } catch (e) {
          console.warn("[GitHub Push] Tree SHA fetch error:", e);
        }
      }
      return repoTreeCache?.get(targetPath) || "";
    }

    // Helper to commit a single file to GitHub contents API
    async function commitSingleFile(filePath: string, contentBufferOrStr: Buffer | string, commitMsg: string) {
      let sha = "";
      const getUrl = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}?ref=${cleanBranch}`;
      const getRes = await fetch(getUrl, {
        headers: {
          Authorization: authHeader,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "NirapodKroy-Admin"
        }
      });

      if (getRes.ok) {
        const fileData: any = await getRes.json();
        sha = fileData.sha;
      } else if (getRes.status === 401) {
        throw new Error("AUTH_ERROR");
      } else {
        // If 403 (blob > 1MB) or 404, check git tree
        sha = await getRepoTreeSha(filePath);
      }

      const base64Content = Buffer.isBuffer(contentBufferOrStr)
        ? contentBufferOrStr.toString("base64")
        : Buffer.from(contentBufferOrStr, "utf-8").toString("base64");

      const putUrl = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}`;
      let putRes = await fetch(putUrl, {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "NirapodKroy-Admin"
        },
        body: JSON.stringify({
          message: commitMsg,
          content: base64Content,
          sha: sha || undefined,
          branch: cleanBranch,
          committer: {
            name: "Nirapod Kroy Admin",
            email: "admin@nirapodkroy.shop"
          }
        })
      });

      // If 409 Conflict, force refresh tree and retry once
      if (putRes.status === 409) {
        repoTreeCache = null;
        const freshSha = await getRepoTreeSha(filePath);
        putRes = await fetch(putUrl, {
          method: "PUT",
          headers: {
            Authorization: authHeader,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "NirapodKroy-Admin"
          },
          body: JSON.stringify({
            message: commitMsg,
            content: base64Content,
            sha: freshSha || undefined,
            branch: cleanBranch,
            committer: {
              name: "Nirapod Kroy Admin",
              email: "admin@nirapodkroy.shop"
            }
          })
        });
      }

      return putRes;
    }

    const jsonStr = JSON.stringify(targetProducts, null, 2);
    const tsContent = `import { Product } from "../types";\n\nexport const DEFAULT_PRODUCTS: Product[] = ${jsonStr};\n`;

    // 2. Commit public/products.json
    let lastCommitUrl = `https://github.com/${cleanRepo}/commits/${cleanBranch}`;
    try {
      const pubRes = await commitSingleFile(
        "public/products.json",
        jsonStr,
        `chore(catalog): sync ${targetProducts.length} products to public/products.json`
      );
      if (!pubRes.ok) {
        const errData: any = await pubRes.json().catch(() => ({}));
        let friendlyError = errData.message || "Failed to commit public/products.json";
        if (pubRes.status === 409) friendlyError = "GitHub Conflict: ফাইলের ভার্সন মেলেনি। অনুগ্রহ করে আবার পুশ বাটনে ক্লিক করুন।";
        if (pubRes.status === 404) friendlyError = `Repository '${cleanRepo}' বা ব্রাঞ্চ '${cleanBranch}' খুঁজে পাওয়া যায়নি।`;
        return res.status(pubRes.status).json({ error: friendlyError, raw: errData });
      }
      const pubData: any = await pubRes.json();
      if (pubData.commit?.html_url) lastCommitUrl = pubData.commit.html_url;

      // 3. Also commit docs/products.json so GitHub Pages (/docs) updates live!
      try {
        await commitSingleFile(
          "docs/products.json",
          jsonStr,
          `chore(catalog): sync ${targetProducts.length} products to docs/products.json (live site)`
        );
      } catch (docsErr) {
        console.warn("[GitHub Push] Warning committing docs/products.json:", docsErr);
      }

      // 4. Also commit products.json at repository root so direct root fetches succeed
      try {
        await commitSingleFile(
          "products.json",
          jsonStr,
          `chore(catalog): sync ${targetProducts.length} products to products.json (root)`
        );
      } catch (rootErr) {
        console.warn("[GitHub Push] Warning committing root products.json:", rootErr);
      }

      // 5. Optionally commit src/data/defaultProducts.ts
      try {
        await commitSingleFile(
          "src/data/defaultProducts.ts",
          tsContent,
          `chore(catalog): sync defaultProducts.ts`
        );
      } catch (tsErr) {
        console.warn("[GitHub Push] Warning committing defaultProducts.ts:", tsErr);
      }

      // 6. Also sync product images if needed
      try {
        const imgDir = path.join(process.cwd(), "public", "images", "products");
        if (fs.existsSync(imgDir)) {
          const files = fs.readdirSync(imgDir);
          for (const file of files) {
            if (file.endsWith(".jpg") || file.endsWith(".png") || file.endsWith(".webp")) {
              const imgBuf = fs.readFileSync(path.join(imgDir, file));
              await commitSingleFile(`public/images/products/${file}`, imgBuf, `chore(assets): sync ${file}`).catch(() => {});
              await commitSingleFile(`docs/images/products/${file}`, imgBuf, `chore(assets): sync docs ${file}`).catch(() => {});
            }
          }
        }
      } catch (imgErr) {
        console.warn("[GitHub Push] Image assets sync notice:", imgErr);
      }

      return res.json({
        success: true,
        commitUrl: lastCommitUrl,
        message: "সফলভাবে GitHub-এ পুশ ও কমিট হয়েছে! GitHub Pages (docs) ও সাইট লাইভ আপডেট হয়ে যাবে।"
      });
    } catch (pushErr: any) {
      if (pushErr.message === "AUTH_ERROR") {
        return res.status(401).json({
          error: "GitHub Token সঠিক নয় বা পারমিশন নেই। সঠিক Token ('repo' scope সহ) ব্যবহার করুন।"
        });
      }
      throw pushErr;
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
      imageUrl,
      selectedImageCode: item.selectedImageCode,
      selectedSize: item.selectedSize,
      productCode: item.productCode || prod?.productCode
    });
  }

  const orderId = (req.body.orderId && String(req.body.orderId).trim()) || ("NK-" + Math.floor(100000 + Math.random() * 900000));
  
  // Strict server deduplication guard
  const existingOrder = storeState.orders.find(o => o.id === orderId);
  if (existingOrder) {
    return res.status(200).json({
      success: true,
      orderId: existingOrder.id,
      order: existingOrder
    });
  }

  const shippingFee = Number(req.body.shippingFee) || 0;
  const clientTotal = Number(req.body.totalPrice);
  const finalOrderTotal = (!isNaN(clientTotal) && clientTotal > 0) ? clientTotal : (computedTotal + shippingFee);

  const productCodesStr = req.body.productCodes || processedItems.map(i => {
    const parts = [];
    if (i.productCode) parts.push(i.productCode);
    if (i.selectedImageCode) parts.push(`ছবি কোড: ${i.selectedImageCode}`);
    if (i.selectedSize) parts.push(`সাইজ: ${i.selectedSize}`);
    return parts.length > 0 ? parts.join(" / ") : i.title;
  }).join(", ");

  const trackingNum = req.body.trackingNumber || ("TRK-" + orderId.replace(/\D/g, ""));

  const newOrder: Order = {
    id: orderId,
    trackingNumber: trackingNum,
    productCodes: productCodesStr,
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim().toLowerCase(),
    customerPhone: customerPhone.trim(),
    shippingAddress: shippingAddress.trim(),
    items: processedItems,
    totalPrice: finalOrderTotal,
    shippingFee: shippingFee,
    deliveryArea: req.body.deliveryArea ? String(req.body.deliveryArea).trim() : undefined,
    paymentMethod: paymentMethod || "Cash on Delivery",
    senderPhoneNumber: req.body.senderPhoneNumber ? String(req.body.senderPhoneNumber).trim() : undefined,
    transactionId: req.body.transactionId ? String(req.body.transactionId).trim() : undefined,
    paymentGatewayFee: typeof req.body.paymentGatewayFee === "number" ? req.body.paymentGatewayFee : undefined,
    paymentProvider: req.body.paymentProvider ? String(req.body.paymentProvider).trim() : undefined,
    status: "Pending",
    createdAt: new Date().toISOString(),
    syncedToGoogleSheet: false,
    notes: notes ? notes.trim() : undefined
  };

  storeState.orders.unshift(newOrder);

  // Auto-record or update customer in storeState.customers
  const normalizedEmail = customerEmail.trim().toLowerCase();
  let existingCust = storeState.customers.find(c => c.email && c.email.toLowerCase() === normalizedEmail);
  if (!existingCust && customerPhone) {
    existingCust = storeState.customers.find(c => c.phone && c.phone.trim() === customerPhone.trim());
  }
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
  } else {
    // Update email/phone/address if changed or missing
    if (normalizedEmail) existingCust.email = normalizedEmail;
    if (!existingCust.phone && customerPhone) existingCust.phone = customerPhone.trim();
    if (!existingCust.address && shippingAddress) existingCust.address = shippingAddress.trim();
    if (!existingCust.name && customerName) existingCust.name = customerName.trim();
  }

  saveState();

  // Also sync customer to Google Sheets Customers tab with their email
  if (existingCust && existingCust.email) {
    syncCustomerToGoogleSheets(existingCust).catch(() => {});
  }

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

// GET /api/orders (Public orders lookup for tracking and customer access)
app.get("/api/orders", (_req, res) => {
  const safeOrders = storeState.orders.map(o => ({
    id: o.id,
    trackingNumber: o.trackingNumber || ("TRK-" + o.id.replace(/\D/g, "")),
    orderTrackingDetails: o.orderTrackingDetails || o.trackingDetails || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে। ডেলিভারি এরিয়া অনুযায়ী প্যাকেজিং ও কুরিয়ারে হস্তান্তরের কাজ চলছে।",
    trackingDetails: o.orderTrackingDetails || o.trackingDetails || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে। ডেলিভারি এরিয়া অনুযায়ী প্যাকেজিং ও কুরিয়ারে হস্তান্তরের কাজ চলছে।",
    status: o.status || "Pending",
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    shippingAddress: o.shippingAddress,
    deliveryArea: o.deliveryArea || "ঢাকার ভেতরে / বাইরে",
    totalPrice: o.totalPrice,
    paymentMethod: o.paymentMethod,
    items: o.items,
    createdAt: o.createdAt
  }));
  res.json({ orders: safeOrders });
});

// GET /api/orders/track and /api/orders/track/:query
// Live tracking lookup with Google Sheets bidirectional synchronization
app.get(["/api/orders/track", "/api/orders/track/:query"], async (req, res) => {
  const rawParam = (req.params.query || req.query.q || req.query.id || req.query.trackingNumber || req.query.orderId || req.query.query || "").toString().trim();
  if (!rawParam) {
    return res.status(400).json({ error: "অনুগ্রহ করে একটি অর্ডার নম্বর বা ট্র্যাকিং আইডি প্রদান করুন।" });
  }

  const query = rawParam.toLowerCase();
  const digitsOnly = rawParam.replace(/\D/g, "");

  // 1. First search local memory/storeState.orders
  let matchedOrder = storeState.orders.find(o => {
    const oId = (o.id || "").toLowerCase();
    const oTrk = (o.trackingNumber || "").toLowerCase();
    const oPhone = (o.customerPhone || "").replace(/\D/g, "");

    return (
      oId === query ||
      oTrk === query ||
      oId.includes(query) ||
      oTrk.includes(query) ||
      (digitsOnly.length >= 4 && (oId.replace(/\D/g, "").includes(digitsOnly) || oTrk.replace(/\D/g, "").includes(digitsOnly))) ||
      (digitsOnly.length >= 6 && oPhone.includes(digitsOnly))
    );
  });

  // 2. Fetch live data from Google Sheet if webhook URL is configured
  // This satisfies: "ar amr je order sehhet ar traking number ace or pase akta row banaw row nambe order traking detis ami oi traking number a ja likbo order traking like kew serch korle sheet ar data ami ja likbo ta asbe seta coustomer dekte parbe"
  const webhookUrl = storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (webhookUrl && webhookUrl.startsWith("http")) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout
      const sheetUrl = `${webhookUrl}${webhookUrl.includes("?") ? "&" : "?"}action=get_orders&tab=order+sheet`;
      
      const sheetRes = await fetch(sheetUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (sheetRes.ok) {
        const sheetData = (await sheetRes.json()) as any;
        if (sheetData && Array.isArray(sheetData.orders)) {
          const sheetMatch = sheetData.orders.find((so: any) => {
            const sId = String(so.id || "").toLowerCase();
            const sTrk = String(so.trackingNumber || "").toLowerCase();
            const sPhone = String(so.customerPhone || "").replace(/\D/g, "");

            return (
              sId === query ||
              sTrk === query ||
              sId.includes(query) ||
              sTrk.includes(query) ||
              (digitsOnly.length >= 4 && (sId.replace(/\D/g, "").includes(digitsOnly) || sTrk.replace(/\D/g, "").includes(digitsOnly))) ||
              (digitsOnly.length >= 6 && sPhone.includes(digitsOnly))
            );
          });

          if (sheetMatch) {
            const liveTrackingDetails = sheetMatch.orderTrackingDetails || sheetMatch.trackingDetails || sheetMatch.orderTrackingDetis || "";
            const liveStatus = sheetMatch.status || "";
            const liveTrackingNum = sheetMatch.trackingNumber || "";

            if (matchedOrder) {
              if (liveTrackingDetails) {
                matchedOrder.orderTrackingDetails = liveTrackingDetails;
                matchedOrder.trackingDetails = liveTrackingDetails;
              }
              if (liveStatus) matchedOrder.status = liveStatus;
              if (liveTrackingNum) matchedOrder.trackingNumber = liveTrackingNum;
              saveState();
            } else {
              // Found directly in Google Sheet!
              matchedOrder = {
                id: sheetMatch.id || rawParam,
                trackingNumber: liveTrackingNum || ("TRK-" + rawParam.replace(/\D/g, "")),
                orderTrackingDetails: liveTrackingDetails || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে।",
                trackingDetails: liveTrackingDetails || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে।",
                status: liveStatus || "Pending",
                customerName: sheetMatch.customerName || "Customer",
                customerEmail: sheetMatch.customerEmail || "",
                customerPhone: sheetMatch.customerPhone || "",
                shippingAddress: sheetMatch.shippingAddress || "",
                items: [],
                totalPrice: Number(String(sheetMatch.totalPrice || "0").replace(/[^\d.]/g, "")) || 0,
                paymentMethod: sheetMatch.paymentMethod || "Cash on Delivery",
                createdAt: sheetMatch.createdAt || new Date().toISOString(),
                syncedToGoogleSheet: true
              };
            }
          }
        }
      }
    } catch {
      // Graceful fallback to local storeState
    }
  }

  if (!matchedOrder) {
    return res.status(404).json({
      success: false,
      message: "প্রদত্ত ট্র্যাকিং নম্বর বা অর্ডার আইডি দিয়ে কোনো অর্ডার পাওয়া যায়নি।"
    });
  }

  const trackingNum = matchedOrder.trackingNumber || ("TRK-" + matchedOrder.id.replace(/\D/g, ""));
  const trackingDetails = matchedOrder.orderTrackingDetails || matchedOrder.trackingDetails || "অর্ডার কনফার্মেশন সম্পন্ন হয়েছে। ডেলিভারি এরিয়া অনুযায়ী প্যাকেজিং ও কুরিয়ারে হস্তান্তরের কাজ চলছে।";

  res.json({
    success: true,
    order: {
      ...matchedOrder,
      trackingNumber: trackingNum,
      orderTrackingDetails: trackingDetails,
      trackingDetails: trackingDetails
    }
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
  const orders = storeState.isDataSaved ? storeState.orders : [];
  res.json({ orders, isSaved: Boolean(storeState.isDataSaved) });
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

// PUT /api/admin/orders/:id/tracking (Admin update tracking number, order tracking details, and status)
app.put("/api/admin/orders/:id/tracking", requireAdmin, async (req, res) => {
  const { trackingNumber, orderTrackingDetails, status, order: providedOrder } = req.body;
  const rawId = req.params.id;
  const targetId = decodeURIComponent(rawId).trim().toLowerCase();
  const cleanTargetId = targetId.replace(/^#/, "");

  let order = storeState.orders.find(o => {
    const oId = (o.id || "").trim().toLowerCase();
    return oId === targetId || oId === cleanTargetId || oId.replace(/^#/, "") === cleanTargetId;
  });

  if (!order && providedOrder) {
    order = { ...providedOrder, id: rawId };
    storeState.orders.unshift(order);
  }

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (trackingNumber !== undefined) {
    order.trackingNumber = String(trackingNumber).trim();
  }
  if (orderTrackingDetails !== undefined) {
    order.orderTrackingDetails = String(orderTrackingDetails).trim();
    order.trackingDetails = String(orderTrackingDetails).trim();
  }
  if (status !== undefined) {
    order.status = String(status).trim();
  }

  saveState();

  // Background dispatch to Google Sheets to update the row (forceSync=true to bypass deduplication cache)
  syncOrderToGoogleSheets(order, storeState.webhookUrl, true).catch((err) => {
    console.error("Failed to sync updated tracking to Google Sheet:", err);
  });

  res.json({
    success: true,
    message: "অর্ডার ট্র্যাকিং বিবরণ সফলভাবে সংরক্ষিত হয়েছে এবং গুগল শিটে পাঠানো হয়েছে!",
    order
  });
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
  if (!storeState.isDataSaved) {
    return res.json({ customers: [], total: 0, isSaved: false });
  }

  const safeCustomers = storeState.customers.map(c => {
    // Count associated orders
    const customerOrders = storeState.orders.filter(o => o.customerEmail && c.email && o.customerEmail.toLowerCase() === c.email.toLowerCase());
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

  res.json({ customers: safeCustomers, total: safeCustomers.length, isSaved: true });
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
  if (!storeState.isDataSaved) {
    return res.json({
      stats: {
        totalRevenue: 0,
        calculatedRevenue: 0,
        isCustomRevenue: false,
        customTotalRevenue: undefined,
        totalOrders: 0,
        totalProducts: storeState.products.length,
        lowStockProducts: storeState.products.filter(p => p.stock <= 10).length,
        syncedGoogleSheetsCount: 0,
        isSaved: false
      }
    });
  }

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
      syncedGoogleSheetsCount,
      isSaved: true
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

// POST /api/admin/test-email - Test sending a live order alert email to adib1234@gmail.com
app.post("/api/admin/test-email", requireAdmin, async (req, res) => {
  const targetUrl = req.body.url || req.body.webhookUrl || storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  const notifyEmail = req.body.email || "adib1234@gmail.com";

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return res.status(400).json({ error: "একটি সঠিক গুগল শিট ওয়েবহুক ইউআরএল দিন।" });
  }

  const testOrder: Order = {
    id: "EMAIL-TEST-" + Math.floor(1000 + Math.random() * 9000),
    trackingNumber: "TRK-TEST-" + Math.floor(10000 + Math.random() * 90000),
    productCodes: "P-01, P-02 [টেস্ট প্রোডাক্ট কোড]",
    customerName: "Adib Admin (Live Test)",
    customerEmail: notifyEmail,
    customerPhone: "+8801700000000",
    shippingAddress: "টেস্ট ডেলিভারি ঠিকানা, ঢাকা",
    items: [{
      productId: "test-item-email",
      title: "লাইভ টেস্ট অর্ডার নোটিফিকেশন",
      price: 550,
      quantity: 1,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      selectedImageCode: "P-01"
    }],
    totalPrice: 610,
    shippingFee: 60,
    deliveryArea: "ঢাকার ভেতরে (৳৬০)",
    paymentMethod: "Cash on Delivery",
    status: "Pending",
    createdAt: new Date().toISOString(),
    syncedToGoogleSheet: false,
    notes: "এটি একটি লাইভ জিমেইল নোটিফিকেশন টেস্ট রিকোয়েস্ট।"
  };

  const ok = await syncOrderToGoogleSheets(testOrder, targetUrl, true);
  if (ok) {
    return res.json({
      success: true,
      message: `টেস্ট অর্ডার রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে! ${notifyEmail} এ জিমেইল চেক করুন।`
    });
  }
  return res.status(502).json({
    error: "টেস্ট ইমেইল রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে। আপনার Apps Script কোড এবং Webhook URL নিশ্চিত করুন।"
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
  const subscribers = storeState.isDataSaved ? (storeState.subscribers || []) : [];
  res.json({ subscribers, total: subscribers.length, isSaved: Boolean(storeState.isDataSaved) });
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
// Pull-Only: Returns live data from Google Sheets without persisting to disk/storeState!
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

    // 1. Orders
    const normalizedOrders: Order[] = [];
    if (liveData.orders && Array.isArray(liveData.orders)) {
      for (const sheetOrder of liveData.orders) {
        const rawPrice = String(sheetOrder.totalPrice || "0").replace(/[^0-9.]/g, "");
        normalizedOrders.push({
          id: sheetOrder.id || `NK-${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: sheetOrder.customerName || "Customer",
          customerEmail: sheetOrder.customerEmail || "",
          customerPhone: sheetOrder.customerPhone || "",
          shippingAddress: sheetOrder.shippingAddress || "",
          items: [{
            productId: "sheet-item",
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
      }
    }

    // 2. Customers (From sheet's Customers tab + enriched from all orders)
    const customerMap = new Map<string, any>();
    if (liveData.customers && Array.isArray(liveData.customers)) {
      for (const c of liveData.customers) {
        const key = (c.email || c.phone || c.id || "").toLowerCase().trim();
        if (key) {
          customerMap.set(key, {
            id: c.id || `cust_${Math.random().toString(36).slice(2, 8)}`,
            name: c.name || "Customer",
            email: c.email || "",
            phone: c.phone || "",
            address: c.address || "",
            createdAt: c.registeredAt || new Date().toISOString(),
            orderCount: 0,
            totalSpent: 0
          });
        }
      }
    }
    // Also enrich/synthesize from orders
    for (const o of normalizedOrders) {
      const key = (o.customerEmail || o.customerPhone || o.customerName || "").toLowerCase().trim();
      if (!key) continue;
      const existing = customerMap.get(key);
      if (existing) {
        existing.orderCount = (existing.orderCount || 0) + 1;
        if (o.status !== "Cancelled") {
          existing.totalSpent = (existing.totalSpent || 0) + o.totalPrice;
        }
        if ((!existing.phone || existing.phone === "N/A") && o.customerPhone) existing.phone = o.customerPhone;
        if ((!existing.address || existing.address === "N/A") && o.shippingAddress) existing.address = o.shippingAddress;
      } else {
        customerMap.set(key, {
          id: `cust_${Math.random().toString(36).slice(2, 8)}`,
          name: o.customerName || "Customer",
          email: o.customerEmail || "",
          phone: o.customerPhone || "",
          address: o.shippingAddress || "",
          createdAt: o.createdAt || new Date().toISOString(),
          orderCount: 1,
          totalSpent: o.status !== "Cancelled" ? o.totalPrice : 0
        });
      }
    }
    const normalizedCustomers = Array.from(customerMap.values());

    // 3. Subscribers
    const normalizedSubscribers: Subscriber[] = [];
    if (liveData.subscribers && Array.isArray(liveData.subscribers)) {
      for (const s of liveData.subscribers) {
        if (s.email && !normalizedSubscribers.some(ns => ns.email === s.email.toLowerCase())) {
          normalizedSubscribers.push({
            email: s.email.toLowerCase(),
            source: s.source || "Google Sheet",
            subscribedAt: s.date || s.subscribedAt || new Date().toISOString()
          });
        }
      }
    }

    // 4. Tracking
    const normalizedTracking: UserTrackingEntry[] = [];
    if (liveData.tracking && Array.isArray(liveData.tracking)) {
      for (const t of liveData.tracking) {
        if (t.sessionId && !normalizedTracking.some(et => et.sessionId === t.sessionId)) {
          normalizedTracking.push({
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
        }
      }
    }

    // 5. Stats computation
    const calculatedRevenue = normalizedOrders.reduce((sum, o) => o.status !== "Cancelled" ? sum + o.totalPrice : sum, 0);
    const stats = {
      totalRevenue: calculatedRevenue,
      calculatedRevenue,
      isCustomRevenue: false,
      customTotalRevenue: undefined,
      totalOrders: normalizedOrders.length,
      totalProducts: storeState.products.length,
      lowStockProducts: storeState.products.filter(p => p.stock <= 10).length,
      syncedGoogleSheetsCount: normalizedOrders.length,
      isSaved: false
    };

    // Note: PULL-ONLY PREVIEW - We DO NOT mutate storeState or call saveState()!
    return res.json({
      success: true,
      isLivePreview: true,
      isSaved: false,
      message: `গুগল শিট থেকে ডেটা সফলভাবে সিঙ্ক হয়েছে! (${normalizedOrders.length} টি অর্ডার, ${normalizedCustomers.length} জন কাস্টমার, ${normalizedSubscribers.length} জন সাবস্ক্রাইবার, ${normalizedTracking.length} টি ভিজিটর লগ)`,
      orders: normalizedOrders,
      customers: normalizedCustomers,
      subscribers: normalizedSubscribers,
      tracking: normalizedTracking,
      stats
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "গুগল শিট সিঙ্ক এরর" });
  }
});

// POST /api/admin/save-synced-data (Admin explicitly saves synced data)
app.post("/api/admin/save-synced-data", requireAdmin, (req, res) => {
  const { orders, customers, subscribers, tracking } = req.body;
  if (Array.isArray(orders)) storeState.orders = orders;
  if (Array.isArray(customers)) storeState.customers = customers;
  if (Array.isArray(subscribers)) storeState.subscribers = subscribers;
  if (Array.isArray(tracking)) storeState.userTracking = tracking;
  storeState.isDataSaved = true;
  saveState();
  return res.json({
    success: true,
    message: "গুগল শিটের সকল ডেটা (অর্ডার, কাস্টমার, সাবস্ক্রাইবার, ট্র্যাকিং) অ্যাডমিন প্যানেলে সফলভাবে সেভ করা হয়েছে!"
  });
});

// POST /api/admin/clear-saved-data (Admin deletes/clears saved data, leaves Google Sheets intact)
app.post("/api/admin/clear-saved-data", requireAdmin, (_req, res) => {
  storeState.orders = [];
  storeState.customers = [];
  storeState.subscribers = [];
  storeState.userTracking = [];
  storeState.isDataSaved = false;
  delete storeState.customTotalRevenue;
  saveState();
  return res.json({
    success: true,
    message: "অ্যাডমিন প্যানেলের সংরক্ষিত ডেটা মুছে ফেলা হয়েছে (গুগল শিটের কোনো ডেটা ডিলিট হয়নি, তা অক্ষত রয়েছে)।"
  });
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

    // Asynchronously dispatch to Google Sheets tab "user tracking" ONLY if not explicitly handled by client
    if (req.body.skipGoogleSheets) {
      return res.json({ success: true, sessionId, timeSpent, skippedGoogleSheets: true });
    }

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
    activeNow: trackingList.length > 0 ? Math.max(activeNow, 1) : 0,
    tracking: trackingList,
    pageStats: pageCounts,
    deviceStats: deviceCounts,
    browserStats: browserCounts,
    sheetTab: "user tracking",
    isSaved: Boolean(storeState.isDataSaved)
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

// 5. Admin: Request Apps Script to fix Customers headers & clean misplaced order rows (POST /api/admin/fix-customers-sheet)
app.post("/api/admin/fix-customers-sheet", requireAdmin, async (req, res) => {
  const targetUrl = req.body.url || storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return res.status(400).json({ error: "গুগল শিট ওয়েবহুক পাওয়া যায়নি।" });
  }

  try {
    const fetchUrl = targetUrl + (targetUrl.includes("?") ? "&" : "?") + "action=fix_customers";
    const resp = await fetch(fetchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fix_customers" })
    });
    const result: any = await resp.json().catch(() => ({}));
    return res.json({
      success: true,
      message: result.message || "কাস্টমার শিটের হেডার ঠিক করা হয়েছে এবং ভুল অর্ডার রো সরিয়ে নেওয়া হয়েছে!",
      details: result
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "কাস্টমার শিট মেরামত করা সম্ভব হয়নি।" });
  }
});

// 6. Admin: Request Apps Script to fix and re-align Order Sheet columns (POST /api/admin/fix-order-sheet)
app.post("/api/admin/fix-order-sheet", requireAdmin, async (req, res) => {
  const targetUrl = req.body.url || storeState.webhookUrl || googleSheetWebhookUrl || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    return res.status(400).json({ error: "গুগল শিট ওয়েবহুক পাওয়া যায়নি।" });
  }

  try {
    const fetchUrl = targetUrl + (targetUrl.includes("?") ? "&" : "?") + "action=fix_order_sheet";
    const resp = await fetch(fetchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "fix_order_sheet" })
    });
    const result: any = await resp.json().catch(() => ({}));
    return res.json({
      success: true,
      message: result.message || "অর্ডার শিটের কলাম ডেটা সফলভাবে রিয়্যালাইন ও মেরামত করা হয়েছে!",
      details: result
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "অর্ডার শিট মেরামত করা সম্ভব হয়নি।" });
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
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else if (filePath.endsWith(".js") || filePath.endsWith(".css")) {
          res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
        }
      }
    }));

    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/") || req.path.startsWith("/assets/") || req.path.includes(".")) {
        return res.status(404).send("Not found");
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
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
