// Centralized Category Configuration & Routing Helpers
// Ensures that all current and FUTURE categories are automatically supported across:
// 1. URL Routing (/category-slug)
// 2. Navigation Header & CategoryFilter
// 3. Admin Product Management (+ Create Custom Category)
// 4. Static Page Generation (scripts/postbuild.js)
// 5. Sitemap Generation (scripts/generate-sitemap.js)

export const GROCERIES_PARENT = "Groceries & Food";

// 8 Subcategories under Groceries & Food
export const GROCERY_SUBCATEGORIES: string[] = [
  "Honey",
  "Oil & Ghee",
  "Dates",
  "Spices",
  "Nuts & Seeds",
  "Beverage",
  "Rice",
  "Flours & Lentils"
];

// Main top-level navigation categories
export const MAIN_CATEGORIES: string[] = [
  "All",
  "Offer Zone",
  "Groceries & Food",
  "Baby & Kids",
  "Sports",
  "Electronics",
  "Fashion",
  "Health & Beauty",
  "Home & Kitchen",
  "Books",
  "Accessories"
];

export const BASE_CATEGORIES: string[] = [
  "All",
  "Offer Zone",
  "Groceries & Food",
  "Groceries",
  "Honey",
  "Oil & Ghee",
  "Dates",
  "Spices",
  "Nuts & Seeds",
  "Beverage",
  "Rice",
  "Flours & Lentils",
  "Baby & Kids",
  "Sports",
  "Electronics",
  "Fashion",
  "Shirt",
  "Sharee",
  "Panjabi",
  "Women Hijab",
  "Health & Beauty",
  "Home & Kitchen",
  "Books",
  "Accessories"
];

// Standard slug map for base categories
export const CATEGORY_SLUG_MAP: Record<string, string> = {
  "All": "",
  "Offer Zone": "offer-zone",
  "Groceries & Food": "groceries-and-food",
  "Groceries": "groceries",
  "Honey": "honey",
  "Oil & Ghee": "oil-and-ghee",
  "Dates": "dates",
  "Spices": "spices",
  "Nuts & Seeds": "nuts-and-seeds",
  "Beverage": "beverage",
  "Rice": "rice",
  "Flours & Lentils": "flours-and-lentils",
  "Baby & Kids": "baby-and-kids",
  "Sports": "sports",
  "Electronics": "electronics",
  "Fashion": "fashion",
  "Shirt": "shirt",
  "Sharee": "sharee",
  "Panjabi": "panjabi",
  "Women Hijab": "women-hijab",
  "Health & Beauty": "health-and-beauty",
  "Home & Kitchen": "home-and-kitchen",
  "Books": "books",
  "Accessories": "accessories"
};

/**
 * Checks whether a category is one of the 8 subcategories of Groceries & Food
 */
export function isGrocerySubcategory(category: string): boolean {
  if (!category) return false;
  const lower = category.toLowerCase().trim();
  return GROCERY_SUBCATEGORIES.some((sub) => sub.toLowerCase() === lower);
}

/**
 * Checks whether a category is either Groceries & Food itself OR any of its 8 subcategories
 */
export function isGroceryRelatedCategory(category: string): boolean {
  if (!category) return false;
  const lower = category.toLowerCase().trim();
  if (lower === "groceries & food" || lower === "groceries" || lower === "grocery" || lower === "food" || lower === "মুদি ও খাদ্য" || lower === "মুদি") {
    return true;
  }
  return isGrocerySubcategory(category);
}

/**
 * Returns the parent category if the category is a subcategory, otherwise null
 */
export function getParentCategory(
  category: string,
  productList?: Array<{ category?: string; parentCategory?: string }>
): string | null {
  if (!category) return null;
  if (isGrocerySubcategory(category)) {
    return GROCERIES_PARENT;
  }
  if (Array.isArray(productList)) {
    const found = productList.find(
      (p) => p.category && p.category.toLowerCase().trim() === category.toLowerCase().trim() && p.parentCategory
    );
    if (found?.parentCategory) {
      return found.parentCategory;
    }
  }
  return null;
}

/**
 * Get subcategories for a given parent category
 */
export function getSubcategories(
  parentCategory: string,
  productList?: Array<{ category?: string; parentCategory?: string }>
): string[] {
  const lower = (parentCategory || "").toLowerCase().trim();
  const subSet = new Set<string>();

  if (
    lower === "groceries & food" ||
    lower === "groceries" ||
    lower === "grocery" ||
    lower === "মুদি ও খাদ্য" ||
    lower === "মুদি"
  ) {
    GROCERY_SUBCATEGORIES.forEach((s) => subSet.add(s));
  }

  if (Array.isArray(productList)) {
    productList.forEach((p) => {
      if (
        p.parentCategory &&
        p.parentCategory.toLowerCase().trim() === lower &&
        p.category &&
        p.category.trim()
      ) {
        subSet.add(p.category.trim());
      }
    });
  }

  return Array.from(subSet);
}

