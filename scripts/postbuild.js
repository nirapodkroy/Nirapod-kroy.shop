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

  // 4. Ensure CNAME is everywhere
  const cnameContent = 'www.nirapodkroy.shop\n';
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

  console.log('[Postbuild] Successfully synced dist, docs, assets, 404.html, and CNAME!');
} catch (err) {
  console.error('[Postbuild Error]', err);
}
