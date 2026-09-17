import { Product } from "../types";

export interface ProductImageWithCode {
  url: string;
  code: string;
  index: number;
}

/**
 * Generate a clean standard code for an image index, e.g. P-01, P-02 or PRD-01
 */
export function generateDefaultImageCode(productCode: string | undefined, index: number): string {
  const prefix = (productCode && productCode.trim())
    ? productCode.trim().toUpperCase()
    : "P";
  return `${prefix}-${String(index + 1).padStart(2, "0")}`;
}

/**
 * Returns all gallery images of a product along with their assigned or auto-generated picture codes.
 */
export function getProductImagesWithCodes(product: Partial<Product> | null | undefined): ProductImageWithCode[] {
  if (!product) return [];

  const rawImages: string[] = (product.images && product.images.length > 0)
    ? product.images.filter(Boolean)
    : (product.imageUrl ? [product.imageUrl] : []);

  if (rawImages.length === 0) return [];

  const codes = product.imageCodes || [];

  return rawImages.map((url, idx) => {
    const customCode = codes[idx];
    const code = (customCode && String(customCode).trim())
      ? String(customCode).trim()
      : generateDefaultImageCode(product.productCode, idx);

    return {
      url,
      code,
      index: idx
    };
  });
}