/**
 * Get all available main categories (excluding All and Offer Zone)
 */
export function getAllMainCategories(
  productList?: Array<{ category?: string; parentCategory?: string }>
): string[] {
  const set = new Set<string>(
    MAIN_CATEGORIES.filter((c) => c !== "All" && c !== "Offer Zone")
  );

  if (Array.isArray(productList)) {
    productList.forEach((p) => {
      if (p.parentCategory && p.parentCategory.trim()) {
        set.add(p.parentCategory.trim());
      } else if (p.category && p.category.trim()) {
        const cat = p.category.trim();
        if (cat !== "All" && cat !== "Offer Zone" && !isGrocerySubcategory(cat)) {
          set.add(cat);
        }
      }
    });
  }

  return Array.from(set);
}

/**
 * Format category label with English & Bengali translation for UI display
 */
export function formatCategoryDisplayLabel(cat: string, lang: string = "bn"): string {
  if (!cat) return "";
  const c = cat.toLowerCase().trim();
  if (c === "all") return lang === "bn" ? "সব পণ্য (All)" : "All Products";
  if (c === "offer zone" || c === "offers" || c === "offer-zone" || c === "offer")
    return lang === "bn" ? "🔥 অফার জোন (Offer Zone)" : "🔥 Offer Zone";
  if (c === "groceries & food" || c === "groceries" || c === "grocery")
    return lang === "bn" ? "মুদি ও খাদ্য (Groceries & Food)" : "Groceries & Food";
  if (c === "electronics") return lang === "bn" ? "ইলেকট্রনিক্স (Electronics)" : "Electronics";
  if (c === "fashion") return lang === "bn" ? "পোশাক ও ফ্যাশন (Fashion)" : "Fashion";
  if (c === "shirt" || c === "shart" || c === "shirts" || c === "শার্ট")
    return lang === "bn" ? "শার্ট (Shirt)" : "Shirt";
  if (c === "sharee" || c === "saree" || c === "shari" || c === "sari" || c === "শাড়ি" || c === "শাড়ী")
    return lang === "bn" ? "শাড়ি (Sharee)" : "Sharee";
  if (c === "panjabi" || c === "punjabi" || c === "পাঞ্জাবি" || c === "পাঞ্জাবী")
    return lang === "bn" ? "পাঞ্জাবি (Panjabi)" : "Panjabi";
  if (c === "women hijab" || c === "women-hijab" || c === "hijab" || c === "হিজাব")
    return lang === "bn" ? "হিজাব ও বোরকা (Hijab)" : "Women Hijab";
  if (c === "health & beauty" || c === "beauty")
    return lang === "bn" ? "রূপচর্চা ও স্বাস্থ্য (Beauty)" : "Health & Beauty";
  if (c === "home & kitchen" || c === "home")
    return lang === "bn" ? "গৃহস্থালি ও কিচেন (Home)" : "Home & Kitchen";
  if (c === "baby & kids" || c === "kids" || c === "baby")
    return lang === "bn" ? "শিশু ও খেলনা (Kids)" : "Baby & Kids";
  if (c === "sports") return lang === "bn" ? "খেলাধুলা ও ফিটনেস (Sports)" : "Sports";
  if (c === "books") return lang === "bn" ? "বই ও স্টেশনারি (Books)" : "Books";
  if (c === "accessories") return lang === "bn" ? "এক্সেসরিজ (Accessories)" : "Accessories";
  if (c === "honey") return lang === "bn" ? "মধু ও সুইটনার (Honey)" : "Honey";
  if (c === "oil & ghee" || c === "oil" || c === "ghee")
    return lang === "bn" ? "তেল ও ঘি (Oil & Ghee)" : "Oil & Ghee";
  if (c === "dates") return lang === "bn" ? "প্রিমিয়াম খেজুর (Dates)" : "Dates";
  if (c === "spices") return lang === "bn" ? "খাঁটি মশলা (Spices)" : "Spices";
  if (c === "nuts & seeds" || c === "nuts")
    return lang === "bn" ? "বাদাম ও বীজ (Nuts & Seeds)" : "Nuts & Seeds";
  if (c === "beverage" || c === "tea")
    return lang === "bn" ? "চা ও পানীয় (Beverage)" : "Beverage";
  if (c === "rice") return lang === "bn" ? "প্রিমিয়াম চাল (Rice)" : "Rice";
  if (c === "flours & lentils" || c === "lentils")
    return lang === "bn" ? "আটা ও ডাল (Flours & Lentils)" : "Flours & Lentils";
  return cat;
}

