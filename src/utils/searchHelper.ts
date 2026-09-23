import { Product } from "../types";

/**
 * Normalizes text by lowercasing and replacing punctuation/hyphens with spaces.
 */
export function normalizeSearchText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[—–\-_\/.,;:'\"!?()[\]{}|#@*+~`^&<>\\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strips all non-alphanumeric and non-Bengali characters for continuous matching.
 * e.g. "থ্রি-পিস" becomes "থ্রিপিস", "three-piece" becomes "threepiece"
 */
export function stripToCompact(text: string): string {
  if (!text) return "";
  return text.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/gi, "");
}

// Synonyms, abbreviations, and bilingual phonetic alias groups
const BILINGUAL_ALIASES: string[][] = [
  ["three", "3", "৩", "থ্রি", "থ্রী"],
  ["piece", "পিস", "পিচ", "pic", "pc", "pcs"],
  ["threepiece", "threepiec", "3piece", "3pc", "3pcs", "থ্রিপিস", "থ্রিপিচ", "থ্রীপিস", "৩পিস", "৩পিচ", "থ্রিপিসড্রেস"],
  ["dress", "ড্রেস", "জামা", "পোশাক", "বডি"],
  ["orna", "অর্না", "ওড়না", "ওড়না", "dupatta", "chiffon", "শিফন"],
  ["salwar", "সেলোয়ার", "সালোয়ার", "pant", "প্যান্ট", "পাজামা"],
  ["kameez", "কামিজ", "kurti", "কুর্তি"],
  ["georgette", "জর্জেট", "জরজেট"],
  ["stone", "স্টোন", "পাথর"],
  ["thai", "থাই"],
  ["micro", "মাইক্রো"],
  ["fashion", "ফ্যাশন"],
  ["sharee", "শাড়ি", "শাড়ি", "sari", "saree"],
  ["panjabi", "পাঞ্জাবি", "পাঞ্জাবী", "punjabi"],
  ["honey", "মধু", "modhu"],
  ["ghee", "ঘি"],
  ["oil", "তেল", "সরিষা", "mustard"],
  ["dates", "খেজুর", "khejur"],
  ["nuts", "বাদাম", "badam"],
  ["spices", "মশলা", "মসলা", "masala"],
  ["rice", "চাল"],
  ["flour", "আটা", "ময়দা", "সুজি", "ডাল"],
  ["groceries", "grocery", "মুদি", "মুদি ও খাদ্য", "food"],
  ["offer", "অফার", "ছাড়", "discount", "deal"]
];

/**
 * Given a single search token, returns all expanded synonyms/phonetic equivalents.
 */
function getExpandedTokens(token: string): string[] {
  const norm = token.toLowerCase();
  const set = new Set<string>([norm]);
  const compact = stripToCompact(norm);
  if (compact) set.add(compact);

  for (const group of BILINGUAL_ALIASES) {
    if (group.some((w) => norm === w || compact === w || norm.includes(w) || w.includes(norm))) {
      group.forEach((w) => set.add(w));
    }
  }

  return Array.from(set).filter(Boolean);
}

/**
 * Returns true if a product matches a user search query.
 * Robust against:
 * - Direct ID / productCode match (e.g. "prod-mucfvuwe", "mucfvuwe")
 * - Hyphens / spaces / punctuation differences (e.g. "থ্রিপিস" matches "থ্রি-পিস", "three-piece" matches "Three Piece")
 * - Multi-word non-consecutive search (e.g. "new three piece", "thai georgette")
 * - English/Bengali phonetic equivalents (e.g. "3 piece", "৩ পিস", "ড্রেস", "কামিজ")
 */
export function smartSearchMatch(query: string, product: Product): boolean {
  if (!query || !query.trim()) return true;
  const rawQ = query.trim().toLowerCase();

  // 1. Exact or partial ID / productCode match
  if (product.id && product.id.toLowerCase().includes(rawQ)) return true;
  if (product.productCode && product.productCode.toLowerCase().includes(rawQ)) return true;

  // 2. Build full searchable corpus from all product attributes
  const title = product.title || "";
  const desc = product.description || "";
  const cat = product.category || "";
  const parentCat = product.parentCategory || "";
  const badge = product.badge || "";
  const pid = product.id || "";
  const pcode = product.productCode || "";

  const corpus = `${title} ${desc} ${cat} ${parentCat} ${badge} ${pid} ${pcode}`.toLowerCase();
  const normCorpus = normalizeSearchText(corpus);
  const compactCorpus = stripToCompact(corpus);

  // 3. Compact match for continuous strings without spaces/hyphens
  // e.g. "থ্রিপিস" against "থ্রি-পিস" or "threepiece" against "Three Piece"
  const compactQ = stripToCompact(rawQ);
  if (compactQ.length >= 2 && compactCorpus.includes(compactQ)) {
    return true;
  }

  // 4. Token-based multi-word matching: EVERY word in query must match
  const tokens = rawQ.split(/[\s\-_,./+]+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return true;

  const allTokensMatch = tokens.every((token) => {
    const expansions = getExpandedTokens(token);
    return expansions.some(
      (exp) =>
        corpus.includes(exp) ||
        normCorpus.includes(exp) ||
        compactCorpus.includes(exp)
    );
  });

  return allTokensMatch;
}

/**
 * Filters a list of products with smartSearchMatch.
 */
export function filterProductsBySearch(products: Product[], query: string): Product[] {
  if (!query || !query.trim()) return products;
  return products.filter((p) => smartSearchMatch(query, p));
}
