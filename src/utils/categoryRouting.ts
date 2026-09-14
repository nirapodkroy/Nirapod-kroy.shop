// Category slug routing utilities for clean URL pages

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
  "Books": "books"
};

// Common aliases for flexible URL matching
const SLUG_ALIASES: Record<string, string> = {
  "oil-ghee": "Oil & Ghee",
  "oilghee": "Oil & Ghee",
  "nuts-seeds": "Nuts & Seeds",
  "nutsseeds": "Nuts & Seeds",
  "baby-kids": "Baby & Kids",
  "babykids": "Baby & Kids",
  "health-beauty": "Health & Beauty",
  "healthbeauty": "Health & Beauty",
  "home-kitchen": "Home & Kitchen",
  "homekitchen": "Home & Kitchen",
  "flours-lentils": "Flours & Lentils",
  "flourslentils": "Flours & Lentils",
  "ghee": "Oil & Ghee",
  "oil": "Oil & Ghee"
};

/**
 * Convert a category display name to a clean URL slug
 */
export function categoryToSlug(category: string): string {
  if (!category || category === "All") return "";
  if (CATEGORY_SLUG_MAP[category]) {
    return CATEGORY_SLUG_MAP[category];
  }
  return category
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Clean path/slug string from URL
 */
function normalizeSlug(raw: string): string {
  let cleaned = decodeURIComponent(raw).trim().toLowerCase();
  
  // Remove leading/trailing slashes
  cleaned = cleaned.replace(/^\/+|\/+$/g, "");

  // Remove common prefixes
  if (cleaned.startsWith("category/")) {
    cleaned = cleaned.replace(/^category\//, "");
  } else if (cleaned.startsWith("c/")) {
    cleaned = cleaned.replace(/^c\//, "");
  }

  return cleaned.replace(/^-+|-+$/g, "");
}

/**
 * Detect category from URL (supports /slug, /category/slug, ?category=slug, ?c=slug, #/slug)
 */
export function getCategoryFromUrl(availableCategories: string[] = []): string | null {
  if (typeof window === "undefined") return null;

  // 1. Check query parameters first (?category=honey or ?c=honey or ?p=/honey from 404 redirect)
  const searchParams = new URLSearchParams(window.location.search);
  const queryCat = searchParams.get("category") || searchParams.get("c") || searchParams.get("cat");
  if (queryCat) {
    const matched = matchCategory(queryCat, availableCategories);
    if (matched) return matched;
  }

  // Check 404.html redirect parameter (?p=/honey)
  const redirectParam = searchParams.get("p");
  if (redirectParam) {
    const matched = matchCategory(redirectParam, availableCategories);
    if (matched) return matched;
  }

  // 2. Check hash (#/category/honey or #/honey)
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash && !hash.startsWith("!") && !hash.startsWith("/")) {
    const matched = matchCategory(hash, availableCategories);
    if (matched) return matched;
  }

  // 3. Check pathname (e.g. /honey, /classroom, /category/oil-and-ghee)
  const path = window.location.pathname;
  if (path && path !== "/" && path !== "/index.html") {
    // Ignore static asset extensions
    if (!path.includes(".") && !path.startsWith("/api/")) {
      const matched = matchCategory(path, availableCategories);
      if (matched) return matched;
    }
  }

  return null;
}

/**
 * Match a raw slug or string to known categories
 */
export function matchCategory(rawSlug: string, availableCategories: string[] = []): string | null {
  const clean = normalizeSlug(rawSlug);
  if (!clean || clean === "all") return "All";

  // Check alias table first
  if (SLUG_ALIASES[clean]) {
    return SLUG_ALIASES[clean];
  }

  // Combine known base categories and any dynamic categories
  const allKnownCategories = Array.from(new Set([
    ...Object.keys(CATEGORY_SLUG_MAP),
    ...availableCategories
  ]));

  // 1. Exact match on slug
  for (const cat of allKnownCategories) {
    if (categoryToSlug(cat) === clean) {
      return cat;
    }
  }

  // 2. Exact match on category name (case-insensitive)
  for (const cat of allKnownCategories) {
    if (cat.toLowerCase() === clean) {
      return cat;
    }
  }

  // 3. Match ignoring hyphens and spaces
  const cleanStripped = clean.replace(/[^a-z0-9]/g, "");
  for (const cat of allKnownCategories) {
    const catStripped = categoryToSlug(cat).replace(/[^a-z0-9]/g, "");
    if (catStripped === cleanStripped) {
      return cat;
    }
  }

  return null;
}

/**
 * Build the URL for a given category
 */
export function getCategoryUrl(category: string): string {
  if (!category || category === "All") {
    return "/";
  }
  const slug = categoryToSlug(category);
  return `/${slug}`;
}

/**
 * Update the browser URL without page reload
 */
export function updateCategoryUrl(category: string, replace = false): void {
  if (typeof window === "undefined") return;

  const targetUrl = getCategoryUrl(category);
  const currentPath = window.location.pathname + window.location.search;

  if (currentPath !== targetUrl) {
    if (replace) {
      window.history.replaceState({ category }, "", targetUrl);
    } else {
      window.history.pushState({ category }, "", targetUrl);
    }
  }
}
