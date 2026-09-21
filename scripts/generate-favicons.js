import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = process.cwd();
const svgPath = path.join(root, 'favicon.svg');

if (!fs.existsSync(svgPath)) {
  console.error('favicon.svg not found at', svgPath);
  process.exit(1);
}

const svgBuffer = fs.readFileSync(svgPath);

// Target dimensions required by Google Search and modern browsers
const SIZES = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 }, // Google Search primary target!
  { name: 'favicon-96x96.png', size: 96 }, // Google Search high-res target!
  { name: 'favicon-144x144.png', size: 144 },
  { name: 'favicon-192x192.png', size: 192 }, // Android & Google PWA
  { name: 'favicon-512x512.png', size: 512 }, // Schema.org Organization Logo
  { name: 'apple-touch-icon.png', size: 180 }, // Apple iOS & Google Knowledge
  { name: 'favicon.png', size: 96 },
  { name: 'logo.png', size: 512 }
];

async function generateFavicons() {
  console.log('[Favicon Generator] Generating Google-compliant PNG icons from SVG...');
  
  const pngBuffers = {};

  for (const item of SIZES) {
    const buffer = await sharp(svgBuffer)
      .resize(item.size, item.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
    
    pngBuffers[item.name] = buffer;
  }

  // Generate standard modern multi-resolution favicon.ico containing 16x16, 32x32, 48x48 PNG frames
  const icoSizes = [
    { size: 16, buffer: pngBuffers['favicon-16x16.png'] },
    { size: 32, buffer: pngBuffers['favicon-32x32.png'] },
    { size: 48, buffer: pngBuffers['favicon-48x48.png'] }
  ];

  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // 1 = ICO type
  icoHeader.writeUInt16LE(icoSizes.length, 4); // Number of images

  let offset = 6 + (16 * icoSizes.length);
  const entryBuffers = [];
  const imageBuffers = [];

  for (const img of icoSizes) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // Width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image data size
    entry.writeUInt32LE(offset, 12); // Image data offset
    
    entryBuffers.push(entry);
    imageBuffers.push(img.buffer);
    offset += img.buffer.length;
  }

  const icoBuffer = Buffer.concat([icoHeader, ...entryBuffers, ...imageBuffers]);
  pngBuffers['favicon.ico'] = icoBuffer;

  // Directories where favicons need to be placed
  const targetDirs = [
    root,
    path.join(root, 'public'),
    path.join(root, 'docs'),
    path.join(root, 'assets'),
    path.join(root, 'docs', 'assets')
  ];

  // Write Web Manifest
  const manifest = {
    name: "Nirapod Kroy | নিরাপদ ক্রয়",
    short_name: "Nirapod Kroy",
    description: "সব ধরনের বিশ্বস্ত পণ্য ঘরে বসেই কিনুন নিরাপদে",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#10b981",
    icons: [
      {
        src: "/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };

  const manifestStr = JSON.stringify(manifest, null, 2);

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    for (const [filename, buf] of Object.entries(pngBuffers)) {
      fs.writeFileSync(path.join(dir, filename), buf);
    }

    fs.writeFileSync(path.join(dir, 'site.webmanifest'), manifestStr);
    fs.writeFileSync(path.join(dir, 'manifest.json'), manifestStr);
  }

  console.log('[Favicon Generator] Successfully created Google-ready icons (48x48, 96x96, 192x192, 512x512, .ico, apple-touch-icon)!');
}

generateFavicons().catch(err => {
  console.error('[Favicon Generator Error]', err);
  process.exit(1);
});
