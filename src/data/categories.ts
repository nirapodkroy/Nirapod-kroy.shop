// Centralized Category Configuration & Routing Helpers
// Ensures that all current and FUTURE categories are automatically supported across:
// 1. URL Routing (/category-slug)
// 2. Navigation Header & CategoryFilter
// 3. Admin Product Management (+ Create Custom Category)
// 4. Static Page Generation (scripts/postbuild.js)
// 5. Sitemap Generation (scripts/generate-sitemap.js)

export const BASE_CATEGORIES: string[] = [
  "All",
  "Honey",
  "Oil & Ghee",
  "Dates",
  "Spices",
  "Nuts & Seeds",
  "Beverage",
  "Rice",
  "Flours & Lentils",
  "Groceries",
  "Baby & Kids",
  "Sports",
  "Electronics",
  "Fashion",
  "Health & Beauty",
  "Home & Kitchen",
  "Books",
  "Accessories"
];

// Standard slug map for base categories
export const CATEGORY_SLUG_MAP: Record<string, string> = {
  "All": "",
  "Honey": "honey",
  "Oil & Ghee": "oil-and-ghee",
  "Dates": "dates",
  "Spices": "spices",
  "Nuts & Seeds": "nuts-and-seeds",
  "Beverage": "beverage",
  "Rice": "rice",
  "Flours & Lentils": "flours-and-lentils",
  "Groceries": "groceries",
  "Baby & Kids": "baby-and-kids",
  "Sports": "sports",
  "Electronics": "electronics",
  "Fashion": "fashion",
  "Health & Beauty": "health-and-beauty",
  "Home & Kitchen": "home-and-kitchen",
  "Books": "books",
  "Accessories": "accessories"
};

// Common aliases for flexible URL matching (including Bengali transliterations and Unicode)
export const SLUG_ALIASES: Record<string, string> = {
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

  // Groceries
  "groceries": "Groceries",
  "grocery": "Groceries",
  "mudi": "Groceries",
  "muri": "Groceries",
  "mudi-khaddo": "Groceries",
  "মুদি": "Groceries",
  "মুদি-ও-খাদ্য": "Groceries",

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
