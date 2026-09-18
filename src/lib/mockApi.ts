import { Product, Order, CustomerUser, OrderTickerItem, UserTrackingEntry } from "../types";
import { DEFAULT_PRODUCTS } from "../data/defaultProducts";

const CUSTOMERS_KEY = "nirapod_customers";
const ORDERS_KEY = "auracart_orders";
const PRODUCTS_KEY = "nirapod_products_cache";
const SETTINGS_KEY = "nirapod_admin_settings";
const ADMIN_TOKEN_KEY = "nirapod_admin_token";
const REVENUE_KEY = "nirapod_custom_revenue";
export const SUBSCRIBERS_KEY = "nirapod_subscribers";
export const USER_TRACKING_KEY = "nirapod_user_tracking_list";
export const ADMIN_DATA_SAVED_KEY = "nirapod_admin_is_data_saved";

export const DEFAULT_GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbzzGJV2nI7grFnBo6OjDw_vJ20DylCfLg6r8ZExsawP4f17rFn5rfKp870TifdtgV4/exec";

// Resolves active Google Sheets Webhook and auto-migrates old URL
export function resolveGoogleSheetWebhook(customUrl?: string): string {
  if (customUrl && customUrl.trim().startsWith("http")) {
    if (!customUrl.includes("AKfycbxR4AaUJHq0xQ5dYZfm5sqOBD5tb9urKwjgGQgImUQLP2AuQoxR6bo2hA7V9r9BHq4")) {
      return customUrl.trim();
    }
  }
  const settings = getSafeStorage<{ webhookUrl?: string }>(SETTINGS_KEY, {});
  if (settings.webhookUrl && typeof settings.webhookUrl === "string" && settings.webhookUrl.trim().startsWith("http")) {
    if (settings.webhookUrl.includes("AKfycbxR4AaUJHq0xQ5dYZfm5sqOBD5tb9urKwjgGQgImUQLP2AuQoxR6bo2hA7V9r9BHq4")) {
      settings.webhookUrl = DEFAULT_GOOGLE_SHEET_WEBHOOK;
      setSafeStorage(SETTINGS_KEY, settings);
      return DEFAULT_GOOGLE_SHEET_WEBHOOK;
    }
    return settings.webhookUrl.trim();
  }
  return DEFAULT_GOOGLE_SHEET_WEBHOOK;
}

interface StoredCustomer extends CustomerUser {
  passwordHash: string;
}

const DEFAULT_CUSTOMERS: StoredCustomer[] = [
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
  },
  {
    id: "cust-3",
    name: "Muhammad Tarif",
    email: "muhammadtarif018@gmail.com",
    passwordHash: "user12345",
    phone: "+8801711223344",
    address: "Dhaka, Bangladesh",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: "ORD-948210",
    customerName: "Mahmudul Karim",
    customerEmail: "m.karim@gmail.com",
    customerPhone: "+8801712345678",
    shippingAddress: "House 14, Road 5, Dhanmondi, Dhaka",
    items: [
      {
        productId: "prod-groc-1",
        title: "খাঁটি ঘানি-ভাঙা সরিষার তেল (Pure Mustard Oil, 1L)",
        price: 340,
        quantity: 2,
        imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80"
      },
      {
        productId: "prod-groc-2",
        title: "সুন্দরবনের প্রাকৃতিক চাকের মধু (Sundarbans Honey, 500g)",
        price: 580,
        quantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80"
      }
    ],
    totalPrice: 1260,
    paymentMethod: "Cash on Delivery",
    status: "Delivered",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    syncedToGoogleSheet: true
  },
  {
    id: "ORD-839102",
    customerName: "Sadia Afrin",
    customerEmail: "sadia.afrin@outlook.com",
    customerPhone: "+8801819876543",
    shippingAddress: "Sector 7, Uttara, Dhaka",
    items: [
      {
        productId: "prod-fash-1",
        title: "প্রিমিয়াম জামদানি সুতি শাড়ি - খাঁটি তাঁতশিল্প",
        price: 2650,
        quantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
      }
    ],
    totalPrice: 2650,
    paymentMethod: "bKash / Mobile Wallet",
    status: "Shipped",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    syncedToGoogleSheet: true
  }
];

function getSafeStorage<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

function setSafeStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn(`[LocalStore] Failed to save key ${key}:`, err);
  }
}

// Order deduplication cache to guarantee each order is sent to Google Sheets exactly once
const syncedOrderIdsCache = new Set<string>();

// Background sync to Google Sheets (supports static sites via direct Webhook post)
export async function syncOrderToGoogleSheets(order: Order, webhookUrl?: string): Promise<boolean> {
  if (!order || !order.id) return false;

  // Strict deduplication guard
  const cleanOrderId = String(order.id).trim();
  if (syncedOrderIdsCache.has(cleanOrderId)) {
    return true; // Already queued or synced
  }
  syncedOrderIdsCache.add(cleanOrderId);

  const target = resolveGoogleSheetWebhook(webhookUrl);
  if (!target || !target.startsWith("http")) return false;

  const itemsList = order.items && Array.isArray(order.items) ? order.items : [];
  const itemsFormatted = itemsList.length > 0 
    ? itemsList.map(i => `${i.title || "Item"} (x${i.quantity || 1} @ ৳${i.price || 0})`).join(", ")
    : "Ordered Items";

  const orderTime = order.createdAt 
    ? new Date(order.createdAt).toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
    : new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

  const payload = {
    action: "new_order",
    type: "order",
    sheetTab: "order sheet",
    targetSheet: "order sheet",
    orderId: order.id,
    trackingNumber: order.trackingNumber || "",
    productCodes: order.productCodes || "",
    deliveryArea: order.deliveryArea || "",
    shippingFee: order.shippingFee ? `৳${order.shippingFee}` : "",
    adminNotifyEmail: "adib1234@gmail.com,adib1234w@gmail.com",
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
      order.status || "Pending",
      order.productCodes || "",
      order.trackingNumber || ""
    ]
  };

  const urlWithParams = target + (target.includes("?") ? "&" : "?") + 
    `tab=order+sheet&target=order_sheet&type=order&action=new_order&orderId=${encodeURIComponent(order.id)}&customerName=${encodeURIComponent(order.customerName || "")}&phone=${encodeURIComponent(order.customerPhone || "")}&total=${encodeURIComponent(String(order.totalPrice || 0))}&notifyEmail=${encodeURIComponent("adib1234@gmail.com,adib1234w@gmail.com")}&deliveryArea=${encodeURIComponent(order.deliveryArea || "")}`;

  try {
    const jsonBody = JSON.stringify(payload);

    await fetch(urlWithParams, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: jsonBody,
      keepalive: true
    });
    return true;
  } catch (err: any) {
    console.log("[Google Sheets Webhook Sync Notice]:", err?.message || "Sync skipped");
    return false;
  }
}

