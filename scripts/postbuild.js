import fs from 'fs';
import path from 'path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const docs = path.join(root, 'docs');
const assets = path.join(root, 'assets');

try {
  // 1. Ensure <base href="/" /> is present in dist/index.html and assets are absolute
  let indexHtmlContent = '';
  const distIndexFile = path.join(dist, 'index.html');
  const buildVersion = Date.now().toString(36);

  if (fs.existsSync(distIndexFile)) {
    indexHtmlContent = fs.readFileSync(distIndexFile, 'utf-8');
    if (!indexHtmlContent.includes('<base href="/"')) {
      indexHtmlContent = indexHtmlContent.replace('<head>', '<head>\n    <base href="/" />');
    }
    // Ensure absolute paths for assets so subpaths like /offer-zone never fail
    indexHtmlContent = indexHtmlContent
      .replace(/src="\.\/assets\//g, 'src="/assets/')
      .replace(/href="\.\/assets\//g, 'href="/assets/');

    // Cache-bust assets in HTML script and link tags with build version query param
    indexHtmlContent = indexHtmlContent
      .replace(/src="\/assets\/index\.js(\?[^"']*)?"/g, `src="/assets/index.js?v=${buildVersion}"`)
      .replace(/href="\/assets\/index\.css(\?[^"']*)?"/g, `href="/assets/index.css?v=${buildVersion}"`);

    fs.writeFileSync(distIndexFile, indexHtmlContent);

    // 2. Sync index.html to docs
    if (!fs.existsSync(docs)) fs.mkdirSync(docs, { recursive: true });
    fs.writeFileSync(path.join(docs, 'index.html'), indexHtmlContent);

    // 3. Sync 404.html in dist, docs, and root for GitHub Pages client-side routing
    fs.writeFileSync(path.join(dist, '404.html'), indexHtmlContent);
    fs.writeFileSync(path.join(docs, '404.html'), indexHtmlContent);
    fs.writeFileSync(path.join(root, '404.html'), indexHtmlContent);

    // Update buildVer in root/index.html so root deployment also gets instant cache busting
    const rootIndexFile = path.join(root, 'index.html');
    if (fs.existsSync(rootIndexFile)) {
      let rootHtml = fs.readFileSync(rootIndexFile, 'utf-8');
      rootHtml = rootHtml.replace(/var buildVer = ['"][^'"]*['"]/, `var buildVer = '${buildVersion}'`);
      fs.writeFileSync(rootIndexFile, rootHtml);
    }
  }

  // 4. Sync dist to docs (for users with Pages set to /docs folder)
  if (fs.existsSync(dist)) {
    fs.cpSync(dist, docs, { recursive: true, force: true });
  }

  // 5. Clean stale files and copy dist/assets to docs/assets and root assets
  const distAssets = path.join(dist, 'assets');
  if (fs.existsSync(distAssets)) {
    // Remove stale hashed files in docs/assets and root assets
    [path.join(docs, 'assets'), assets].forEach(targetAssetDir => {
      if (fs.existsSync(targetAssetDir)) {
        const files = fs.readdirSync(targetAssetDir);
        files.forEach(file => {
          if (file.startsWith('index-') && (file.endsWith('.js') || file.endsWith('.css'))) {
            try { fs.unlinkSync(path.join(targetAssetDir, file)); } catch {}
          }
        });
      }
    });
    fs.cpSync(distAssets, assets, { recursive: true, force: true });
    fs.cpSync(distAssets, path.join(docs, 'assets'), { recursive: true, force: true });
  }

  // 6. Ensure CNAME and favicon are everywhere
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

  // 7. Sync all Google-compliant favicon files, brand icons, and manifests everywhere
  const faviconFiles = [
    'favicon.svg',
    'favicon.ico',
    'favicon.png',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'favicon-48x48.png',
    'favicon-96x96.png',
    'favicon-144x144.png',
    'favicon-192x192.png',
    'favicon-512x512.png',
    'apple-touch-icon.png',
    'logo.png',
    'site.webmanifest',
    'manifest.json'
  ];

  const iconTargetDirs = [
    root,
    path.join(root, 'public'),
    dist,
    docs,
    assets,
    path.join(docs, 'assets'),
    path.join(dist, 'assets')
  ];

  iconTargetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    faviconFiles.forEach(f => {
      const src = path.join(root, 'public', f);
      if (fs.existsSync(src)) {
        try { fs.copyFileSync(src, path.join(dir, f)); } catch {}
      }
    });
  });

  // 8. Ensure products.json is synced across public, dist, docs, and assets
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
    fs.writeFileSync(path.join(root, 'products.json'), productsJsonStr);
    if (fs.existsSync(path.join(root, 'public'))) {
      fs.writeFileSync(path.join(root, 'public', 'products.json'), productsJsonStr);
    }
    if (fs.existsSync(dist)) {
      fs.writeFileSync(path.join(dist, 'products.json'), productsJsonStr);
      const distPublic = path.join(dist, 'public');
      if (!fs.existsSync(distPublic)) fs.mkdirSync(distPublic, { recursive: true });
      fs.writeFileSync(path.join(distPublic, 'products.json'), productsJsonStr);
    }
    if (fs.existsSync(docs)) {
      fs.writeFileSync(path.join(docs, 'products.json'), productsJsonStr);
      const docsPublic = path.join(docs, 'public');
      if (!fs.existsSync(docsPublic)) fs.mkdirSync(docsPublic, { recursive: true });
      fs.writeFileSync(path.join(docsPublic, 'products.json'), productsJsonStr);
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

  // 9. Sync sitemap.xml and robots.txt
  ['sitemap.xml', 'robots.txt'].forEach(file => {
    const srcFile = path.join(root, 'public', file);
    if (fs.existsSync(srcFile)) {
      if (fs.existsSync(dist)) fs.copyFileSync(srcFile, path.join(dist, file));
      if (fs.existsSync(docs)) fs.copyFileSync(srcFile, path.join(docs, file));
      if (fs.existsSync(assets)) fs.copyFileSync(srcFile, path.join(assets, file));
      fs.copyFileSync(srcFile, path.join(root, file));
    }
  });

  // 9.5. Sync payment logos (bKash, Nagad, Rocket) to root, dist, docs, assets, and assets/payment
  const paymentLogoFiles = ['bkash.png', 'bkash.svg', 'nagad.png', 'nagad.svg', 'rocket.svg'];
  const paymentDirs = [
    root,
    dist,
    docs,
    assets,
    path.join(assets, 'payment'),
    path.join(docs, 'assets', 'payment'),
    path.join(dist, 'assets', 'payment')
  ];

  paymentDirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    paymentLogoFiles.forEach(logoFile => {
      const srcFile = path.join(root, 'public', logoFile);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, path.join(dir, logoFile));
      }
    });
  });

  // 10. Generate physical static HTML directories for ALL Category Pages (Current & Future Dynamic Categories)
  // This guarantees that direct visits like https://nirapodkroy.shop/baby-and-kids or any future category return HTTP 200 on GitHub Pages
  if (indexHtmlContent) {
    const baseMap = {
      'offer-zone': { bn: 'অফার জোন', en: 'Offer Zone' },
      'offers': { bn: 'অফার জোন', en: 'Offer Zone' },
      'offer': { bn: 'অফার জোন', en: 'Offer Zone' },
      'deals': { bn: 'অফার জোন', en: 'Offer Zone' },
      'baby-and-kids': { bn: 'শিশু ও খেলনা', en: 'Baby & Kids' },
      'baby-kids': { bn: 'শিশু ও খেলনা', en: 'Baby & Kids' },
      'kids': { bn: 'শিশু ও খেলনা', en: 'Baby & Kids' },
      'baby': { bn: 'শিশু ও খেলনা', en: 'Baby & Kids' },
      'shishu': { bn: 'শিশু ও খেলনা', en: 'Baby & Kids' },
      'honey': { bn: 'মধু ও সুইটনার', en: 'Honey' },
      'modhu': { bn: 'মধু ও সুইটনার', en: 'Honey' },
      'oil-and-ghee': { bn: 'তেল ও ঘি', en: 'Oil & Ghee' },
      'oil-ghee': { bn: 'তেল ও ঘি', en: 'Oil & Ghee' },
      'dates': { bn: 'প্রিমিয়াম খেজুর', en: 'Dates' },
      'khejur': { bn: 'প্রিমিয়াম খেজুর', en: 'Dates' },
      'spices': { bn: 'খাঁটি মশলা', en: 'Spices' },
      'moshla': { bn: 'খাঁটি মশলা', en: 'Spices' },
      'nuts-and-seeds': { bn: 'বাদাম ও বীজ', en: 'Nuts & Seeds' },
      'badam': { bn: 'বাদাম ও বীজ', en: 'Nuts & Seeds' },
      'beverage': { bn: 'চা ও পানীয়', en: 'Beverage' },
      'tea': { bn: 'চা ও পানীয়', en: 'Beverage' },
      'rice': { bn: 'প্রিমিয়াম চাল', en: 'Rice' },
      'chal': { bn: 'প্রিমিয়াম চাল', en: 'Rice' },
      'flours-and-lentils': { bn: 'আটা ও ডাল', en: 'Flours & Lentils' },
      'groceries': { bn: 'মুদি ও খাদ্য', en: 'Groceries' },
      'sports': { bn: 'খেলাধুলা', en: 'Sports' },
      'electronics': { bn: 'ইলেকট্রনিক্স', en: 'Electronics' },
      'fashion': { bn: 'ফ্যাশন ও পোশাক', en: 'Fashion' },
      'shirt': { bn: 'শার্ট', en: 'Shirt' },
      'shart': { bn: 'শার্ট', en: 'Shirt' },
      'sharee': { bn: 'শাড়ি', en: 'Sharee' },
      'saree': { bn: 'শাড়ি', en: 'Sharee' },
      'shari': { bn: 'শাড়ি', en: 'Sharee' },
      'panjabi': { bn: 'পাঞ্জাবি', en: 'Panjabi' },
      'women-hijab': { bn: 'হিজাব ও বোরকা', en: 'Women Hijab' },
      'health-and-beauty': { bn: 'সৌন্দর্য ও স্বাস্থ্য', en: 'Health & Beauty' },
      'home-and-kitchen': { bn: 'গৃহস্থালি ও রান্নাঘর', en: 'Home & Kitchen' },
      'books': { bn: 'বই ও সাহিত্য', en: 'Books' },
      'accessories': { bn: 'অন্যান্য', en: 'Accessories' }
    };

    function toSlug(cat) {
      return cat
        .toLowerCase()
        .trim()
        .replace(/&/g, 'and')
        .replace(/[\s_]+/g, '-')
        .replace(/[^\w\u0980-\u09FF-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const categoriesToGenerate = [];
    const seenSlugs = new Set();

    // 1. Add base category entries
    Object.keys(baseMap).forEach(slug => {
      seenSlugs.add(slug);
      categoriesToGenerate.push({
        slug,
        bn: baseMap[slug].bn,
        en: baseMap[slug].en
      });
    });

    // 2. Dynamically extract ALL categories from the product catalog (handles future custom categories)
    if (productsJsonStr) {
      try {
        const prodList = JSON.parse(productsJsonStr);
        if (Array.isArray(prodList)) {
          prodList.forEach(p => {
            if (p.category && typeof p.category === 'string' && p.category.trim()) {
              const catName = p.category.trim();
              const catSlug = toSlug(catName);
              if (catSlug && !seenSlugs.has(catSlug)) {
                seenSlugs.add(catSlug);
                categoriesToGenerate.push({
                  slug: catSlug,
                  bn: catName,
                  en: catName
                });
              }
            }
          });
        }
      } catch (err) {
        console.warn('[Postbuild] Failed to parse products for dynamic category generation:', err);
      }
    }

    const targets = [dist, docs, root];

    categoriesToGenerate.forEach(item => {
      // Customize title and meta for each category
      const customHtml = indexHtmlContent
        .replace(/<title>.*?<\/title>/, `<title>${item.bn} (${item.en}) - নিরাপদ ক্রয় | Nirapod Kroy</title>`)
        .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${item.bn} | নিরাপদ ক্রয়" />`);

      targets.forEach(targetDir => {
        if (fs.existsSync(targetDir)) {
          // 1. Direct path /slug
          const directDir = path.join(targetDir, item.slug);
          if (!fs.existsSync(directDir)) fs.mkdirSync(directDir, { recursive: true });
          fs.writeFileSync(path.join(directDir, 'index.html'), customHtml);

          // 2. Prefix path /category/slug
          const categorySubDir = path.join(targetDir, 'category', item.slug);
          if (!fs.existsSync(categorySubDir)) fs.mkdirSync(categorySubDir, { recursive: true });
          fs.writeFileSync(path.join(categorySubDir, 'index.html'), customHtml);
        }
      });
    });

    console.log(`[Postbuild] Successfully created ${categoriesToGenerate.length} static category pages in dist, docs, and root!`);
  }

  // 11. Generate dedicated static pages for Policy & Trust Pages (Privacy Policy, Refund Policy, Delivery Policy)
  if (indexHtmlContent) {
    const policyPages = [
      {
        slug: 'privacy',
        title: 'গোপনীয়তা নীতি (Privacy Policy) - নিরাপদ ক্রয় | Nirapod Kroy',
        desc: 'Nirapod Kroy এর অফিসিয়াল গোপনীয়তা নীতি। আপনার ব্যক্তিগত তথ্য, অর্ডার ও পেমেন্ট সম্পূর্ণ সুরক্ষিত।'
      },
      {
        slug: 'privacy-policy',
        title: 'গোপনীয়তা নীতি (Privacy Policy) - নিরাপদ ক্রয় | Nirapod Kroy',
        desc: 'Nirapod Kroy এর অফিসিয়াল গোপনীয়তা নীতি। আপনার ব্যক্তিগত তথ্য, অর্ডার ও পেমেন্ট সম্পূর্ণ সুরক্ষিত।'
      },
      {
        slug: 'return-refund',
        title: 'রিটার্ন ও রিফান্ড পলিসি (Return & Refund Policy) - নিরাপদ ক্রয় | Nirapod Kroy',
        desc: 'Nirapod Kroy-এ পণ্য রিটার্ন ও রিফান্ড নীতি। পণ্য যাচাই করে মূল্য পরিশোধ করুন।'
      },
      {
        slug: 'delivery-policy',
        title: 'ডেলিভারি পলিসি (Delivery Policy) - নিরাপদ ক্রয় | Nirapod Kroy',
        desc: 'Nirapod Kroy দ্রুত ও বিশ্বস্ত হোম ডেলিভারি সার্ভিস। সমগ্র বাংলাদেশে ক্যাশ অন ডেলিভারি।'
      }
    ];

    const targets = [dist, docs, root];
    policyPages.forEach(p => {
      const pageHtml = indexHtmlContent
        .replace(/<title>.*?<\/title>/, `<title>${p.title}</title>`)
        .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${p.title}" />`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${p.desc}" />`)
        .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${p.desc}" />`);

      targets.forEach(targetDir => {
        if (fs.existsSync(targetDir)) {
          const dir = path.join(targetDir, p.slug);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, 'index.html'), pageHtml);
        }
      });
    });
    console.log('[Postbuild] Successfully created static policy pages (privacy, privacy-policy, return-refund, delivery-policy)!');
  }

  // 12. Security Clean-up: Strictly remove any sensitive files, server bundles, and zip files from public-facing directories
  const publicDirsToClean = [docs, path.join(root, 'public')];
  publicDirsToClean.forEach(cleanDir => {
    if (fs.existsSync(cleanDir)) {
      const filesToRemove = [
        'server.cjs',
        'server.cjs.map',
        'admin-credentials.zip',
        'admin-credentials.txt',
        'admin-credentials.json'
      ];
      filesToRemove.forEach(file => {
        const fullPath = path.join(cleanDir, file);
        if (fs.existsSync(fullPath)) {
          try { fs.unlinkSync(fullPath); console.log(`[Postbuild Clean] Removed protected ${file} from ${path.relative(root, cleanDir)}`); } catch {}
        }
      });
      // Also remove any stray .zip files in public directories
      try {
        const entries = fs.readdirSync(cleanDir);
        entries.forEach(e => {
          if (e.endsWith('.zip') || e.endsWith('.tar') || e.endsWith('.gz')) {
            try { fs.unlinkSync(path.join(cleanDir, e)); console.log(`[Postbuild Clean] Removed archive ${e} from ${path.relative(root, cleanDir)}`); } catch {}
          }
        });
      } catch {}
    }
  });

  // Also remove any stray credentials or zip files in dist and root
  ['admin-credentials.zip', 'admin-credentials.txt', 'admin-credentials.json'].forEach(f => {
    try { if (fs.existsSync(path.join(dist, f))) fs.unlinkSync(path.join(dist, f)); } catch {}
    try { if (fs.existsSync(path.join(root, f))) fs.unlinkSync(path.join(root, f)); } catch {}
  });

  console.log('[Postbuild] Successfully synced dist, docs, assets, 404.html, CNAME, favicon suite, products.json, and sitemap.xml!');
} catch (err) {
  console.error('[Postbuild Error]', err);
}
