import fs from 'fs';
import path from 'path';

const root = process.cwd();
const publicProductsPath = path.join(root, 'public', 'products.json');
const rootProductsPath = path.join(root, 'products.json');
const docsProductsPath = path.join(root, 'docs', 'products.json');
const defaultProductsTsPath = path.join(root, 'src', 'data', 'defaultProducts.ts');
const storeDataPath = path.join(root, '.app_store_data.json');

try {
  let products = null;

  // 1. Check sources in order of authority
  const candidateFiles = [publicProductsPath, rootProductsPath, docsProductsPath];
  for (const filePath of candidateFiles) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          products = parsed;
          console.log(`[Prebuild] Loaded ${products.length} products from ${path.relative(root, filePath)}`);
          break;
        }
      } catch (err) {
        console.warn(`[Prebuild] Error reading ${filePath}:`, err);
      }
    }
  }

  // Fallback to store data if not found
  if (!products && fs.existsSync(storeDataPath)) {
    try {
      const storeContent = JSON.parse(fs.readFileSync(storeDataPath, 'utf-8'));
      if (Array.isArray(storeContent.products) && storeContent.products.length > 0) {
        products = storeContent.products;
        console.log(`[Prebuild] Loaded ${products.length} products from .app_store_data.json`);
      }
    } catch {}
  }

  if (products && Array.isArray(products) && products.length > 0) {
    const jsonStr = JSON.stringify(products, null, 2);

    // 2. Sync to src/data/defaultProducts.ts so Vite bundles the exact current products into the JS bundle
    const tsContent = `import { Product } from "../types";\n\nexport const DEFAULT_PRODUCTS: Product[] = ${jsonStr};\n`;
    fs.writeFileSync(defaultProductsTsPath, tsContent, 'utf-8');
    console.log(`[Prebuild] Wrote ${products.length} products to src/data/defaultProducts.ts`);

    // 3. Ensure all JSON files are in sync
    candidateFiles.forEach(f => {
      const dir = path.dirname(f);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(f, jsonStr, 'utf-8');
    });

    // 4. Update .app_store_data.json
    if (fs.existsSync(storeDataPath)) {
      try {
        const store = JSON.parse(fs.readFileSync(storeDataPath, 'utf-8'));
        store.products = products;
        fs.writeFileSync(storeDataPath, JSON.stringify(store, null, 2), 'utf-8');
      } catch {}
    }
  } else {
    console.warn('[Prebuild] No products.json found, keeping existing defaultProducts.ts');
  }
} catch (e) {
  console.error('[Prebuild Error]', e);
}