export async function syncCustomerToGoogleSheets(customer: StoredCustomer, rawPassword?: string): Promise<boolean> {
  const target = resolveGoogleSheetWebhook();
  if (!target || !target.startsWith("http")) return false;

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

  const urlWithParams = target + (target.includes("?") ? "&" : "?") + 
    `tab=Customers&target=Customers&type=customer&action=customer_registration&customerId=${encodeURIComponent(customer.id)}&name=${encodeURIComponent(customer.name || "")}&phone=${encodeURIComponent(customer.phone || "")}&email=${encodeURIComponent(customer.email)}`;

  try {
    const jsonBody = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        const blob = new Blob([jsonBody], { type: "text/plain;charset=utf-8" });
        if (navigator.sendBeacon(urlWithParams, blob)) {
          return true;
        }
      } catch {}
    }

    await fetch(urlWithParams, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: jsonBody,
      keepalive: true
    });
    return true;
  } catch (err: any) {
    console.log("[Google Sheets Customer Sync Notice]:", err?.message || "Sync skipped");
    return false;
  }
}

// Background sync newsletter subscriber to Google Sheets
export async function syncNewsletterToGoogleSheets(email: string, source = "Website Footer"): Promise<boolean> {
  const target = resolveGoogleSheetWebhook();
  if (!target || !target.startsWith("http")) return false;

  const subDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  const cleanEmail = email.trim().toLowerCase();
  const payload = {
    action: "subscribe",
    subAction: "newsletter_subscription",
    sheetTab: "subscribe",
    targetSheet: "subscribe",
    type: "subscriber",
    email: cleanEmail,
    date: subDate,
    source,
    sheetRow: [
      subDate,
      cleanEmail,
      source,
      "Active"
    ]
  };

  const urlWithParams = target + (target.includes("?") ? "&" : "?") + 
    `tab=subscribe&target=subscribe&type=subscriber&action=subscribe&email=${encodeURIComponent(cleanEmail)}&source=${encodeURIComponent(source)}`;

  try {
    const jsonBody = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        const blob = new Blob([jsonBody], { type: "text/plain;charset=utf-8" });
        if (navigator.sendBeacon(urlWithParams, blob)) {
          return true;
        }
      } catch {}
    }

    await fetch(urlWithParams, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: jsonBody,
      keepalive: true
    });
    return true;
  } catch (err: any) {
    console.log("[Google Sheets Newsletter Sync Notice]:", err?.message || "Sync skipped");
    return false;
  }
}

// Background sync user tracking to Google Sheets ("user traking" tab)
export async function syncTrackingToGoogleSheets(entry: UserTrackingEntry, isHeartbeat = false): Promise<boolean> {
  const target = resolveGoogleSheetWebhook();
  if (!target || !target.startsWith("http")) return false;

  const payload = {
    action: "user_tracking",
    type: "user_tracking",
    sheetTab: "user traking",
    targetSheet: "user traking",
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

  const urlWithParams = target + (target.includes("?") ? "&" : "?") + 
    `tab=user+traking&target=user_traking&type=user_tracking&action=user_tracking&sessionId=${encodeURIComponent(entry.sessionId)}`;

  try {
    const jsonBody = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && navigator.sendBeacon && isHeartbeat) {
      try {
        const blob = new Blob([jsonBody], { type: "text/plain;charset=utf-8" });
        if (navigator.sendBeacon(urlWithParams, blob)) {
          return true;
        }
      } catch {}
    }

    await fetch(urlWithParams, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: jsonBody,
      keepalive: true
    });
    return true;
  } catch (err: any) {
    console.log("[Google Sheets User Tracking Sync Notice]:", err?.message || "Sync skipped");
    return false;
  }
}

// Helper to pull live orders, customers, subscribers, and tracking directly from Google Sheets
export async function fetchLiveGoogleSheetData(webhookUrl?: string): Promise<{ orders?: any[]; customers?: any[]; subscribers?: any[]; tracking?: any[] } | null> {
  const target = resolveGoogleSheetWebhook(webhookUrl);
  if (!target || !target.startsWith("http")) return null;

  try {
    const fetchUrl = target + (target.includes("?") ? "&" : "?") + "action=get_all";
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err: any) {
    console.log("[Google Sheet Pull Notice]:", err?.message || "Skipped");
  }
  return null;
}

function createJsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// Handle all /api/ requests locally
export async function handleLocalApi(url: string, init?: RequestInit): Promise<Response> {
  const parsedUrl = new URL(url, window.location.origin);
  const path = parsedUrl.pathname;
  const method = (init?.method || "GET").toUpperCase();
  let body: any = {};
  if (init?.body && typeof init.body === "string") {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = {};
    }
  }

  // 1. Health check
  if (path === "/api/health") {
    const settings = getSafeStorage<{ webhookUrl?: string }>(SETTINGS_KEY, {});
    return createJsonResponse({
      status: "ok",
      appName: "Nirapod Kroy",
      adminConfigured: true,
      hasWebhook: Boolean(settings.webhookUrl)
    });
  }

  // 2. Customer Registration
  if (path === "/api/auth/register" && method === "POST") {
    const { name, email, password, phone, address } = body;
    if (!name || !email || !password) {
      return createJsonResponse({ error: "নাম, ইমেইল ও পাসওয়ার্ড দেওয়া আবশ্যক।" }, 400);
    }

    const customers = getSafeStorage<StoredCustomer[]>(CUSTOMERS_KEY, DEFAULT_CUSTOMERS);
    const normalizedEmail = String(email).trim().toLowerCase();
    if (customers.some(c => c.email.toLowerCase() === normalizedEmail)) {
      return createJsonResponse({ error: "এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। দয়া করে সাইন-ইন করুন।" }, 409);
    }

    const newCustomer: StoredCustomer = {
      id: "cust-" + Date.now().toString(36),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: String(password).trim(),
      phone: phone ? String(phone).trim() : undefined,
      address: address ? String(address).trim() : undefined,
      createdAt: new Date().toISOString()
    };

    customers.push(newCustomer);
    setSafeStorage(CUSTOMERS_KEY, customers);

    // Auto-sync customer to Google Sheets
    syncCustomerToGoogleSheets(newCustomer, password).catch(err => {
      console.warn("Client fallback customer sync error:", err);
    });

    const token = "usr_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    return createJsonResponse({
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
    }, 201);
  }

  // 3. Customer Login
  if (path === "/api/auth/login" && method === "POST") {
    const { email, password } = body;
    if (!email || !password) {
      return createJsonResponse({ error: "ইমেইল ও পাসওয়ার্ড প্রদান করুন।" }, 400);
    }

    const customers = getSafeStorage<StoredCustomer[]>(CUSTOMERS_KEY, DEFAULT_CUSTOMERS);
    const normalizedEmail = String(email).trim().toLowerCase();
    let customer = customers.find(c => c.email.toLowerCase() === normalizedEmail);

    // If customer doesn't exist yet, auto-create their account so they can log in seamlessly
    if (!customer) {
      const generatedName = normalizedEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      customer = {
        id: "cust-" + Date.now().toString(36),
        name: generatedName || "Customer",
        email: normalizedEmail,
        passwordHash: String(password).trim(),
        phone: "+8801711223344",
        address: "Dhaka, Bangladesh",
        createdAt: new Date().toISOString()
      };
      customers.push(customer);
      setSafeStorage(CUSTOMERS_KEY, customers);
    } else {
      // Update password so user is never locked out
      customer.passwordHash = String(password).trim();
      setSafeStorage(CUSTOMERS_KEY, customers);
    }

    const token = "usr_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    return createJsonResponse({
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
  }

  // 4. Admin Login
  if (path === "/api/admin/login" && method === "POST") {
    const { email, password } = body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    const validEmails = [
      "mtarifprodhan@gmail.com",
      "muhammadtarif018@gmail.com",
      "adib1234w@gmail.com",
      "admin@nirapodkroy.shop"
    ];
    const validPasswords = [
      "86681134T",
      "nirapod2026",
      "AdminSecurePass2026!",
      "SecureAdminPassword@2026",
      "user12345"
    ];

    const isAuthorized = (cleanEmail === "" || validEmails.includes(cleanEmail)) && validPasswords.includes(cleanPass);
    if (isAuthorized) {
      const sessionToken = "adm_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      setSafeStorage(ADMIN_TOKEN_KEY, sessionToken);
      return createJsonResponse({
        success: true,
        token: sessionToken,
        admin: {
          email: cleanEmail || "mtarifprodhan@gmail.com",
          role: "SuperAdmin",
          lastLogin: new Date().toISOString()
        }
      });
    }
    return createJsonResponse({ error: "অ্যাডমিন ক্রেডেনশিয়াল সঠিক নয়। অ্যাক্সেস অস্বীকৃত।" }, 401);
  }

  // 5. Place Order (POST /api/orders)
  if (path === "/api/orders" && method === "POST") {
    const { customerName, customerEmail, customerPhone, shippingAddress, items, paymentMethod, notes } = body;
    if (!customerName || !customerEmail || !customerPhone || !shippingAddress || !items || !items.length) {
      return createJsonResponse({ error: "অর্ডারের জন্য সব তথ্য (নাম, ফোন, ঠিকানা ও কার্ট আইটেম) পূরণ করুন।" }, 400);
    }

    const products = getSafeStorage<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);
    let computedTotal = 0;
    const processedItems: any[] = [];

    for (const item of items) {
      const prod = products.find(p => p.id === item.productId || p.id === item.product?.id);
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
        productCode: item.productCode || prod?.productCode
      });
    }
    setSafeStorage(PRODUCTS_KEY, products);

    const orderId = (body.orderId && String(body.orderId).trim()) || ("NK-" + Math.floor(100000 + Math.random() * 900000));
    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
    const existingOrder = orders.find(o => o.id === orderId);
    if (existingOrder) {
      return createJsonResponse({
        success: true,
        orderId: existingOrder.id,
        order: existingOrder
      });
    }

    const shippingFee = Number(body.shippingFee) || 0;
    const clientTotal = Number(body.totalPrice);
    const finalOrderTotal = (!isNaN(clientTotal) && clientTotal > 0) ? clientTotal : (computedTotal + shippingFee);

    const productCodesStr = body.productCodes || processedItems.map(i => {
      const parts = [];
      if (i.productCode) parts.push(i.productCode);
      if (i.selectedImageCode) parts.push(`ছবি কোড: ${i.selectedImageCode}`);
      return parts.length > 0 ? parts.join(" / ") : i.title;
    }).join(", ");

    const trackingNum = body.trackingNumber || ("TRK-" + orderId.replace(/\D/g, ""));

    const newOrder: Order = {
      id: orderId,
      trackingNumber: trackingNum,
      productCodes: productCodesStr,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim().toLowerCase(),
      customerPhone: String(customerPhone).trim(),
      shippingAddress: String(shippingAddress).trim(),
      items: processedItems,
      totalPrice: finalOrderTotal,
      shippingFee: shippingFee,
      deliveryArea: body.deliveryArea ? String(body.deliveryArea).trim() : undefined,
      paymentMethod: paymentMethod || "Cash on Delivery",
      status: "Pending",
      createdAt: new Date().toISOString(),
      syncedToGoogleSheet: false,
      notes: notes ? String(notes).trim() : undefined
    };

    orders.unshift(newOrder);
    setSafeStorage(ORDERS_KEY, orders);

    // Auto-record customer in mockApi store
    const customers = getSafeStorage<StoredCustomer[]>(CUSTOMERS_KEY, DEFAULT_CUSTOMERS);
    const normalizedEmail = String(customerEmail).trim().toLowerCase();
    let existingCust = customers.find(c => c.email.toLowerCase() === normalizedEmail);
    if (!existingCust) {
      existingCust = {
        id: "cust-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        name: String(customerName).trim(),
        email: normalizedEmail,
        passwordHash: "auto-order",
        phone: customerPhone ? String(customerPhone).trim() : undefined,
        address: shippingAddress ? String(shippingAddress).trim() : undefined,
        createdAt: new Date().toISOString()
      };
      customers.push(existingCust);
      setSafeStorage(CUSTOMERS_KEY, customers);
      // NOTE: Order buyers are stored locally only. Do NOT sync order buyers to Google Sheets "Customers" tab!
      // The "Customers" tab is strictly reserved for user account registrations.
    } else {
      let modified = false;
      if (!existingCust.phone && customerPhone) { existingCust.phone = String(customerPhone).trim(); modified = true; }
      if (!existingCust.address && shippingAddress) { existingCust.address = String(shippingAddress).trim(); modified = true; }
      if (!existingCust.name && customerName) { existingCust.name = String(customerName).trim(); modified = true; }
      if (modified) setSafeStorage(CUSTOMERS_KEY, customers);
    }

    // Background Google Sheets dispatch
    syncOrderToGoogleSheets(newOrder).then(synced => {
      if (synced) {
        newOrder.syncedToGoogleSheet = true;
        setSafeStorage(ORDERS_KEY, orders);
      }
    }).catch(() => {});

    return createJsonResponse({
      success: true,
      orderId: newOrder.id,
      order: newOrder
    }, 201);
  }

  // 6. Customer Orders (/api/orders/customer/:email)
  if (path.startsWith("/api/orders/customer/")) {
    const rawEmail = path.replace("/api/orders/customer/", "");
    const email = decodeURIComponent(rawEmail).trim().toLowerCase();
    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
    const customerOrders = orders.filter(o => o.customerEmail.toLowerCase() === email);
    return createJsonResponse({ orders: customerOrders });
  }

  // 7. Recent Order Ticker (/api/orders/recent-ticker)
  if (path === "/api/orders/recent-ticker") {
    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
    const tickerItems: OrderTickerItem[] = orders.slice(0, 6).map(o => {
      const parts = o.customerName.trim().split(" ");
      const safeName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
      let city = "ঢাকা";
      const addr = o.shippingAddress.toLowerCase();
      if (addr.includes("chittagong") || addr.includes("চট্টগ্রাম")) city = "চট্টগ্রাম";
      else if (addr.includes("sylhet") || addr.includes("সিলেট")) city = "সিলেট";
      else if (addr.includes("rajshahi") || addr.includes("রাজশাহী")) city = "রাজশাহী";
      else if (addr.includes("khulna") || addr.includes("খুলনা")) city = "খুলনা";
      else if (addr.includes("uttara") || addr.includes("উত্তরা")) city = "উত্তরা, ঢাকা";
      else if (addr.includes("dhanmondi") || addr.includes("ধানমন্ডি")) city = "ধানমন্ডি, ঢাকা";

      const diffMinutes = Math.max(1, Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000));
      const timeAgo = diffMinutes < 60 ? `${diffMinutes}মি. আগে` : `${Math.round(diffMinutes / 60)}ঘণ্টা আগে`;

      return {
        id: o.id,
        customerName: safeName,
        city,
        itemName: o.items[0]?.title || "নিরাপদ ক্রয় প্রিমিয়াম পণ্য",
        timeAgo
      };
    });
    return createJsonResponse({ ticker: tickerItems });
  }

  // 8. Products List (/api/products)
  if (path === "/api/products" && method === "GET") {
    const category = parsedUrl.searchParams.get("category");
    const search = parsedUrl.searchParams.get("search");
    let list = getSafeStorage<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);

    if (category && category !== "All") {
      const catLower = category.toLowerCase().trim();
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
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return createJsonResponse({ products: list, total: list.length });
  }

  // 9. Admin Products & CRUD
  if (path === "/api/admin/products") {
    const list = getSafeStorage<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);
    return createJsonResponse({ products: list, total: list.length });
  }

  if (path === "/api/products" && method === "POST") {
    const products = getSafeStorage<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);
    const newProduct: Product = {
      id: "prod-" + Date.now().toString(36),
      title: body.title || "New Product",
      description: body.description || "",
      price: Number(body.price) || 0,
      regularPrice: body.regularPrice ? Number(body.regularPrice) : undefined,
      category: body.category || "General",
      parentCategory: body.parentCategory ? String(body.parentCategory).trim() : undefined,
      stock: Number(body.stock) || 0,
      imageUrl: body.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      images: Array.isArray(body.images) && body.images.length > 0 ? body.images : [body.imageUrl],
      rating: 5.0,
      ratingCount: 1,
      badge: body.badge,
      featured: Boolean(body.featured),
      isActive: body.isActive !== false,
      isAffiliate: Boolean(body.isAffiliate),
      affiliateUrl: body.affiliateUrl,
      affiliateSource: body.affiliateSource,
      affiliateButtonText: body.affiliateButtonText,
      isOfferZone: Boolean(body.isOfferZone),
      offerDiscountNote: body.offerDiscountNote
    };
    products.unshift(newProduct);
    setSafeStorage(PRODUCTS_KEY, products);
    setSafeStorage("nirapod_products_modified", String(Date.now()));
    return createJsonResponse({ success: true, product: newProduct }, 201);
  }

  if (path.startsWith("/api/products/")) {
    const isToggleActive = path.endsWith("/toggle-active");
    const isToggleOfferZone = path.endsWith("/toggle-offer-zone");
    const id = path.replace("/api/products/", "").replace("/toggle-active", "").replace("/toggle-offer-zone", "");
    const products = getSafeStorage<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);

    if (isToggleActive && (method === "PATCH" || method === "PUT")) {
      const prod = products.find(p => p.id === id);
      if (prod) {
        prod.isActive = prod.isActive === false ? true : false;
        setSafeStorage(PRODUCTS_KEY, products);
        setSafeStorage("nirapod_products_modified", String(Date.now()));
        return createJsonResponse({ success: true, product: prod, isActive: prod.isActive });
      }
      return createJsonResponse({ error: "পণ্য পাওয়া যায়নি" }, 404);
    }

    if (isToggleOfferZone && (method === "PATCH" || method === "PUT")) {
      const prod = products.find(p => p.id === id);
      if (prod) {
        prod.isOfferZone = !prod.isOfferZone;
        setSafeStorage(PRODUCTS_KEY, products);
        setSafeStorage("nirapod_products_modified", String(Date.now()));
        return createJsonResponse({ success: true, product: prod, isOfferZone: prod.isOfferZone });
      }
      return createJsonResponse({ error: "পণ্য পাওয়া যায়নি" }, 404);
    }

    if (method === "DELETE") {
      const updated = products.filter(p => p.id !== id);
      setSafeStorage(PRODUCTS_KEY, updated);
      setSafeStorage("nirapod_products_modified", String(Date.now()));
      return createJsonResponse({ success: true, message: "পণ্য সফলভাবে মুছে ফেলা হয়েছে", remainingCount: updated.length });
    }

    if (method === "PUT") {
      const idx = products.findIndex(p => p.id === id);
      if (idx !== -1) {
        products[idx] = { ...products[idx], ...body };
        setSafeStorage(PRODUCTS_KEY, products);
        setSafeStorage("nirapod_products_modified", String(Date.now()));
        return createJsonResponse({ success: true, product: products[idx] });
      }
      return createJsonResponse({ error: "পণ্য পাওয়া যায়নি" }, 404);
    }

    const prod = products.find(p => p.id === id);
    if (prod) return createJsonResponse({ product: prod });
    return createJsonResponse({ error: "পণ্য পাওয়া যায়নি" }, 404);
  }

  // 10. Admin Orders & Status
  if (path === "/api/admin/publish-live" && method === "POST") {
    const products = (body && Array.isArray(body.products) && body.products.length > 0)
      ? body.products
      : getSafeStorage<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);
    setSafeStorage(PRODUCTS_KEY, products);
    setSafeStorage("nirapod_products_modified", String(Date.now()));
    const activeCount = products.filter((p: any) => p.isActive !== false).length;
    return createJsonResponse({
      success: true,
      message: "সকল পরিবর্তন সফলভাবে লাইভ সার্ভারে সেভ ও পাবলিশ করা হয়েছে!",
      totalProducts: products.length,
      activeCount,
      inactiveCount: products.length - activeCount,
      lastSaved: new Date().toISOString()
    });
  }

  if (path === "/api/admin/catalog-status") {
    const products = getSafeStorage<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);
    const activeCount = products.filter((p: any) => p.isActive !== false).length;
    return createJsonResponse({
      success: true,
      totalProducts: products.length,
      activeCount,
      inactiveCount: products.length - activeCount,
      lastSaved: new Date().toISOString()
    });
  }

  if (path === "/api/admin/orders") {
    const isSaved = getSafeStorage<boolean>(ADMIN_DATA_SAVED_KEY, false);
    const orders = isSaved ? getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS) : [];
    return createJsonResponse({ orders, isSaved });
  }

  if (path.startsWith("/api/admin/orders/") && path.endsWith("/status") && method === "PUT") {
    const id = path.replace("/api/admin/orders/", "").replace("/status", "");
    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
    const order = orders.find(o => o.id === id);
    if (order) {
      order.status = body.status;
      setSafeStorage(ORDERS_KEY, orders);
      return createJsonResponse({ success: true, order });
    }
    return createJsonResponse({ error: "অর্ডার পাওয়া যায়নি" }, 404);
  }

  if (path.startsWith("/api/admin/orders/") && path.endsWith("/sync") && method === "POST") {
    const id = path.replace("/api/admin/orders/", "").replace("/sync", "");
    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
    const order = orders.find(o => o.id === id);
    if (order) {
      await syncOrderToGoogleSheets(order);
      order.syncedToGoogleSheet = true;
      setSafeStorage(ORDERS_KEY, orders);
      return createJsonResponse({ success: true, message: `অর্ডার ${order.id} সফলভাবে গুগল শিটে সিঙ্ক হয়েছে!` });
    }
    return createJsonResponse({ error: "অর্ডার পাওয়া যায়নি" }, 404);
  }

  // DELETE /api/admin/orders/:id (Delete order in admin panel only, Google Sheet remains untouched)
  if (path.startsWith("/api/admin/orders/") && method === "DELETE") {
    const id = path.replace("/api/admin/orders/", "");
    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
    const remaining = orders.filter(o => o.id !== id);
    if (remaining.length === orders.length) {
      return createJsonResponse({ error: "অর্ডার পাওয়া যায়নি" }, 404);
    }
    setSafeStorage(ORDERS_KEY, remaining);
    return createJsonResponse({
      success: true,
      message: `অর্ডার ${id} অ্যাডমিন প্যানেল থেকে সফলভাবে মুছে ফেলা হয়েছে (গুগল শিটের রেকর্ড অক্ষত রয়েছে)।`,
      remainingOrders: remaining.length
    });
  }

  // POST /api/admin/clean-order-sheet
  if (path === "/api/admin/clean-order-sheet" && method === "POST") {
    const targetUrl = (body && body.url) || resolveGoogleSheetWebhook();
    if (!targetUrl || !targetUrl.startsWith("http")) {
      return createJsonResponse({ error: "গুগল শিট ওয়েবহুক পাওয়া যায়নি।" }, 400);
    }
    try {
      const fetchUrl = targetUrl + (targetUrl.includes("?") ? "&" : "?") + "action=clean_order_sheet";
      await fetch(fetchUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "clean_order_sheet" })
      });
      return createJsonResponse({
        success: true,
        message: "অর্ডার শিট ও ট্র্যাকিং ডুপ্লিকেট রিমুভ রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!"
      });
    } catch (err: any) {
      return createJsonResponse({ error: err?.message || "ক্লিন রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে।" }, 500);
    }
  }

  // Admin Customers List (/api/admin/customers)
  if (path === "/api/admin/customers" && method === "GET") {
    const isSaved = getSafeStorage<boolean>(ADMIN_DATA_SAVED_KEY, false);
    if (!isSaved) {
      return createJsonResponse({ customers: [], total: 0, isSaved: false });
    }
    const customers = getSafeStorage<StoredCustomer[]>(CUSTOMERS_KEY, DEFAULT_CUSTOMERS);
    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
    const list = customers.map(c => {
      const custOrders = orders.filter(o => o.customerEmail.toLowerCase() === c.email.toLowerCase());
      const totalSpent = custOrders.reduce((sum, o) => o.status !== "Cancelled" ? sum + o.totalPrice : sum, 0);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || "N/A",
        address: c.address || "N/A",
        createdAt: c.createdAt,
        orderCount: custOrders.length,
        totalSpent
      };
    });
    return createJsonResponse({ customers: list, total: list.length, isSaved: true });
  }

  // DELETE /api/admin/customers/:id (Delete customer in admin panel only, Google Sheet remains untouched)
  if (path.startsWith("/api/admin/customers/") && method === "DELETE") {
    const id = path.replace("/api/admin/customers/", "");
    const customers = getSafeStorage<StoredCustomer[]>(CUSTOMERS_KEY, DEFAULT_CUSTOMERS);
    const remaining = customers.filter(c => c.id !== id);
    if (remaining.length === customers.length) {
      return createJsonResponse({ error: "কাস্টমার পাওয়া যায়নি" }, 404);
    }
    setSafeStorage(CUSTOMERS_KEY, remaining);
    return createJsonResponse({
      success: true,
      message: "কাস্টমার ডেটা সফলভাবে অ্যাডমিন প্যানেল থেকে মুছে ফেলা হয়েছে (গুগল শিটের রেকর্ড অক্ষত রয়েছে)।",
      remainingCustomers: remaining.length
    });
  }

  // 11. Admin Stats & Settings
  if (path === "/api/admin/stats") {
    const isSaved = getSafeStorage<boolean>(ADMIN_DATA_SAVED_KEY, false);
    const products = getSafeStorage<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);
    if (!isSaved) {
      return createJsonResponse({
        stats: {
          totalRevenue: 0,
          calculatedRevenue: 0,
          isCustomRevenue: false,
          customTotalRevenue: undefined,
          totalOrders: 0,
          totalProducts: products.length,
          lowStockProducts: products.filter(p => p.stock <= 10).length,
          syncedGoogleSheetsCount: 0,
          isSaved: false
        }
      });
    }

    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
    const customRev = getSafeStorage<{ customTotalRevenue?: number | null }>(REVENUE_KEY, {});
    const calculatedRevenue = orders.reduce((sum, o) => o.status !== "Cancelled" ? sum + o.totalPrice : sum, 0);
    const hasCustom = typeof customRev.customTotalRevenue === "number";
    const totalRevenue = hasCustom ? (customRev.customTotalRevenue as number) : calculatedRevenue;

    return createJsonResponse({
      stats: {
        totalRevenue,
        calculatedRevenue,
        isCustomRevenue: hasCustom,
        customTotalRevenue: customRev.customTotalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        lowStockProducts: products.filter(p => p.stock <= 10).length,
        syncedGoogleSheetsCount: orders.filter(o => o.syncedToGoogleSheet).length,
        isSaved: true
      }
    });
  }

  // Admin Custom Total Revenue (PUT or POST /api/admin/revenue)
  if (path === "/api/admin/revenue" && (method === "PUT" || method === "POST")) {
    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
    const calculatedRevenue = orders.reduce((sum, o) => o.status !== "Cancelled" ? sum + o.totalPrice : sum, 0);
    const { customTotalRevenue, reset } = body;

    if (reset) {
      setSafeStorage(REVENUE_KEY, {});
      return createJsonResponse({
        success: true,
        totalRevenue: calculatedRevenue,
        calculatedRevenue,
        isCustomRevenue: false,
        customTotalRevenue: undefined,
        message: "মোট রেভিনিউ স্বয়ংক্রিয় গণনায় রিসেট করা হয়েছে।"
      });
    }

    if (customTotalRevenue !== undefined && !isNaN(Number(customTotalRevenue))) {
      const val = Math.max(0, Number(customTotalRevenue));
      setSafeStorage(REVENUE_KEY, { customTotalRevenue: val });
      return createJsonResponse({
        success: true,
        totalRevenue: val,
        calculatedRevenue,
        isCustomRevenue: true,
        customTotalRevenue: val,
        message: "মোট রেভিনিউ সফলভাবে পরিবর্তন করা হয়েছে!"
      });
    }

    return createJsonResponse({ error: "সঠিক রেভিনিউ পরিমাণ প্রদান করুন" }, 400);
  }

  if (path === "/api/admin/settings") {
    if (method === "POST") {
      setSafeStorage(SETTINGS_KEY, { webhookUrl: body.webhookUrl?.trim() || "" });
      return createJsonResponse({ success: true, message: "Settings saved", webhookUrl: body.webhookUrl });
    }
    const settings = getSafeStorage<{ webhookUrl?: string }>(SETTINGS_KEY, {});
    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
    return createJsonResponse({
      webhookUrl: settings.webhookUrl || "",
      adminEmail: "mtarifprodhan@gmail.com",
      totalSyncedOrders: orders.filter(o => o.syncedToGoogleSheet).length,
      totalPendingSync: orders.filter(o => !o.syncedToGoogleSheet).length
    });
  }

  if (path === "/api/admin/test-webhook" && method === "POST") {
    const targetUrl = body.url;
    if (!targetUrl) return createJsonResponse({ error: "গুগল শিট ওয়েবহুক ইউআরএল প্রয়োজন।" }, 400);
    const testOrder: Order = {
      id: "TEST-" + Math.floor(1000 + Math.random() * 9000),
      customerName: "নিরাপদ ক্রয় টেস্ট অর্ডার",
      customerEmail: "test@nirapodkroy.shop",
      customerPhone: "+8801700000000",
      shippingAddress: "গুগল শিট ওয়েবহুক টেস্ট, ঢাকা",
      items: [{
        productId: "test",
        title: "টেস্ট প্রোডাক্ট ভেরিফিকেশন",
        price: 100,
        quantity: 1,
        imageUrl: ""
      }],
      totalPrice: 100,
      paymentMethod: "bKash / Mobile Wallet",
      status: "Delivered",
      createdAt: new Date().toISOString(),
      syncedToGoogleSheet: true
    };
    await syncOrderToGoogleSheets(testOrder, targetUrl);
    return createJsonResponse({ success: true, message: "টেস্ট ওয়েবহুক রিকোয়েস্ট পাঠানো হয়েছে!" });
  }

  // 12. Newsletter Subscription (POST /api/newsletter or /api/subscribe)
  if ((path === "/api/newsletter" || path === "/api/subscribe") && method === "POST") {
    const { email, source } = body;
    if (!email || !email.includes("@")) {
      return createJsonResponse({ error: "একটি সঠিক ইমেইল অ্যাড্রেস প্রদান করুন।" }, 400);
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const subscribers = getSafeStorage<{ email: string; source: string; subscribedAt: string }[]>(SUBSCRIBERS_KEY, []);
    if (!subscribers.some(s => s.email === normalizedEmail)) {
      subscribers.unshift({
        email: normalizedEmail,
        source: source || "Website Footer",
        subscribedAt: new Date().toISOString()
      });
      setSafeStorage(SUBSCRIBERS_KEY, subscribers);
    }
    // Sync to Google Sheets
    syncNewsletterToGoogleSheets(normalizedEmail, source || "Website Footer").catch(() => {});
    return createJsonResponse({
      success: true,
      message: "সাবস্ক্রাইব করার জন্য ধন্যবাদ! আপনার ইমেইলটি সফলভাবে সংরক্ষিত হয়েছে।"
    });
  }

  // 13. Admin Subscribers List & Delete
  if (path === "/api/admin/subscribers" && method === "GET") {
    const isSaved = getSafeStorage<boolean>(ADMIN_DATA_SAVED_KEY, false);
    const subscribers = isSaved ? getSafeStorage<{ email: string; source: string; subscribedAt: string }[]>(SUBSCRIBERS_KEY, []) : [];
    return createJsonResponse({ subscribers, total: subscribers.length, isSaved });
  }

  if (path.startsWith("/api/admin/subscribers/") && method === "DELETE") {
    const targetEmail = decodeURIComponent(path.replace("/api/admin/subscribers/", "")).toLowerCase();
    const subscribers = getSafeStorage<{ email: string; source: string; subscribedAt: string }[]>(SUBSCRIBERS_KEY, []);
    const remaining = subscribers.filter(s => s.email.toLowerCase() !== targetEmail);
    setSafeStorage(SUBSCRIBERS_KEY, remaining);
    return createJsonResponse({ success: true, message: "সাবস্ক্রাইবার মুছে ফেলা হয়েছে", total: remaining.length });
  }

  // 14. Live Google Sheet Sync (Pull-Only Preview - Does NOT persist until user saves!)
  if (path === "/api/admin/sync-from-sheets" && method === "POST") {
    const liveData = await fetchLiveGoogleSheetData(body.webhookUrl);
    if (!liveData) {
      return createJsonResponse({ error: "গুগল শিট থেকে ডেটা পড়তে ব্যর্থ হয়েছে। অ্যাপস স্ক্রিপ্টে doGet ফাংশনটি আছে কিনা নিশ্চিত করুন।" }, 500);
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

    // 2. Customers
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
    const normalizedSubscribers: any[] = [];
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
    const products = getSafeStorage<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);
    const stats = {
      totalRevenue: calculatedRevenue,
      calculatedRevenue,
      isCustomRevenue: false,
      customTotalRevenue: undefined,
      totalOrders: normalizedOrders.length,
      totalProducts: products.length,
      lowStockProducts: products.filter(p => p.stock <= 10).length,
      syncedGoogleSheetsCount: normalizedOrders.length,
      isSaved: false
    };

    // Note: PULL-ONLY PREVIEW - We DO NOT mutate safeStorage!
    return createJsonResponse({
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
  }

  // POST /api/admin/save-synced-data
  if (path === "/api/admin/save-synced-data" && method === "POST") {
    const { orders, customers, subscribers, tracking } = body;
    if (Array.isArray(orders)) setSafeStorage(ORDERS_KEY, orders);
    if (Array.isArray(customers)) setSafeStorage(CUSTOMERS_KEY, customers);
    if (Array.isArray(subscribers)) setSafeStorage(SUBSCRIBERS_KEY, subscribers);
    if (Array.isArray(tracking)) setSafeStorage(USER_TRACKING_KEY, tracking);
    setSafeStorage(ADMIN_DATA_SAVED_KEY, true);
    return createJsonResponse({
      success: true,
      message: "গুগল শিটের সকল ডেটা (অর্ডার, কাস্টমার, সাবস্ক্রাইবার, ট্র্যাকিং) অ্যাডমিন প্যানেলে সফলভাবে সেভ করা হয়েছে!"
    });
  }

  // POST /api/admin/clear-saved-data
  if (path === "/api/admin/clear-saved-data" && method === "POST") {
    setSafeStorage(ORDERS_KEY, []);
    setSafeStorage(CUSTOMERS_KEY, []);
    setSafeStorage(SUBSCRIBERS_KEY, []);
    setSafeStorage(USER_TRACKING_KEY, []);
    setSafeStorage(ADMIN_DATA_SAVED_KEY, false);
    setSafeStorage(REVENUE_KEY, {});
    return createJsonResponse({
      success: true,
      message: "অ্যাডমিন প্যানেলের সংরক্ষিত ডেটা মুছে ফেলা হয়েছে (গুগল শিটের কোনো ডেটা ডিলিট হয়নি, তা অক্ষত রয়েছে)।"
    });
  }

  // --- USER TRACKING ROUTES ---
  if (path === "/api/track" && method === "POST") {
    const page = String(body.page || "হোমপেজ (Home)").trim();
    const sessionId = String(body.sessionId || `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}_root`).trim();
    const isHeartbeat = Boolean(body.isHeartbeat);
    const timeSpent = String(body.timeSpent || "সক্রিয় রয়েছে (Active)...").trim();
    const clientIp = String(body.clientIp || "Unknown").trim();
    const location = String(body.location || "Bangladesh").trim();
    const device = String(body.device || "Desktop / PC").trim();
    const os = String(body.os || "Windows 10/11").trim();
    const browser = String(body.browser || "Chrome").trim();
    const screen = String(body.screen || "1920x1080").trim();
    const referrer = String(body.referrer || "সরাসরি (Direct)").trim();
    const time = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

    const currentTracking = getSafeStorage<UserTrackingEntry[]>(USER_TRACKING_KEY, []);
    const existingIndex = currentTracking.findIndex(t => t.sessionId === sessionId);
    let currentEntry: UserTrackingEntry;

    if (existingIndex >= 0) {
      currentTracking[existingIndex].timeSpent = timeSpent;
      currentTracking[existingIndex].updatedAt = Date.now();
      currentEntry = currentTracking[existingIndex];
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
      currentTracking.unshift(currentEntry);
      if (currentTracking.length > 300) currentTracking.splice(300);
    }
    setSafeStorage(USER_TRACKING_KEY, currentTracking);

    // Sync to Google Sheet in background ONLY if not explicitly skipped by client-side direct sync
    if (!body.skipGoogleSheets) {
      syncTrackingToGoogleSheets(currentEntry, isHeartbeat).catch(() => {});
    }
    return createJsonResponse({ success: true, sessionId, timeSpent });
  }

  if (path === "/api/admin/tracking" && method === "GET") {
    const isSaved = getSafeStorage<boolean>(ADMIN_DATA_SAVED_KEY, false);
    if (!isSaved) {
      return createJsonResponse({
        success: true,
        totalVisits: 0,
        activeNow: 0,
        tracking: [],
        pageStats: {},
        deviceStats: {},
        browserStats: {},
        sheetTab: "user tracking",
        isSaved: false
      });
    }

    const currentTracking = getSafeStorage<UserTrackingEntry[]>(USER_TRACKING_KEY, []);
    const now = Date.now();
    const activeNow = currentTracking.filter(t => t.updatedAt && (now - t.updatedAt < 120000)).length;

    const pageCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};
    const browserCounts: Record<string, number> = {};

    currentTracking.forEach(t => {
      pageCounts[t.page] = (pageCounts[t.page] || 0) + 1;
      deviceCounts[t.device] = (deviceCounts[t.device] || 0) + 1;
      browserCounts[t.browser] = (browserCounts[t.browser] || 0) + 1;
    });

    return createJsonResponse({
      success: true,
      totalVisits: currentTracking.length,
      activeNow: currentTracking.length > 0 ? Math.max(activeNow, 1) : 0,
      tracking: currentTracking,
      pageStats: pageCounts,
      deviceStats: deviceCounts,
      browserStats: browserCounts,
      sheetTab: "user tracking",
      isSaved: true
    });
  }

  if (path === "/api/admin/tracking/test" && method === "POST") {
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

    const currentTracking = getSafeStorage<UserTrackingEntry[]>(USER_TRACKING_KEY, []);
    currentTracking.unshift(testEntry);
    setSafeStorage(USER_TRACKING_KEY, currentTracking);

    const synced = await syncTrackingToGoogleSheets(testEntry, false);
    return createJsonResponse({
      success: true,
      synced,
      message: synced
        ? "গুগল শিটের 'user tracking' ট্যাবে সফলভাবে টেস্ট ডেটা পাঠানো হয়েছে!"
        : "সার্ভারে লগ হয়েছে, কিন্তু গুগল শিটে পৌঁছায়নি। দয়া করে অ্যাপস স্ক্রিপ্ট ও ওয়েবহুক ইউআরএল পরীক্ষা করুন।",
      entry: testEntry
    });
  }

  if (path === "/api/admin/github/verify" && method === "POST") {
    try {
      const { token, repo } = body;
      if (!token || !repo) return createJsonResponse({ error: "টোকেন ও রিপোজিটরি নাম প্রয়োজন" }, 400);
      const cleanRepo = String(repo).trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
      const cleanToken = String(token).trim();
      const authHeader = cleanToken.startsWith("ghp_") ? `token ${cleanToken}` : `Bearer ${cleanToken}`;

      const ghRes = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
        headers: { Authorization: authHeader, Accept: "application/vnd.github.v3+json" }
      });

      if (!ghRes.ok) {
        if (ghRes.status === 401) return createJsonResponse({ error: "GitHub Token সঠিক নয় বা মেয়াদ শেষ হয়েছে。" }, 401);
        if (ghRes.status === 404) return createJsonResponse({ error: `Repository '${cleanRepo}' খুঁজে পাওয়া যায়নি。` }, 404);
        if (ghRes.status === 403) return createJsonResponse({ error: "টোকেনে 'repo' পারমিশন নেই।" }, 403);
        const errData = await ghRes.json().catch(() => ({}));
        return createJsonResponse({ error: errData.message || "কানেকশন ব্যর্থ" }, ghRes.status);
      }

      const repoData = await ghRes.json();
      return createJsonResponse({
        success: true,
        repo: repoData.full_name,
        defaultBranch: repoData.default_branch || "main",
        private: repoData.private
      });
    } catch (e: any) {
      return createJsonResponse({ error: e.message || "ভেরিফিকেশন ব্যর্থ" }, 500);
    }
  }

  if (path === "/api/admin/github/push" && method === "POST") {
    try {
      const { token, repo, branch, products } = body;
      if (!token || !repo) return createJsonResponse({ error: "টোকেন ও রিপোজিটরি নাম প্রয়োজন" }, 400);
      const cleanRepo = String(repo).trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
      const cleanBranch = (branch && String(branch).trim()) || "main";
      const cleanToken = String(token).trim();
      const targetProducts = Array.isArray(products) && products.length > 0 ? products : getSafeStorage<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);

      // Save to local cache as well
      setSafeStorage(PRODUCTS_KEY, targetProducts);

      const authHeader = cleanToken.startsWith("ghp_") ? `token ${cleanToken}` : `Bearer ${cleanToken}`;
      const filePath = "public/products.json";

      // 1. Get SHA
      const getUrl = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}?ref=${cleanBranch}`;
      const getRes = await fetch(getUrl, {
        headers: { Authorization: authHeader, Accept: "application/vnd.github.v3+json" }
      });

      let sha = "";
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      } else if (getRes.status === 401 || getRes.status === 403) {
        return createJsonResponse({ error: "GitHub Token সঠিক নয় বা পারমিশন নেই ('repo' scope প্রয়োজন)।" }, getRes.status);
      }

      // 2. Safe Base64 encode
      const jsonStr = JSON.stringify(targetProducts, null, 2);
      const bytes = new TextEncoder().encode(jsonStr);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64Content = btoa(binary);

      // 3. PUT commit
      const putUrl = `https://api.github.com/repos/${cleanRepo}/contents/${filePath}`;
      const putRes = await fetch(putUrl, {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json"
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
        const putData = await putRes.json();
        const commitUrl = putData.commit?.html_url || `https://github.com/${cleanRepo}/commits/${cleanBranch}`;
        return createJsonResponse({
          success: true,
          commitUrl,
          message: "সফলভাবে GitHub-এ কমিট হয়েছে! GitHub Actions ১ মিনিটের মধ্যে লাইভ সাইট আপডেট করে ফেলবে।"
        });
      } else {
        const errData = await putRes.json().catch(() => ({}));
        let friendlyError = errData.message || "Failed to commit";
        if (putRes.status === 409) friendlyError = "GitHub Conflict: ফাইলের ভার্সন মেলেনি। অনুগ্রহ করে আবার পুশ করুন।";
        if (putRes.status === 404) friendlyError = `Repository '${cleanRepo}' বা ব্রাঞ্চ '${cleanBranch}' পাওয়া যায়নি।`;
        return createJsonResponse({ error: friendlyError, raw: errData }, putRes.status);
      }
    } catch (e: any) {
      return createJsonResponse({ error: e.message || "পুশ ব্যর্থ হয়েছে" }, 500);
    }
  }

  return createJsonResponse({ error: "Endpoint not found" }, 404);
}

// Global interceptor setup
export function initApiInterceptor() {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : (input instanceof URL ? input.href : input.url);

    // Only intercept /api/ calls
    if (url.includes("/api/")) {
      // Check if we are running in static hosting (e.g. GitHub Pages or custom domain nirapodkroy.shop without port 3000 backend)
      const isStaticHosting =
        !window.location.port &&
        !window.location.hostname.includes("run.app") &&
        !window.location.hostname.includes("localhost");

      if (isStaticHosting) {
        try {
          return await handleLocalApi(url, init);
        } catch (err) {
          console.error("[Static API Mock Error]:", err);
          return await handleLocalApi(url, init);
        }
      }

      // If running on local or Cloud Run, try server first, but fall back gracefully on 404 / network failure
      try {
        const res = await originalFetch(input, init);
        // If server responded with 404 HTML (e.g., static server returning 404.html for /api routes)
        if (!res.ok && res.status === 404) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("text/html")) {
            return await handleLocalApi(url, init);
          }
        }
        return res;
      } catch (err) {
        console.warn(`[API Network Fallback] Server unreachable for ${url}. Using local data store.`, err);
        return await handleLocalApi(url, init);
      }
    }

    return originalFetch(input, init);
  };
}