// Common aliases for flexible URL matching (including Bengali transliterations and Unicode)
export const SLUG_ALIASES: Record<string, string> = {
  // Offer Zone / Deals
  "offer-zone": "Offer Zone",
  "offer": "Offer Zone",
  "offers": "Offer Zone",
  "deals": "Offer Zone",
  "deal": "Offer Zone",
  "offerzone": "Offer Zone",
  "অফার": "Offer Zone",
  "অফার-জোন": "Offer Zone",
  "অফারজোন": "Offer Zone",

  // Baby & Kids
  "baby-and-kids": "Baby & Kids",
  "baby-kids": "Baby & Kids",
  "babykids": "Baby & Kids",
  "baby": "Baby & Kids",
  "kids": "Baby & Kids",
  "kid": "Baby & Kids",
  "toy": "Baby & Kids",
  "toys": "Baby & Kids",
  "khelna": "Baby & Kids",
  "shishu": "Baby & Kids",
  "shishu-khelna": "Baby & Kids",
  "shishu-o-khelna": "Baby & Kids",
  "shishukhelna": "Baby & Kids",
  "শিশু": "Baby & Kids",
  "শিশু-ও-খেলনা": "Baby & Kids",
  "খেলনা": "Baby & Kids",

  // Honey
  "honey": "Honey",
  "modhu": "Honey",
  "madhu": "Honey",
  "sweetener": "Honey",
  "sweeteners": "Honey",
  "মধু": "Honey",
  "মধু-ও-সুইটনার": "Honey",

  // Oil & Ghee
  "oil-and-ghee": "Oil & Ghee",
  "oil-ghee": "Oil & Ghee",
  "oilghee": "Oil & Ghee",
  "oil": "Oil & Ghee",
  "ghee": "Oil & Ghee",
  "tel": "Oil & Ghee",
  "tel-ghee": "Oil & Ghee",
  "teyl": "Oil & Ghee",
  "ঘি": "Oil & Ghee",
  "তেল": "Oil & Ghee",
  "তেল-ও-ঘি": "Oil & Ghee",

  // Dates
  "dates": "Dates",
  "date": "Dates",
  "khejur": "Dates",
  "khajoor": "Dates",
  "premium-khejur": "Dates",
  "খেজুর": "Dates",
  "প্রিমিয়াম-খেজুর": "Dates",

  // Spices
  "spices": "Spices",
  "spice": "Spices",
  "masala": "Spices",
  "mosla": "Spices",
  "moshla": "Spices",
  "khati-moshla": "Spices",
  "মসলা": "Spices",
  "মশলা": "Spices",
  "খাঁটি-মশলা": "Spices",

  // Nuts & Seeds
  "nuts-and-seeds": "Nuts & Seeds",
  "nuts-seeds": "Nuts & Seeds",
  "nutsseeds": "Nuts & Seeds",
  "nuts": "Nuts & Seeds",
  "seeds": "Nuts & Seeds",
  "badam": "Nuts & Seeds",
  "badam-beej": "Nuts & Seeds",
  "বাদাম": "Nuts & Seeds",
  "বাদাম-ও-বীজ": "Nuts & Seeds",

  // Beverage
  "beverage": "Beverage",
  "beverages": "Beverage",
  "tea": "Beverage",
  "cha": "Beverage",
  "coffee": "Beverage",
  "drink": "Beverage",
  "drinks": "Beverage",
  "চা": "Beverage",
  "চা-ও-পানীয়": "Beverage",
  "পানীয়": "Beverage",

  // Rice
  "rice": "Rice",
  "chal": "Rice",
  "chaal": "Rice",
  "premium-rice": "Rice",
  "premium-chal": "Rice",
  "চাল": "Rice",
  "প্রিমিয়াম-চাল": "Rice",

  // Flours & Lentils
  "flours-and-lentils": "Flours & Lentils",
  "flours-lentils": "Flours & Lentils",
  "flourslentils": "Flours & Lentils",
  "flour": "Flours & Lentils",
  "lentil": "Flours & Lentils",
  "lentils": "Flours & Lentils",
  "atta": "Flours & Lentils",
  "dal": "Flours & Lentils",
  "daal": "Flours & Lentils",
  "আটা": "Flours & Lentils",
  "ডাল": "Flours & Lentils",
  "আটা-ও-ডাল": "Flours & Lentils",

  // Groceries & Food
  "groceries-and-food": "Groceries & Food",
  "groceries-food": "Groceries & Food",
  "groceries": "Groceries & Food",
  "grocery": "Groceries & Food",
  "food": "Groceries & Food",
  "mudi": "Groceries & Food",
  "muri": "Groceries & Food",
  "mudi-khaddo": "Groceries & Food",
  "মুদি": "Groceries & Food",
  "মুদি-ও-খাদ্য": "Groceries & Food",

  // Sports
  "sports": "Sports",
  "sport": "Sports",
  "fitness": "Sports",
  "gym": "Sports",
  "kheladhula": "Sports",
  "খেলাধুলা": "Sports",

  // Electronics
  "electronics": "Electronics",
  "electronic": "Electronics",
  "gadgets": "Electronics",
  "gadget": "Electronics",
  "ইলেকট্রনিক্স": "Electronics",

  // Fashion
  "fashion": "Fashion",
  "clothing": "Fashion",
  "clothes": "Fashion",
  "apparel": "Fashion",
  "poshak": "Fashion",
  "পোশাক": "Fashion",
  "পোশাক-ও-ফ্যাশন": "Fashion",

  // Shirt
  "shirt": "Shirt",
  "shart": "Shirt",
  "shirts": "Shirt",
  "শার্ট": "Shirt",
  "formal-shirt": "Shirt",
  "casual-shirt": "Shirt",
  "cotton-shirt": "Shirt",

  // Sharee
  "sharee": "Sharee",
  "shari": "Sharee",
  "saree": "Sharee",
  "sari": "Sharee",
  "chanderi": "Sharee",
  "chanderi-silk": "Sharee",
  "silk-sharee": "Sharee",
  "digital-print-sharee": "Sharee",
  "শাড়ি": "Sharee",
  "শাড়ী": "Sharee",
  "সিল্ক-শাড়ি": "Sharee",

  // Panjabi
  "panjabi": "Panjabi",
  "punjabi": "Panjabi",
  "পাঞ্জাবি": "Panjabi",
  "পাঞ্জাবী": "Panjabi",

  // Women Hijab
  "women-hijab": "Women Hijab",
  "womenhijab": "Women Hijab",
  "hijab": "Women Hijab",
  "হিজাব": "Women Hijab",

  // Health & Beauty
  "health-and-beauty": "Health & Beauty",
  "health-beauty": "Health & Beauty",
  "healthbeauty": "Health & Beauty",
  "beauty": "Health & Beauty",
  "health": "Health & Beauty",
  "rupchorcha": "Health & Beauty",
  "রূপচর্চা": "Health & Beauty",
  "রূপচর্চা-ও-স্বাস্থ্য": "Health & Beauty",

  // Home & Kitchen
  "home-and-kitchen": "Home & Kitchen",
  "home-kitchen": "Home & Kitchen",
  "homekitchen": "Home & Kitchen",
  "kitchen": "Home & Kitchen",
  "home": "Home & Kitchen",
  "grihosthali": "Home & Kitchen",
  "গৃহস্থালি": "Home & Kitchen",
  "গৃহস্থালি-ও-কিচেন": "Home & Kitchen",

  // Books
  "books": "Books",
  "book": "Books",
  "boi": "Books",
  "বই": "Books",
  "বই-ও-স্টেশনারি": "Books",

  // Accessories
  "accessories": "Accessories",
  "accessory": "Accessories",
  "অন্যান্য": "Accessories"
};

