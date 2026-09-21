import type { SyntheticEvent } from "react";

/**
 * Helper utilities for reliable product image loading across diverse hosting environments
 * (e.g. Vite local dev server, GitHub Pages root hosting at nirapodkroy.shop, /docs static host).
 */

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/nirapodkroy/Nirapod-kroy.shop/main/docs";

export const FALLBACK_PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" fill="#f4f4f5">
      <rect width="400" height="400" fill="#f4f4f5"/>
      <g transform="translate(160, 160)" stroke="#a1a1aa" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <rect x="0" y="0" width="80" height="80" rx="8" />
        <circle cx="28" cy="28" r="8" />
        <path d="M7 65l22-22 18 18 16-16 10 10" />
      </g>
      <text x="200" y="270" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#71717a">Nirapod Kroy</text>
    </svg>`
  );

/**
 * Returns an ordered array of candidate URLs to try for a given product image path.
 */
export function getProductImageCandidateUrls(url: string | undefined | null): string[] {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return [FALLBACK_PLACEHOLDER_IMAGE];
  }

  const cleanUrl = url.trim();

  // If it's already an inline data URI or full absolute external URL, return as-is
  if (cleanUrl.startsWith("data:") || cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return [cleanUrl];
  }

  // Normalize path without leading slash
  const pathWithoutLeadingSlash = cleanUrl.startsWith("/") ? cleanUrl.slice(1) : cleanUrl;
  const fileName = pathWithoutLeadingSlash.split("/").pop() || "";

  const candidates: string[] = [];

  // 1. Original relative URL as configured (e.g. /images/products/foo.jpg)
  candidates.push(cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`);

  // 2. /docs/ path (Working directly on GitHub Pages nirapodkroy.shop)
  candidates.push(`/docs/images/products/${fileName}`);

  // 3. /public/ path (Also working on GitHub Pages nirapodkroy.shop)
  candidates.push(`/public/images/products/${fileName}`);

  // 4. GitHub Raw CDN URL (Always reliable for committed assets)
  candidates.push(`${GITHUB_RAW_BASE}/images/products/${fileName}`);

  // 5. Final fallback placeholder
  candidates.push(FALLBACK_PLACEHOLDER_IMAGE);

  // Return unique candidate list
  return Array.from(new Set(candidates));
}

/**
 * Synthetic image error handler for <img /> elements.
 * Automatically tries fallback candidate URLs in sequence until a working one is found.
 */
export function handleProductImageError(
  event: SyntheticEvent<HTMLImageElement, Event>,
  originalUrl?: string
) {
  const target = event.currentTarget;
  if (!target) return;

  const initialUrl = originalUrl || target.getAttribute("data-original-url") || target.src;
  const candidates = getProductImageCandidateUrls(initialUrl);

  const currentIndexAttr = target.getAttribute("data-fallback-index");
  const currentIndex = currentIndexAttr ? parseInt(currentIndexAttr, 10) : 0;

  const nextIndex = currentIndex + 1;

  if (nextIndex < candidates.length) {
    target.setAttribute("data-fallback-index", String(nextIndex));
    target.src = candidates[nextIndex];
  } else {
    // All candidates exhausted - show clean SVG placeholder
    target.onerror = null;
    target.src = FALLBACK_PLACEHOLDER_IMAGE;
  }
}
