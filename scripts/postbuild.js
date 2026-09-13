import fs from 'fs';
import path from 'path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const docs = path.join(root, 'docs');
const assets = path.join(root, 'assets');

try {
  // 1. Ensure 404.html in dist and root for GitHub Pages client-side routing
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));
    fs.copyFileSync(path.join(dist, 'index.html'), path.join(root, '404.html'));
  }

  // 2. Sync dist to docs (for users with Pages set to /docs folder)
  if (fs.existsSync(dist)) {
    fs.cpSync(dist, docs, { recursive: true, force: true });
  }

  // 3. Copy dist/assets to root assets directory (for users with Pages set to / root)
  const distAssets = path.join(dist, 'assets');
  if (fs.existsSync(distAssets)) {
    fs.cpSync(distAssets, assets, { recursive: true, force: true });
  }

  // 4. Ensure CNAME and favicon are everywhere
  let cnameContent = 'nirapodkroy.shop\n';
  if (fs.existsSync(path.join(root, 'CNAME'))) {
    const existing = fs.readFileSync(path.join(root, 'CNAME'), 'utf-8').trim();
    if (existing) {
      cnameContent = existing + '\n';
    }
  }
  fs.writeFileSync(path.join(root, 'CNAME'), cnameContent);
  if (fs.existsSync(path.join(root, 'public'))) {
    fs.writeFileSync(path.join(root, 'public', 'CNAME'), cnameContent);
  }
  if (fs.existsSync(dist)) {
    fs.writeFileSync(path.join(dist, 'CNAME'), cnameContent);
  }
  if (fs.existsSync(docs)) {
    fs.writeFileSync(path.join(docs, 'CNAME'), cnameContent);
  }

  // 5. Sync favicon.svg
  const faviconPath = path.join(root, 'public', 'favicon.svg');
  if (fs.existsSync(faviconPath)) {
    fs.copyFileSync(faviconPath, path.join(root, 'favicon.svg'));
    if (fs.existsSync(dist)) {
      fs.copyFileSync(faviconPath, path.join(dist, 'favicon.svg'));
    }
    if (fs.existsSync(docs)) {
      fs.copyFileSync(faviconPath, path.join(docs, 'favicon.svg'));
    }
  }

  // 6. Ensure products.json is synced across public, dist, docs, and assets
  // public/products.json is the PRIMARY source of truth for GitHub Pages & deploys
  let productsJsonStr = null;
  const publicProductsFile = path.join(root, 'public', 'products.json');
  const storeDataFile = path.join(root, '.app_store_data.json');

  if (fs.existsSync(publicProductsFile)) {
    try {
      const raw = fs.readFileSync(publicProductsFile, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        productsJsonStr = raw;
      }
    } catch {}
  }

  if (!productsJsonStr && fs.existsSync(storeDataFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(storeDataFile, 'utf-8'));
      if (data.products && Array.isArray(data.products)) {
        productsJsonStr = JSON.stringify(data.products, null, 2);
      }
    } catch {}
  }

  if (productsJsonStr) {
    if (fs.existsSync(path.join(root, 'public'))) {
      fs.writeFileSync(path.join(root, 'public', 'products.json'), productsJsonStr);
    }
    if (fs.existsSync(dist)) {
      fs.writeFileSync(path.join(dist, 'products.json'), productsJsonStr);
    }
    if (fs.existsSync(docs)) {
      fs.writeFileSync(path.join(docs, 'products.json'), productsJsonStr);
    }
    if (fs.existsSync(assets)) {
      fs.writeFileSync(path.join(assets, 'products.json'), productsJsonStr);
    }
    // Also keep .app_store_data.json in sync with public/products.json
    if (fs.existsSync(storeDataFile)) {
      try {
        const currentStore = JSON.parse(fs.readFileSync(storeDataFile, 'utf-8'));
        currentStore.products = JSON.parse(productsJsonStr);
        fs.writeFileSync(storeDataFile, JSON.stringify(currentStore, null, 2));
      } catch {}
    }
  }

  // 7. Sync sitemap.xml and robots.txt
  ['sitemap.xml', 'robots.txt'].forEach(file => {
    const srcFile = path.join(root, 'public', file);
    if (fs.existsSync(srcFile)) {
      if (fs.existsSync(dist)) fs.copyFileSync(srcFile, path.join(dist, file));
      if (fs.existsSync(docs)) fs.copyFileSync(srcFile, path.join(docs, file));
      if (fs.existsSync(assets)) fs.copyFileSync(srcFile, path.join(assets, file));
      fs.copyFileSync(srcFile, path.join(root, file));
    }
  });

  console.log('[Postbuild] Successfully synced dist, docs, assets, 404.html, CNAME, favicon, products.json, and sitemap.xml!');
} catch (err) {
  console.error('[Postbuild Error]', err);
}
