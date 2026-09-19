// Category slug routing utilities for clean URL pages
import {
  BASE_CATEGORIES,
  CATEGORY_SLUG_MAP,
  SLUG_ALIASES,
  categoryToSlug,
  getDynamicCategories
} from "../data/categories";

export {
  BASE_CATEGORIES,
  CATEGORY_SLUG_MAP,
  SLUG_ALIASES,
  categoryToSlug,
  getDynamicCategories
};

/**
 * Clean path/slug string from URL
 */
export function normalizeSlug(raw: string): string {
  let cleaned = "";
  try {
    cleaned = decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    cleaned = raw.trim().toLowerCase();
  }
  
  // Remove leading/trailing slashes
  cleaned = cleaned.replace(/^\/+|\/+$/g, "");

  // Strip .html or .htm extensions (e.g. /baby-and-kids.html)
  cleaned = cleaned.replace(/\.html?$/i, "");

  // Remove common prefixes
  if (cleaned.startsWith("category/")) {
    cleaned = cleaned.replace(/^category\//, "");
  } else if (cleaned.startsWith("c/")) {
    cleaned = cleaned.replace(/^c\//, "");
  }

  return cleaned.replace(/^-+|-+$/g, "");
}

/**
 * Helper: format slug to title case for any future custom category
 */
function slugToTitleCase(slug: string): string {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Read any cached categories from localStorage (if in browser)
 */
function getCachedProductCategories(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("nirapod_products_cache");
    if (!raw) return [];
    const prods = JSON.parse(raw);
    if (Array.isArray(prods)) {
      const cats = new Set<string>();
      prods.forEach(p => {
        if (p.category && typeof p.category === "string" && p.category.trim()) {
          cats.add(p.category.trim());
        }
      });
      return Array.from(cats);
    }
  } catch {}
  return [];
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
  const hash = window.location.hash;
  if (hash && hash.startsWith("#/")) {
    const hashSlug = hash.slice(2);
    const matched = matchCategory(hashSlug, availableCategories);
    if (matched) return matched;
  }

  // 3. Check pathname (/baby-and-kids or /category/baby-and-kids)
  const path = window.location.pathname;
  if (path && path !== "/" && path !== "/index.html") {
    // Ignore static assets (js, css, images, etc.), but allow category paths
    const isStaticAsset = /\.(js|css|svg|png|jpg|jpeg|webp|gif|ico|json|txt|xml|map|woff2?)$/i.test(path);
    if (!isStaticAsset && !path.startsWith("/api/")) {
      const matched = matchCategory(path, availableCategories);
      if (matched) return matched;
    }
  }

  return null;
}

export const RETURN_POLICY_SLUGS = [
  "return-refund",
  "refund-policy",
  "return-policy",
  "returns",
  "refund"
];

export const PRIVACY_POLICY_SLUGS = [
  "privacy-policy",
  "privacy",
  "goponiyota-niti",
  "terms-privacy"
];

export const DELIVERY_POLICY_SLUGS = [
  "delivery-policy",
  "delivery",
  "shipping-policy",
  "shipping",
  "delivery-charge"
];

export const ALL_POLICY_SLUGS = [
  ...RETURN_POLICY_SLUGS,
  ...PRIVACY_POLICY_SLUGS,
  ...DELIVERY_POLICY_SLUGS,
  "policy"
];

/**
 * Check if the current browser URL points to the Return & Refund Policy
 */
export function isReturnPolicyUrl(): boolean {
  if (typeof window === "undefined") return false;
  const path = normalizeSlug(window.location.pathname);
  if (RETURN_POLICY_SLUGS.includes(path)) return true;

  const searchParams = new URLSearchParams(window.location.search);
  const policyQuery = searchParams.get("policy") || searchParams.get("modal") || searchParams.get("page");
  if (policyQuery && RETURN_POLICY_SLUGS.includes(normalizeSlug(policyQuery))) return true;

  const hash = window.location.hash.toLowerCase();
  if (hash === "#return-refund" || hash === "#/return-refund" || hash === "#refund-policy" || hash === "#return") return true;

  return false;
}

/**
 * Check if the current browser URL points to the Privacy Policy
 */
export function isPrivacyPolicyUrl(): boolean {
  if (typeof window === "undefined") return false;
  const path = normalizeSlug(window.location.pathname);
  if (PRIVACY_POLICY_SLUGS.includes(path)) return true;

  const searchParams = new URLSearchParams(window.location.search);
  const policyQuery = searchParams.get("policy") || searchParams.get("modal") || searchParams.get("page");
  if (policyQuery && PRIVACY_POLICY_SLUGS.includes(normalizeSlug(policyQuery))) return true;

  const hash = window.location.hash.toLowerCase();
  if (hash === "#privacy-policy" || hash === "#/privacy-policy" || hash === "#privacy") return true;

  return false;
}

/**
 * Check if the current browser URL points to the Delivery Policy
 */
export function isDeliveryPolicyUrl(): boolean {
  if (typeof window === "undefined") return false;
  const path = normalizeSlug(window.location.pathname);
  if (DELIVERY_POLICY_SLUGS.includes(path)) return true;

  const searchParams = new URLSearchParams(window.location.search);
  const policyQuery = searchParams.get("policy") || searchParams.get("modal") || searchParams.get("page");
  if (policyQuery && DELIVERY_POLICY_SLUGS.includes(normalizeSlug(policyQuery))) return true;

  const hash = window.location.hash.toLowerCase();
  if (hash === "#delivery-policy" || hash === "#/delivery-policy" || hash === "#delivery" || hash === "#shipping") return true;

  return false;
}

/**
 * Match a raw slug or string to known categories.
 * Works seamlessly with any current category OR future dynamically added category.
 */
export function matchCategory(rawSlug: string, availableCategories: string[] = []): string | null {
  const clean = normalizeSlug(rawSlug);
  if (!clean || clean === "all") return "All";

  // If this is a policy route, do NOT treat it as a product category
  if (ALL_POLICY_SLUGS.includes(clean)) {
    return null;
  }

  // Check alias table first
  if (SLUG_ALIASES[clean]) {
    return SLUG_ALIASES[clean];
  }

  // Combine known base categories, cached product categories, and dynamic categories
  const cachedCategories = getCachedProductCategories();
  const allKnownCategories = Array.from(new Set([
    ...BASE_CATEGORIES,
    ...cachedCategories,
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
    if (catStripped && catStripped === cleanStripped) {
      return cat;
    }
  }

  // 4. Future / Dynamic category fallback:
  // If slug is a valid string (e.g. "smart-watch" or "organic-tea"),
  // match by title-cased representation
  if (clean && !clean.includes("/")) {
    const titleCased = slugToTitleCase(clean);
    // Check if any category matches case-insensitively
    for (const cat of allKnownCategories) {
      if (cat.toLowerCase() === titleCased.toLowerCase()) {
        return cat;
      }
    }
    return titleCased;
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