/**
 * Converts ANY category display name (English, Bengali, or mixed) to a clean URL slug.
 * Example:
 *  "Baby & Kids" -> "baby-and-kids"
 *  "Winter Collection" -> "winter-collection"
 *  "প্রিমিয়াম খেজুর" -> "premium-khejur" (via map/aliases) or "প্রিমিয়াম-খেজুর"
 */
export function categoryToSlug(category: string): string {
  if (!category || category === "All") return "";
  
  const trimmed = category.trim();
  if (CATEGORY_SLUG_MAP[trimmed]) {
    return CATEGORY_SLUG_MAP[trimmed];
  }

  // Check aliases in reverse
  for (const [slug, name] of Object.entries(SLUG_ALIASES)) {
    if (name.toLowerCase() === trimmed.toLowerCase() && !/[^\x00-\x7F]/.test(slug)) {
      return slug;
    }
  }

  return trimmed
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\u0980-\u09FF-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Given a list of products, dynamically extract all unique categories
 * (merging with BASE_CATEGORIES so standard ones are preserved).
 */
export function getDynamicCategories(products: Array<{ category?: string }> = []): string[] {
  const set = new Set<string>(BASE_CATEGORIES);
  if (Array.isArray(products)) {
    products.forEach((p) => {
      if (p.category && typeof p.category === "string" && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
  }
  return Array.from(set);
}
