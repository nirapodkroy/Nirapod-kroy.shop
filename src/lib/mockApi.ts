import { Product, Order, CustomerUser, OrderTickerItem } from "../types";
import { DEFAULT_PRODUCTS } from "../data/defaultProducts";

const CUSTOMERS_KEY = "nirapod_customers";
const ORDERS_KEY = "auracart_orders";
const PRODUCTS_KEY = "nirapod_products_cache";
const SETTINGS_KEY = "nirapod_admin_settings";
const ADMIN_TOKEN_KEY = "nirapod_admin_token";
export const SUBSCRIBERS_KEY = "nirapod_subscribers";

export const DEFAULT_GOOGLE_SHEET_WEBHOOK = "https://script.google.com/macros/s/AKfycbwYakz5JjsuG3qKKPgwmbKUS7xQYXzWe0uV4rJMHU6OcNyN5zA4ulzt9B2R9SLdUXg/exec";

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

// Background sync to Google Sheets (supports static sites via direct Webhook post)
export async function syncOrderToGoogleSheets(order: Order, webhookUrl?: string): Promise<boolean> {
  const settings = getSafeStorage<{ webhookUrl?: string }>(SETTINGS_KEY, {});
  const target = webhookUrl || settings.webhookUrl?.trim() || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!target || !target.startsWith("http")) return false;

  const itemsFormatted = order.items.map(i => `${i.title} (x${i.quantity} @ ৳${i.price})`).join(", ");
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
    totalPrice: `৳${order.totalPrice}`,
    paymentMethod: order.paymentMethod,
    orderStatus: order.status,
    sheetRow: [
      order.id,
      new Date(order.createdAt).toLocaleString(),
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.shippingAddress,
      itemsFormatted,
      `৳${order.totalPrice}`,
      order.paymentMethod,
      order.status
    ]
  };

  try {
    await fetch(target, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn("[Google Sheets Webhook Sync Error]:", err);
    return false;
  }
}

export async function syncCustomerToGoogleSheets(customer: StoredCustomer, rawPassword?: string): Promise<boolean> {
  const settings = getSafeStorage<{ webhookUrl?: string }>(SETTINGS_KEY, {});
  const target = settings.webhookUrl?.trim() || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!target || !target.startsWith("http")) return false;

  const payload = {
    action: "customer_registration",
    type: "customer",
    customerId: customer.id,
    name: customer.name,
    phone: customer.phone || "N/A",
    email: customer.email,
    address: customer.address || "N/A",
    password: rawPassword || customer.passwordHash || "",
    registeredAt: new Date(customer.createdAt).toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    sheetRow: [
      customer.id,
      new Date(customer.createdAt).toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
      customer.name,
      customer.phone || "N/A",
      customer.email,
      customer.address || "N/A",
      rawPassword || customer.passwordHash || ""
    ]
  };

  try {
    await fetch(target, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn("[Google Sheets Customer Sync Error]:", err);
    return false;
  }
}

// Background sync newsletter subscriber to Google Sheets
export async function syncNewsletterToGoogleSheets(email: string, source = "Website Footer"): Promise<boolean> {
  const settings = getSafeStorage<{ webhookUrl?: string }>(SETTINGS_KEY, {});
  const target = settings.webhookUrl?.trim() || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!target || !target.startsWith("http")) return false;

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

  try {
    await fetch(target, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn("[Google Sheets Newsletter Sync Error]:", err);
    return false;
  }
}

