import fs from 'fs';
import path from 'path';

const root = process.cwd();
const publicDir = path.join(root, 'public');

let customDomain = 'nirapodkroy.shop';
try {
  if (fs.existsSync(path.join(root, 'CNAME'))) {
    const raw = fs.readFileSync(path.join(root, 'CNAME'), 'utf-8').trim();
    if (raw) customDomain = raw;
  }
} catch {}

const DOMAIN = `https://${customDomain}`;

let products = [];
try {
  const pubProducts = path.join(publicDir, 'products.json');
  const storeData = path.join(root, '.app_store_data.json');
  if (fs.existsSync(pubProducts)) {
    products = JSON.parse(fs.readFileSync(pubProducts, 'utf-8'));
  } else if (fs.existsSync(storeData)) {
    const parsed = JSON.parse(fs.readFileSync(storeData, 'utf-8'));
    products = parsed.products || [];
  }
} catch (e) {
  console.error('Failed to load products for sitemap:', e);
}

const today = new Date().toISOString().split('T')[0];

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

const baseCategories = [
  'Honey',
  'Oil & Ghee',
  'Dates',
  'Spices',
  'Nuts & Seeds',
  'Beverage',
  'Rice',
  'Flours & Lentils',
  'Groceries',
  'Baby & Kids',
  'Sports',
  'Electronics',
  'Fashion',
  'Health & Beauty',
  'Home & Kitchen',
  'Books',
  'Accessories'
];

// Dynamically extract all categories from product list
const allCategoriesSet = new Set(baseCategories);
if (Array.isArray(products)) {
  products.forEach(p => {
    if (p.category && typeof p.category === 'string' && p.category.trim()) {
      allCategoriesSet.add(p.category.trim());
    }
  });
}
const categories = Array.from(allCategoriesSet);

let urls = [
  { loc: `${DOMAIN}/`, priority: '1.0', changefreq: 'daily' },
  // Important Policy & Trust Pages for Google & Users
  { loc: `${DOMAIN}/privacy`, priority: '0.8', changefreq: 'monthly', lastmod: today },
  { loc: `${DOMAIN}/privacy-policy`, priority: '0.8', changefreq: 'monthly', lastmod: today },
  { loc: `${DOMAIN}/return-refund`, priority: '0.8', changefreq: 'monthly', lastmod: today },
  { loc: `${DOMAIN}/delivery-policy`, priority: '0.8', changefreq: 'monthly', lastmod: today },
  // Clean category URLs (e.g. https://nirapodkroy.shop/baby-and-kids)
  ...categories.map(cat => ({
    loc: `${DOMAIN}/${toSlug(cat)}`,
    priority: '0.8',
    changefreq: 'daily'
  })),
  ...products.filter(p => p.isActive !== false).map(p => ({
    loc: `${DOMAIN}/?product=${encodeURIComponent(p.id)}`,
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: today
  }))
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : `<lastmod>${today}</lastmod>`}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

// Write to public/sitemap.xml and root sitemap.xml
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemapXml, 'utf-8');

// Write robots.txt with comprehensive security disallow rules
const robotsTxt = `User-agent: *
Allow: /
Allow: /favicon*
Allow: /logo.png
Allow: /assets/
Allow: /products.json
Allow: /site.webmanifest
Allow: /manifest.json
Disallow: /api/admin/
Disallow: /admin
Disallow: /.secure-vault/
Disallow: /admin-credentials*
Disallow: /*.zip$
Disallow: /*.tar$
Disallow: /*.gz$
Disallow: /*.map$
Disallow: /*.cjs$

Sitemap: ${DOMAIN}/sitemap.xml
`;

fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');
fs.writeFileSync(path.join(root, 'robots.txt'), robotsTxt, 'utf-8');

console.log(`[Sitemap] Generated sitemap.xml with ${urls.length} URLs and robots.txt`);
