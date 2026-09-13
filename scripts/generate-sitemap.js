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
  const storeData = path.join(root, '.app_store_data.json');
  const pubProducts = path.join(publicDir, 'products.json');
  if (fs.existsSync(storeData)) {
    const parsed = JSON.parse(fs.readFileSync(storeData, 'utf-8'));
    products = parsed.products || [];
  } else if (fs.existsSync(pubProducts)) {
    products = JSON.parse(fs.readFileSync(pubProducts, 'utf-8'));
  }
} catch (e) {
  console.error('Failed to load products for sitemap:', e);
}

const today = new Date().toISOString().split('T')[0];

const categories = [
  'Groceries',
  'Electronics',
  'Fashion',
  'Health & Beauty',
  'Home & Kitchen',
  'Baby & Kids',
  'Sports',
  'Books'
];

let urls = [
  { loc: `${DOMAIN}/`, priority: '1.0', changefreq: 'daily' },
  ...categories.map(cat => ({
    loc: `${DOMAIN}/?category=${encodeURIComponent(cat)}`,
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

// Write robots.txt
const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /admin

Sitemap: ${DOMAIN}/sitemap.xml
`;

fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');
fs.writeFileSync(path.join(root, 'robots.txt'), robotsTxt, 'utf-8');

console.log(`[Sitemap] Generated sitemap.xml with ${urls.length} URLs and robots.txt`);