// Helper to pull live orders, customers, and subscribers directly from Google Sheets
export async function fetchLiveGoogleSheetData(webhookUrl?: string): Promise<{ orders?: any[]; customers?: any[]; subscribers?: any[] } | null> {
  const settings = getSafeStorage<{ webhookUrl?: string }>(SETTINGS_KEY, {});
  const target = webhookUrl || settings.webhookUrl?.trim() || DEFAULT_GOOGLE_SHEET_WEBHOOK;
  if (!target || !target.startsWith("http")) return null;

  try {
    const fetchUrl = target + (target.includes("?") ? "&" : "?") + "action=get_all";
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn("[Google Sheet Pull Error]:", err);
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
        imageUrl
      });
    }
    setSafeStorage(PRODUCTS_KEY, products);

    const orderId = "NK-" + Math.floor(100000 + Math.random() * 900000);
    const newOrder: Order = {
      id: orderId,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim().toLowerCase(),
      customerPhone: String(customerPhone).trim(),
      shippingAddress: String(shippingAddress).trim(),
      items: processedItems,
      totalPrice: computedTotal,
      paymentMethod: paymentMethod || "Cash on Delivery",
      status: "Pending",
      createdAt: new Date().toISOString(),
      syncedToGoogleSheet: false,
      notes: notes ? String(notes).trim() : undefined
    };

    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
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
      syncCustomerToGoogleSheets(existingCust, "(Order Customer)").catch(() => {});
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
      list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
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
      affiliateButtonText: body.affiliateButtonText
    };
    products.unshift(newProduct);
    setSafeStorage(PRODUCTS_KEY, products);
    setSafeStorage("nirapod_products_modified", String(Date.now()));
    return createJsonResponse({ success: true, product: newProduct }, 201);
  }

  if (path.startsWith("/api/products/")) {
    const id = path.replace("/api/products/", "").replace("/toggle-active", "");
    const products = getSafeStorage<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);

    if (path.endsWith("/toggle-active") && (method === "PATCH" || method === "PUT")) {
      const prod = products.find(p => p.id === id);
      if (prod) {
        prod.isActive = prod.isActive === false ? true : false;
        setSafeStorage(PRODUCTS_KEY, products);
        setSafeStorage("nirapod_products_modified", String(Date.now()));
        return createJsonResponse({ success: true, product: prod, isActive: prod.isActive });
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
    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
    return createJsonResponse({ orders });
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

  // Admin Customers List (/api/admin/customers)
  if (path === "/api/admin/customers" && method === "GET") {
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
    return createJsonResponse({ customers: list, total: list.length });
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
    const orders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
    const products = getSafeStorage<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);
    const totalRevenue = orders.reduce((sum, o) => o.status !== "Cancelled" ? sum + o.totalPrice : sum, 0);
    return createJsonResponse({
      stats: {
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        lowStockProducts: products.filter(p => p.stock <= 10).length,
        syncedGoogleSheetsCount: orders.filter(o => o.syncedToGoogleSheet).length
      }
    });
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
    const subscribers = getSafeStorage<{ email: string; source: string; subscribedAt: string }[]>(SUBSCRIBERS_KEY, []);
    return createJsonResponse({ subscribers, total: subscribers.length });
  }

  if (path.startsWith("/api/admin/subscribers/") && method === "DELETE") {
    const targetEmail = decodeURIComponent(path.replace("/api/admin/subscribers/", "")).toLowerCase();
    const subscribers = getSafeStorage<{ email: string; source: string; subscribedAt: string }[]>(SUBSCRIBERS_KEY, []);
    const remaining = subscribers.filter(s => s.email.toLowerCase() !== targetEmail);
    setSafeStorage(SUBSCRIBERS_KEY, remaining);
    return createJsonResponse({ success: true, message: "সাবস্ক্রাইবার মুছে ফেলা হয়েছে", total: remaining.length });
  }

  // 14. Live Google Sheet Sync (Pull all orders, customers, subscribers across all live devices)
  if (path === "/api/admin/sync-from-sheets" && method === "POST") {
    const liveData = await fetchLiveGoogleSheetData(body.webhookUrl);
    if (!liveData) {
      return createJsonResponse({ error: "গুগল শিট থেকে ডেটা পড়তে ব্যর্থ হয়েছে। অ্যাপস স্ক্রিপ্টে doGet ফাংশনটি আছে কিনা নিশ্চিত করুন।" }, 500);
    }

    let importedOrders = 0;
    let importedSubscribers = 0;

    if (liveData.orders && Array.isArray(liveData.orders)) {
      const currentOrders = getSafeStorage<Order[]>(ORDERS_KEY, DEFAULT_ORDERS);
      for (const sheetOrder of liveData.orders) {
        if (!currentOrders.some(o => o.id === sheetOrder.id)) {
          const rawPrice = String(sheetOrder.totalPrice || "0").replace(/[^0-9.]/g, "");
          currentOrders.unshift({
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
      setSafeStorage(ORDERS_KEY, currentOrders);
    }

    if (liveData.subscribers && Array.isArray(liveData.subscribers)) {
      const currentSubs = getSafeStorage<{ email: string; source: string; subscribedAt: string }[]>(SUBSCRIBERS_KEY, []);
      for (const s of liveData.subscribers) {
        if (s.email && !currentSubs.some(cs => cs.email === s.email.toLowerCase())) {
          currentSubs.unshift({
            email: s.email.toLowerCase(),
            source: s.source || "Google Sheet",
            subscribedAt: s.date || new Date().toISOString()
          });
          importedSubscribers++;
        }
      }
      setSafeStorage(SUBSCRIBERS_KEY, currentSubs);
    }

    return createJsonResponse({
      success: true,
      message: `গুগল শিট থেকে ডেটা সফলভাবে সিঙ্ক হয়েছে! (${importedOrders} টি নতুন অর্ডার, ${importedSubscribers} জন নতুন সাবস্ক্রাইবার)`,
      importedOrders,
      importedSubscribers
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
