import fs from "fs";
import path from "path";
import sharp from "sharp";

const WIDTH = 1920;
const HEIGHT = 1080;

// Shared SVG defs for Kraft paper texture, wood grain, stitch pattern, and drop shadows
const SHARED_DEFS = `
  <defs>
    <!-- Drop Shadow Filter -->
    <filter id="shadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="3" dy="6" stdDeviation="8" flood-opacity="0.25"/>
    </filter>
    <filter id="shadow-soft" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.15"/>
    </filter>
    <filter id="shadow-deep" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="6" dy="10" stdDeviation="12" flood-opacity="0.35"/>
    </filter>

    <!-- Wood Texture Gradient -->
    <linearGradient id="woodPlank" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7c5335"/>
      <stop offset="25%" stop-color="#694328"/>
      <stop offset="50%" stop-color="#5a381f"/>
      <stop offset="75%" stop-color="#6f482d"/>
      <stop offset="100%" stop-color="#4d2e18"/>
    </linearGradient>

    <!-- Kraft Paper Gradient -->
    <linearGradient id="kraftPaper" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e8d9c2"/>
      <stop offset="40%" stop-color="#decaa7"/>
      <stop offset="80%" stop-color="#d4bf9c"/>
      <stop offset="100%" stop-color="#c9b28b"/>
    </linearGradient>

    <!-- Fabric Stitch Pattern -->
    <pattern id="stitch" width="12" height="12" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="6" y2="0" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" stroke-dasharray="3,3"/>
    </pattern>

    <!-- Pin Head Gradient -->
    <radialGradient id="silverPin" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#c0c0c0"/>
      <stop offset="100%" stop-color="#555555"/>
    </radialGradient>
    <radialGradient id="brassPin" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fff2a8"/>
      <stop offset="50%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#664d03"/>
    </radialGradient>
    <radialGradient id="redPin" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ff8585"/>
      <stop offset="50%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#7f1d1d"/>
    </radialGradient>
  </defs>
`;

function renderCommonCraftElements(tag1, tag2, titleLine1, titleLine2, englishSub, desc1, desc2, ctaText) {
  return `
    <!-- Top Pinned Fabric Tags -->
    <g filter="url(#shadow)">
      <!-- Tag 1 -->
      <g transform="rotate(-1 100 110)">
        <rect x="90" y="105" width="410" height="92" rx="4" fill="${tag1.bg}" />
        <rect x="94" y="109" width="402" height="84" rx="3" fill="none" stroke="${tag1.stitch || 'rgba(255,255,255,0.5)'}" stroke-width="2" stroke-dasharray="6,4" />
        <text x="295" y="165" font-family="'Noto Sans Bengali', 'Hind Siliguri', sans-serif" font-weight="700" font-size="34" fill="${tag1.color}" text-anchor="middle">${tag1.text}</text>
        <!-- Pin -->
        <circle cx="106" cy="120" r="9" fill="url(#silverPin)" filter="url(#shadow-soft)" />
        <line x1="106" y1="120" x2="114" y2="132" stroke="#333" stroke-width="2" />
      </g>

      <!-- Tag 2 -->
      <g transform="rotate(1.5 530 110)">
        <rect x="525" y="112" width="${tag2.width || 420}" height="88" rx="4" fill="${tag2.bg}" />
        <rect x="529" y="116" width="${(tag2.width || 420) - 8}" height="80" rx="3" fill="none" stroke="${tag2.stitch || 'rgba(0,0,0,0.2)'}" stroke-width="2" stroke-dasharray="6,4" />
        <text x="${525 + (tag2.width || 420)/2}" y="168" font-family="'Noto Sans Bengali', 'Hind Siliguri', sans-serif" font-weight="700" font-size="32" fill="${tag2.color}" text-anchor="middle">${tag2.text}</text>
        <!-- Pin -->
        <circle cx="${525 + (tag2.width || 420) - 16}" cy="126" r="9" fill="url(#brassPin)" filter="url(#shadow-soft)" />
        <line x1="${525 + (tag2.width || 420) - 16}" y1="126" x2="${525 + (tag2.width || 420) - 8}" y2="138" stroke="#333" stroke-width="2" />
      </g>
    </g>

    <!-- Main Typography -->
    <g>
      <text x="95" y="320" font-family="'Noto Sans Bengali', 'Hind Siliguri', sans-serif" font-weight="900" font-size="76" fill="#0d2847" letter-spacing="-1">${titleLine1}</text>
      ${titleLine2 ? `<text x="95" y="415" font-family="'Noto Sans Bengali', 'Hind Siliguri', sans-serif" font-weight="900" font-size="76" fill="#0d2847" letter-spacing="-1">${titleLine2}</text>` : ''}
      <text x="95" y="${titleLine2 ? 505 : 420}" font-family="'Segoe UI', Roboto, Helvetica, sans-serif" font-weight="800" font-size="54" fill="#0284c7" letter-spacing="0.5">${englishSub}</text>
      
      <!-- Description Paragraph -->
      <text x="95" y="${titleLine2 ? 590 : 500}" font-family="'Noto Sans Bengali', 'Hind Siliguri', sans-serif" font-weight="600" font-size="28" fill="#1e293b" opacity="0.95">${desc1}</text>
      ${desc2 ? `<text x="95" y="${titleLine2 ? 635 : 545}" font-family="'Noto Sans Bengali', 'Hind Siliguri', sans-serif" font-weight="600" font-size="28" fill="#1e293b" opacity="0.95">${desc2}</text>` : ''}
    </g>

    <!-- Interactive Buttons on Kraft Paper -->
    <g transform="translate(95, ${titleLine2 ? 720 : 640})" filter="url(#shadow)">
      <!-- Green Stitched Fabric CTA Button -->
      <g>
        <rect x="0" y="0" width="410" height="98" rx="8" fill="#3b7a57" />
        <rect x="4" y="4" width="402" height="90" rx="6" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2.5" stroke-dasharray="8,5" />
        <text x="180" y="62" font-family="'Noto Sans Bengali', 'Hind Siliguri', sans-serif" font-weight="700" font-size="33" fill="#ffffff" text-anchor="middle">${ctaText}</text>
        <path d="M 330 52 L 360 52 M 350 42 L 362 52 L 350 62" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <!-- Stitch String Tag on left -->
        <circle cx="22" cy="49" r="6" fill="#2d5e43" stroke="#fff" stroke-width="1.5" />
      </g>

      <!-- Parchment Paper "হট ডিলস দেখুন" Button -->
      <g transform="translate(450, 6)">
        <rect x="0" y="0" width="280" height="86" rx="6" fill="#fdfaf3" stroke="#cfba9a" stroke-width="1.5" />
        <text x="140" y="55" font-family="'Noto Sans Bengali', 'Hind Siliguri', sans-serif" font-weight="700" font-size="30" fill="#1e293b" text-anchor="middle">হট ডিলস দেখুন</text>
        <!-- Mini Pushpin -->
        <circle cx="20" cy="18" r="4.5" fill="url(#brassPin)" />
      </g>
    </g>

    <!-- Wooden Crate Stamp Logo at Bottom Center -->
    <g transform="translate(880, 770)" filter="url(#shadow-soft)">
      <!-- Wooden Crate Border Box -->
      <rect x="0" y="0" width="560" height="230" rx="10" fill="#a47551" stroke="#684729" stroke-width="8" />
      <!-- Planks inner lines -->
      <line x1="0" y1="75" x2="560" y2="75" stroke="#684729" stroke-width="4" />
      <line x1="0" y1="155" x2="560" y2="155" stroke="#684729" stroke-width="4" />
      <!-- Bolts -->
      <circle cx="20" cy="20" r="5" fill="#3e2723" />
      <circle cx="540" cy="20" r="5" fill="#3e2723" />
      <circle cx="20" cy="210" r="5" fill="#3e2723" />
      <circle cx="540" cy="210" r="5" fill="#3e2723" />
      <!-- Engraved/Burned Brand Text -->
      <text x="280" y="145" font-family="'Noto Sans Bengali', 'Hind Siliguri', sans-serif" font-weight="900" font-size="70" fill="#2c1a0e" text-anchor="middle" letter-spacing="2">নিরাপদ ক্রয়</text>
    </g>

    <!-- Wooden Craft Accessories (Beads, Arrows, Strings) on Bottom Right -->
    <g transform="translate(1520, 760)">
      <!-- Beads necklace -->
      <ellipse cx="60" cy="60" rx="20" ry="24" fill="#a8c599" stroke="#5d8a4e" stroke-width="2" />
      <ellipse cx="105" cy="40" rx="22" ry="26" fill="#e8d8b8" stroke="#aa8855" stroke-width="2" />
      <ellipse cx="150" cy="65" rx="20" ry="24" fill="#2d7a57" stroke="#1d4d37" stroke-width="2" />
      <!-- Wooden Craft Arrows -->
      <path d="M 120 140 L 260 80 M 230 65 L 262 80 L 245 105" stroke="#a47551" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M 120 180 L 260 140 M 235 125 L 262 140 L 245 160" stroke="#a47551" stroke-width="6" stroke-linecap="round" fill="none"/>
    </g>
  `;
}

// 1. BANNER: Fashion & Lifestyle (AI_creating_handmade_look_design_2K_20260926100408.jpg)
function generateFashionBannerSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
      ${SHARED_DEFS}
      
      <!-- Background Kraft Paper -->
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#kraftPaper)" />
      
      <!-- Subtle Paper Creases & Vignette -->
      <rect width="${WIDTH}" height="${HEIGHT}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="40" />

      <!-- Left Content -->
      ${renderCommonCraftElements(
        { text: "প্রিমিয়াম কোয়ালিটি", bg: "#b84768", color: "#ffffff", stitch: "rgba(255,255,255,0.6)" },
        { text: "নতুন কালেকশন ২০২৬", bg: "#e5ab37", color: "#2d1f05", width: 420 },
        "স্টাইলিশ ফ্যাশন, পোশাক",
        "ও লাইফস্টাইল",
        "Fashion &amp; Lifestyle Wear",
        "অভিজাতপূর্ণ কটন পাঞ্জাবি, ঐতিহ্যবাহী সুতি শাড়ি, জেনুইন",
        "লেদার ওয়ালেট &amp; আরামদায়ক ক্যাজুয়াল পোশাক।",
        "ফ্যাশন কালেকশন"
      )}

      <!-- Right Side Wooden Board with Fashion Products -->
      <g filter="url(#shadow-deep)">
        <!-- Rustic Wood Board Platform -->
        <rect x="1100" y="55" width="760" height="660" rx="8" fill="url(#woodPlank)" stroke="#3e2723" stroke-width="6" />
        <!-- Wood grain details -->
        <line x1="1100" y1="220" x2="1860" y2="220" stroke="rgba(0,0,0,0.25)" stroke-width="3" />
        <line x1="1100" y1="440" x2="1860" y2="440" stroke="rgba(0,0,0,0.25)" stroke-width="3" />
        
        <!-- Folded Textured Cotton Panjabi (Left of Wood Board) -->
        <g transform="translate(1135, 75)" filter="url(#shadow)">
          <path d="M 40 40 L 140 10 L 240 40 L 320 180 L 260 210 L 230 140 L 230 520 L 50 520 L 50 140 L 20 210 L -40 180 Z" fill="#d2baa2" stroke="#a4886f" stroke-width="2" />
          <!-- Mandarin Collar -->
          <path d="M 100 40 Q 140 70 180 40" fill="none" stroke="#8a6c54" stroke-width="4" />
          <!-- Panjabi Placket & Buttons -->
          <rect x="130" y="65" width="22" height="260" fill="#c4aa91" stroke="#9a7f67" stroke-width="1.5" />
          <circle cx="141" cy="95" r="5" fill="#5c4431" />
          <circle cx="141" cy="155" r="5" fill="#5c4431" />
          <circle cx="141" cy="215" r="5" fill="#5c4431" />
          <circle cx="141" cy="275" r="5" fill="#5c4431" />
          <!-- Fabric Texture Print Lines -->
          <path d="M 60 200 L 220 200 M 60 280 L 220 280 M 60 360 L 220 360 M 60 440 L 220 440" stroke="rgba(110,80,60,0.15)" stroke-dasharray="4,6" stroke-width="2"/>
        </g>

        <!-- Folded Traditional Artisan Saree/Cloth (Top Right of Wood Board) -->
        <g transform="translate(1500, 75)" filter="url(#shadow-soft)">
          <rect x="0" y="0" width="270" height="340" rx="6" fill="#f5ebe0" stroke="#b08d72" stroke-width="3" />
          <!-- Traditional Motifs & Borders -->
          <rect x="15" y="15" width="240" height="40" fill="#9e3a3a" />
          <text x="135" y="42" font-family="'Noto Sans Bengali', sans-serif" font-size="18" fill="#ffffff" text-anchor="middle">ঐতিহ্যবাহী সুতি শাড়ি</text>
          <!-- Geometric Block Print Motifs -->
          <g fill="#9e3a3a" opacity="0.8">
            <path d="M 50 90 L 70 70 L 90 90 L 70 110 Z"/>
            <path d="M 130 90 L 150 70 L 170 90 L 150 110 Z"/>
            <path d="M 210 90 L 230 70 L 250 90 L 230 110 Z"/>
            <path d="M 50 170 L 70 150 L 90 170 L 70 190 Z"/>
            <path d="M 130 170 L 150 150 L 170 170 L 150 190 Z"/>
            <path d="M 210 170 L 230 150 L 250 170 L 230 190 Z"/>
            <path d="M 50 250 L 70 230 L 90 250 L 70 270 Z"/>
            <path d="M 130 250 L 150 230 L 170 250 L 150 270 Z"/>
            <path d="M 210 250 L 230 230 L 250 250 L 230 270 Z"/>
          </g>
          <rect x="15" y="295" width="240" height="30" fill="#9e3a3a" />
        </g>

        <!-- Genuine Brown Leather Bi-fold Wallet (Bottom Right of Wood Board) -->
        <g transform="translate(1520, 445)" filter="url(#shadow)">
          <rect x="0" y="0" width="230" height="190" rx="14" fill="#a45318" stroke="#632f0c" stroke-width="4" />
          <!-- Leather Stitching around edges -->
          <rect x="8" y="8" width="214" height="174" rx="10" fill="none" stroke="#d49257" stroke-width="2" stroke-dasharray="6,4" />
          <!-- Wallet Fold line & shine -->
          <line x1="20" y1="95" x2="210" y2="95" stroke="#783a0e" stroke-width="3" />
          <path d="M 10 10 Q 80 50 200 20" stroke="rgba(255,255,255,0.2)" stroke-width="8" fill="none"/>
        </g>

        <!-- Artist Paintbrush -->
        <g transform="translate(1820, 280) rotate(10)" filter="url(#shadow-soft)">
          <rect x="0" y="0" width="12" height="360" rx="4" fill="#b08d72" stroke="#684729" stroke-width="1.5" />
          <rect x="-2" y="320" width="16" height="30" fill="#94a3b8" />
          <path d="M -2 350 C -4 380, 16 380, 14 350 Z" fill="#1e293b" />
        </g>
      </g>
    </svg>
  `;
}

// 2. BANNER: Stylish Hoodie Collection (Gemini_Generated_Image_8nkgr78nkgr78nkg.jpg)
function generateHoodieBannerSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
      ${SHARED_DEFS}
      
      <!-- Modern Light Cyan-Blue Background -->
      <rect width="${WIDTH}" height="${HEIGHT}" fill="#dbe9ee" />

      <!-- Floating Playful Line-Art Doodles -->
      <g stroke="#9abec9" stroke-width="3" fill="none" opacity="0.6">
        <!-- Hangers -->
        <path d="M 150 140 L 190 100 Q 200 90 195 75 Q 185 60 170 75 M 150 140 L 250 140 L 190 100" />
        <path d="M 1360 80 L 1400 40 Q 1410 30 1405 15 Q 1395 0 1380 15 M 1360 80 L 1460 80 L 1400 40" />
        <!-- Sale tags -->
        <path d="M 80 620 L 140 560 L 180 600 L 120 660 Z M 160 585 A 8 8 0 1 1 160 584" />
        <path d="M 1780 120 L 1840 60 L 1880 100 L 1820 160 Z M 1860 85 A 8 8 0 1 1 1860 84" />
        <path d="M 780 940 L 840 880 L 880 920 L 820 980 Z" />
        <!-- Gift Boxes & Stars -->
        <rect x="70" y="840" width="70" height="70" rx="6" />
        <line x1="70" y1="875" x2="140" y2="875" />
        <line x1="105" y1="840" x2="105" y2="910" />
        <path d="M 700 890 L 710 865 L 735 860 L 715 845 L 720 820 L 700 835 L 680 820 L 685 845 L 665 860 L 690 865 Z" />
        <!-- Shopping Bags -->
        <path d="M 1750 820 L 1850 820 L 1870 950 L 1730 950 Z M 1775 820 A 25 35 0 0 1 1825 820" />
        <path d="M 900 500 L 980 500 L 995 620 L 885 620 Z M 925 500 A 20 30 0 0 1 955 500" />
      </g>

      <!-- Left Column Content -->
      <g transform="translate(100, 110)">
        <!-- Top Pill Badge -->
        <g filter="url(#shadow-soft)">
          <rect x="0" y="0" width="370" height="75" rx="37" fill="#0f454d" />
          <text x="185" y="48" font-family="'Noto Sans Bengali', sans-serif" font-weight="700" font-size="34" fill="#ffffff" text-anchor="middle">প্রিমিয়াম কোয়ালিটি</text>
        </g>

        <!-- Brand Title & Category -->
        <text x="5" y="180" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="78" fill="#133d45" letter-spacing="-0.5">Nirapod Kroy</text>
        <text x="5" y="275" font-family="'Noto Sans Bengali', sans-serif" font-weight="800" font-size="70" fill="#133d45">(নিরাপদ ক্রয়)</text>
        <text x="5" y="375" font-family="'Noto Sans Bengali', sans-serif" font-weight="900" font-size="74" fill="#09252c">স্টাইলিশ হুডি কালেকশন</text>

        <!-- Discount Card: ৩০% ছাড়! -->
        <g transform="translate(0, 420)" filter="url(#shadow)">
          <rect x="0" y="0" width="410" height="105" rx="14" fill="#ffffff" />
          <text x="35" y="76" font-family="'Noto Sans Bengali', sans-serif" font-weight="900" font-size="70" fill="#e17812">৩০% ছাড়!</text>
        </g>

        <!-- Subtitle -->
        <text x="5" y="585" font-family="'Noto Sans Bengali', sans-serif" font-weight="700" font-size="34" fill="#09252c">সেরা ডিজাইনের আরামদায়ক হুডি এখন</text>
        <text x="5" y="635" font-family="'Noto Sans Bengali', sans-serif" font-weight="700" font-size="34" fill="#09252c">আকর্ষণীয় ডিসকাউন্টে।</text>

        <!-- Action CTA Buttons -->
        <g transform="translate(0, 685)" filter="url(#shadow)">
          <!-- Teal "কিনুন (Shop Now) ->" -->
          <g>
            <rect x="0" y="0" width="480" height="98" rx="49" fill="#00a89d" />
            <text x="220" y="62" font-family="'Noto Sans Bengali', sans-serif" font-weight="800" font-size="36" fill="#ffffff" text-anchor="middle">কিনুন (Shop Now)</text>
            <path d="M 400 52 L 430 52 M 420 42 L 432 52 L 420 62" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" fill="none"/>
          </g>

          <!-- Dark "হট ডিলস" Button -->
          <g transform="translate(510, 0)">
            <rect x="0" y="0" width="240" height="98" rx="49" fill="#1e293b" />
            <text x="120" y="62" font-family="'Noto Sans Bengali', sans-serif" font-weight="800" font-size="34" fill="#ffffff" text-anchor="middle">হট ডিলস</text>
          </g>
        </g>

        <!-- Website Link Footer -->
        <text x="680" y="865" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="36" fill="#0f3b43" text-anchor="middle">nirapodkroy.shop</text>
      </g>

      <!-- Right 2x2 Grid of 4 Black Stylish Hoodies -->
      <g transform="translate(1040, 80)" filter="url(#shadow-deep)">
        <!-- 1. Top-Left: Queen Crown Hoodie -->
        <g transform="translate(0, 0)">
          <!-- Hoodie Silhouette -->
          <path d="M 90 120 C 60 70 140 10 170 10 C 200 10 280 70 250 120 L 320 220 L 260 250 L 230 190 L 230 400 L 110 400 L 110 190 L 80 250 L 20 220 Z" fill="#1e2229" stroke="#000" stroke-width="4" />
          <!-- Hood Collar & Drawstrings -->
          <path d="M 140 110 Q 170 140 200 110" fill="#2d333f" stroke="#000" stroke-width="2" />
          <line x1="155" y1="130" x2="155" y2="180" stroke="#ffffff" stroke-width="3" />
          <line x1="185" y1="130" x2="185" y2="180" stroke="#ffffff" stroke-width="3" />
          <!-- Gold Crown Graphic -->
          <path d="M 145 200 L 155 180 L 170 200 L 185 180 L 195 200 Z" fill="#f59e0b" stroke="#d97706" stroke-width="1.5" />
          <text x="170" y="240" font-family="'Brush Script MT', cursive, sans-serif" font-size="40" font-weight="bold" fill="#ffffff" text-anchor="middle">Queen</text>
        </g>

        <!-- 2. Top-Right: Coffee Aesthetic Hoodie -->
        <g transform="translate(420, 0)">
          <path d="M 90 120 C 60 70 140 10 170 10 C 200 10 280 70 250 120 L 320 220 L 260 250 L 230 190 L 230 400 L 110 400 L 110 190 L 80 250 L 20 220 Z" fill="#1e2229" stroke="#000" stroke-width="4" />
          <path d="M 140 110 Q 170 140 200 110" fill="#2d333f" stroke="#000" stroke-width="2" />
          <line x1="155" y1="130" x2="155" y2="180" stroke="#ffffff" stroke-width="3" />
          <line x1="185" y1="130" x2="185" y2="180" stroke="#ffffff" stroke-width="3" />
          <!-- Coffee Cups Graphic -->
          <rect x="135" y="195" width="20" height="30" rx="3" fill="#d97706" />
          <rect x="160" y="190" width="22" height="35" rx="3" fill="#ffffff" />
          <rect x="185" y="195" width="20" height="30" rx="3" fill="#78350f" />
        </g>

        <!-- 3. Bottom-Left: Cute Smiling Cat with Hearts Hoodie -->
        <g transform="translate(10, 420)">
          <rect x="0" y="0" width="310" height="320" rx="16" fill="#1e2229" stroke="#000" stroke-width="4" />
          <!-- Cat Peeking Graphic -->
          <ellipse cx="155" cy="220" rx="80" ry="70" fill="#ffffff" />
          <!-- Cat ears -->
          <path d="M 90 180 L 105 130 L 140 165 Z" fill="#ffffff" />
          <path d="M 220 180 L 205 130 L 170 165 Z" fill="#ffffff" />
          <path d="M 96 172 L 108 140 L 132 165 Z" fill="#f472b6" />
          <path d="M 214 172 L 202 140 L 178 165 Z" fill="#f472b6" />
          <!-- Smiling Eyes & Whiskers -->
          <path d="M 115 200 Q 130 190 140 200 M 170 200 Q 180 190 195 200" stroke="#111827" stroke-width="4" stroke-linecap="round" fill="none"/>
          <circle cx="155" cy="215" r="5" fill="#f472b6" />
          <!-- Floating Pink Hearts -->
          <path d="M 140 130 C 135 115, 115 115, 125 135 L 140 150 L 155 135 C 165 115, 145 115, 140 130 Z" fill="#ec4899" />
          <path d="M 175 120 C 170 110, 155 110, 162 125 L 175 135 L 188 125 C 195 110, 180 110, 175 120 Z" fill="#ec4899" transform="scale(0.8) translate(50, 20)" />
        </g>

        <!-- 4. Bottom-Right: Red Roses Floral Graphic Hoodie -->
        <g transform="translate(410, 420)">
          <rect x="0" y="0" width="310" height="320" rx="16" fill="#1e2229" stroke="#000" stroke-width="4" />
          <!-- Red Roses Graphic -->
          <circle cx="130" cy="180" r="35" fill="#e11d48" />
          <circle cx="175" cy="170" r="42" fill="#be123c" />
          <circle cx="160" cy="205" r="38" fill="#9f1239" />
          <!-- Leaves -->
          <path d="M 95 160 C 70 140, 110 130, 120 150 Z" fill="#15803d" />
          <path d="M 210 160 C 235 140, 205 130, 195 150 Z" fill="#15803d" />
          <path d="M 150 240 C 140 270, 180 260, 170 230 Z" fill="#16a34a" />
        </g>
      </g>
    </svg>
  `;
}

// 3. BANNER: Smart Electronics & Tech Gadgets (Gemini_Generated_Image_b7a3agb7a3agb7a3.jpg)
function generateElectronicsBannerSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
      ${SHARED_DEFS}
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#kraftPaper)" />
      <rect width="${WIDTH}" height="${HEIGHT}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="40" />

      ${renderCommonCraftElements(
        { text: "অফিসিয়াল ওয়ারেন্টি", bg: "#1e3a8a", color: "#ffffff", stitch: "rgba(255,255,255,0.6)" },
        { text: "ব্র্যান্ড ওয়ারেন্টি সহ", bg: "#e5ab37", color: "#2d1f05", width: 400 },
        "স্মার্ট ইলেকট্রনিক্স ও টেক",
        "গ্যাজেটস",
        "Gadgets &amp; Accessories",
        "স্মার্টওয়াচ, প্রিমিয়াম নয়েজ ক্যানসেলিং হেডফোন, মেকানিক্যাল",
        "কীবোর্ড এবং হাই-স্পিড ফাস্ট চার্জার।",
        "ইলেকট্রনিক্স এক্সপ্লোর করুন"
      )}

      <!-- Right Side Wooden Board with Electronics Gadgets -->
      <g filter="url(#shadow-deep)">
        <rect x="1100" y="55" width="760" height="660" rx="8" fill="url(#woodPlank)" stroke="#3e2723" stroke-width="6" />
        <line x1="1100" y1="220" x2="1860" y2="220" stroke="rgba(0,0,0,0.25)" stroke-width="3" />
        <line x1="1100" y1="440" x2="1860" y2="440" stroke="rgba(0,0,0,0.25)" stroke-width="3" />

        <!-- Over-Ear ANC Headphones (Top Left) -->
        <g transform="translate(1150, 90)" filter="url(#shadow)">
          <!-- Headband arch -->
          <path d="M 50 180 C 50 20, 270 20, 270 180" fill="none" stroke="#1e293b" stroke-width="26" stroke-linecap="round" />
          <path d="M 60 170 C 60 35, 260 35, 260 170" fill="none" stroke="#334155" stroke-width="12" stroke-linecap="round" />
          <!-- Ear cups -->
          <ellipse cx="50" cy="220" rx="35" ry="55" fill="#0f172a" stroke="#475569" stroke-width="3" />
          <ellipse cx="270" cy="220" rx="35" ry="55" fill="#0f172a" stroke="#475569" stroke-width="3" />
        </g>

        <!-- Smartwatch (Top Center) -->
        <g transform="translate(1480, 110)" filter="url(#shadow)">
          <!-- Black Silicone Strap -->
          <rect x="50" y="0" width="55" height="520" rx="8" fill="#18181b" stroke="#27272a" stroke-width="2" />
          <!-- Watch Case -->
          <rect x="30" y="180" width="95" height="120" rx="26" fill="#09090b" stroke="#71717a" stroke-width="4" />
          <!-- Active Screen Face -->
          <rect x="40" y="190" width="75" height="100" rx="18" fill="#0284c7" opacity="0.9" />
          <text x="77" y="240" font-family="'Segoe UI', sans-serif" font-weight="800" font-size="28" fill="#ffffff" text-anchor="middle">10:09</text>
          <text x="77" y="270" font-family="'Segoe UI', sans-serif" font-size="16" fill="#e0f2fe" text-anchor="middle">⚡ 85%</text>
        </g>

        <!-- Braided Cables Coil (Top Right) -->
        <g transform="translate(1640, 90)" filter="url(#shadow-soft)">
          <ellipse cx="80" cy="80" rx="70" ry="70" fill="none" stroke="#475569" stroke-width="14" stroke-dasharray="8,4" />
          <ellipse cx="80" cy="80" rx="50" ry="50" fill="none" stroke="#334155" stroke-width="14" stroke-dasharray="8,4" />
          <rect x="68" y="145" width="24" height="40" rx="4" fill="#94a3b8" />
          <rect x="74" y="185" width="12" height="20" rx="2" fill="#cbd5e1" />
        </g>

        <!-- Mechanical Keyboard (Bottom of Wood Board) -->
        <g transform="translate(1140, 480)" filter="url(#shadow)">
          <rect x="0" y="0" width="370" height="165" rx="10" fill="#334155" stroke="#1e293b" stroke-width="4" />
          <!-- Keycaps Grid -->
          <g fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5">
            <!-- Row 1 -->
            <rect x="15" y="15" width="22" height="22" rx="4" fill="#ef4444" />
            <rect x="42" y="15" width="22" height="22" rx="4" />
            <rect x="69" y="15" width="22" height="22" rx="4" />
            <rect x="96" y="15" width="22" height="22" rx="4" />
            <rect x="123" y="15" width="22" height="22" rx="4" />
            <rect x="150" y="15" width="22" height="22" rx="4" />
            <rect x="177" y="15" width="22" height="22" rx="4" />
            <rect x="204" y="15" width="22" height="22" rx="4" />
            <rect x="231" y="15" width="22" height="22" rx="4" />
            <rect x="258" y="15" width="22" height="22" rx="4" />
            <rect x="285" y="15" width="22" height="22" rx="4" />
            <rect x="312" y="15" width="42" height="22" rx="4" fill="#3b82f6" />
            <!-- Row 2 -->
            <rect x="15" y="45" width="32" height="22" rx="4" fill="#10b981" />
            <rect x="52" y="45" width="22" height="22" rx="4" />
            <rect x="79" y="45" width="22" height="22" rx="4" />
            <rect x="106" y="45" width="22" height="22" rx="4" />
            <rect x="133" y="45" width="22" height="22" rx="4" />
            <rect x="160" y="45" width="22" height="22" rx="4" />
            <rect x="187" y="45" width="22" height="22" rx="4" />
            <rect x="214" y="45" width="22" height="22" rx="4" />
            <rect x="241" y="45" width="22" height="22" rx="4" />
            <rect x="268" y="45" width="22" height="22" rx="4" />
            <rect x="295" y="45" width="59" height="22" rx="4" fill="#eab308" />
            <!-- Row 3 -->
            <rect x="15" y="75" width="42" height="22" rx="4" />
            <rect x="62" y="75" width="22" height="22" rx="4" />
            <rect x="89" y="75" width="22" height="22" rx="4" />
            <rect x="116" y="75" width="22" height="22" rx="4" />
            <rect x="143" y="75" width="22" height="22" rx="4" />
            <rect x="170" y="75" width="22" height="22" rx="4" />
            <rect x="197" y="75" width="22" height="22" rx="4" />
            <rect x="224" y="75" width="22" height="22" rx="4" />
            <rect x="251" y="75" width="22" height="22" rx="4" />
            <rect x="278" y="75" width="76" height="22" rx="4" fill="#06b6d4" />
            <!-- Spacebar Row -->
            <rect x="15" y="105" width="35" height="22" rx="4" />
            <rect x="55" y="105" width="35" height="22" rx="4" />
            <rect x="95" y="105" width="160" height="22" rx="4" fill="#f8fafc" />
            <rect x="260" y="105" width="30" height="22" rx="4" />
            <rect x="295" y="105" width="59" height="22" rx="4" fill="#ef4444" />
          </g>
        </g>

        <!-- Braided Cable Coil Bottom -->
        <g transform="translate(1640, 480)" filter="url(#shadow-soft)">
          <ellipse cx="80" cy="80" rx="75" ry="75" fill="none" stroke="#475569" stroke-width="14" stroke-dasharray="8,4" />
          <ellipse cx="80" cy="80" rx="55" ry="55" fill="none" stroke="#334155" stroke-width="14" stroke-dasharray="8,4" />
        </g>
      </g>
    </svg>
  `;
}

// 4. BANNER: Groceries & Pure Food (Gemini_Generated_Image_p2tss3p2tss3p2ts.jpg)
function generateGroceriesBannerSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
      ${SHARED_DEFS}
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#kraftPaper)" />
      <rect width="${WIDTH}" height="${HEIGHT}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="40" />

      ${renderCommonCraftElements(
        { text: "১০০% খাঁটি ও অর্গানিক", bg: "#78350f", color: "#ffffff", stitch: "rgba(255,255,255,0.6)" },
        { text: "ন্যায্য মূল্য ও টাটকা", bg: "#e5ab37", color: "#2d1f05", width: 400 },
        "স্বাস্থ্যসম্মত খাঁটি খাদ্য",
        "ও মুদি পণ্য",
        "Pure Groceries &amp; Essentials",
        "ঘানি-ভাঙা খাঁটি সরিষার তেল, সুন্দরবনের প্রাকৃতিক চাকের মধু,",
        "সুগন্ধি চিনিগুঁড়া চাল ও আসল গাওয়া ঘি।",
        "মুদি পণ্য দেখুন"
      )}

      <!-- Right Side Wooden Board with Pure Groceries Products -->
      <g filter="url(#shadow-deep)">
        <rect x="1100" y="55" width="760" height="660" rx="8" fill="url(#woodPlank)" stroke="#3e2723" stroke-width="6" />
        <line x1="1100" y1="220" x2="1860" y2="220" stroke="rgba(0,0,0,0.25)" stroke-width="3" />
        <line x1="1100" y1="440" x2="1860" y2="440" stroke="rgba(0,0,0,0.25)" stroke-width="3" />

        <!-- 1. Cold Pressed Mustard Oil Bottle (Left) -->
        <g transform="translate(1160, 100)" filter="url(#shadow)">
          <!-- Glass Bottle Body with Golden Oil -->
          <path d="M 60 70 L 60 120 L 15 200 L 15 500 Q 15 520 35 520 L 125 520 Q 145 520 145 500 L 145 200 L 100 120 L 100 70 Z" fill="#d97706" opacity="0.9" stroke="#92400e" stroke-width="4" />
          <!-- Bottle Neck & Cork -->
          <rect x="65" y="45" width="30" height="25" fill="#fef3c7" stroke="#b45309" stroke-width="2" />
          <rect x="60" y="25" width="40" height="20" rx="3" fill="#b45309" />
          <!-- Label: খাঁটি সরিষার তেল -->
          <rect x="30" y="260" width="100" height="140" rx="6" fill="#fef3c7" stroke="#b45309" stroke-width="2" />
          <text x="80" y="320" font-family="'Noto Sans Bengali', sans-serif" font-weight="bold" font-size="20" fill="#78350f" text-anchor="middle">খাঁটি</text>
          <text x="80" y="350" font-family="'Noto Sans Bengali', sans-serif" font-weight="bold" font-size="20" fill="#78350f" text-anchor="middle">সরিষার তেল</text>
        </g>

        <!-- 2. Pure Sundarbans Honey Jar (Top Center) -->
        <g transform="translate(1480, 85)" filter="url(#shadow)">
          <!-- Jar Body -->
          <path d="M 25 80 Q 0 100 0 180 Q 0 260 25 280 L 175 280 Q 200 260 200 180 Q 200 100 175 80 Z" fill="#b45309" stroke="#78350f" stroke-width="4" />
          <!-- Honey Golden Glow -->
          <ellipse cx="100" cy="180" rx="70" ry="60" fill="#f59e0b" opacity="0.6" />
          <!-- Burlap Lid Cloth & Twine -->
          <path d="M 15 65 C 15 40, 185 40, 185 65 L 195 90 C 170 100, 30 100, 5 90 Z" fill="#d4af37" stroke="#92400e" stroke-width="2" />
          <line x1="10" y1="85" x2="190" y2="85" stroke="#78350f" stroke-width="4" stroke-dasharray="6,3" />
          <!-- Wooden Honey Dipper -->
          <g transform="translate(180, 100) rotate(35)">
            <rect x="0" y="0" width="14" height="180" rx="6" fill="#d97706" />
            <circle cx="7" cy="170" r="16" fill="#b45309" />
            <line x1="-5" y1="162" x2="19" y2="162" stroke="#78350f" stroke-width="3" />
            <line x1="-5" y1="170" x2="19" y2="170" stroke="#78350f" stroke-width="3" />
            <line x1="-5" y1="178" x2="19" y2="178" stroke="#78350f" stroke-width="3" />
          </g>
        </g>

        <!-- 3. Surlap Sack of Aromatic Chinigura Rice (Bottom Center) -->
        <g transform="translate(1330, 420)" filter="url(#shadow)">
          <path d="M 20 60 C 0 140, 20 230, 60 230 L 170 230 C 210 230, 230 140, 210 60 C 180 80, 50 80, 20 60 Z" fill="#d7b899" stroke="#8c6239" stroke-width="4" />
          <!-- White Rice mound top -->
          <ellipse cx="115" cy="65" rx="85" ry="40" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
          <text x="115" y="160" font-family="'Noto Sans Bengali', sans-serif" font-weight="bold" font-size="22" fill="#78350f" text-anchor="middle">সুগন্ধি চিনিগুঁড়া চাল</text>
        </g>

        <!-- 4. Terracotta Clay Bowl of Golden Ghee (Bottom Right) -->
        <g transform="translate(1590, 420)" filter="url(#shadow)">
          <!-- Clay Bowl -->
          <ellipse cx="105" cy="70" rx="95" ry="40" fill="#ca8a04" />
          <path d="M 10 70 C 15 160, 195 160, 200 70 Z" fill="#c2410c" stroke="#7c2d12" stroke-width="4" />
          <!-- Golden Artisan Ghee -->
          <ellipse cx="105" cy="70" rx="80" ry="32" fill="#fde047" stroke="#eab308" stroke-width="2" />
          <!-- Wooden Spoon in Ghee -->
          <path d="M 105 70 L 170 10 Q 185 0 195 10 L 180 30 Z" fill="#9a3412" />
          <text x="105" y="130" font-family="'Noto Sans Bengali', sans-serif" font-weight="bold" font-size="22" fill="#ffffff" text-anchor="middle">গাওয়া ঘি</text>
        </g>
      </g>
    </svg>
  `;
}

// 5. BANNER: All Products / Everything Store (Gemini_Generated_Image_vxjgo9vxjgo9vxjg.jpg)
function generateAllProductsBannerSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
      ${SHARED_DEFS}
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#kraftPaper)" />
      <rect width="${WIDTH}" height="${HEIGHT}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="40" />

      ${renderCommonCraftElements(
        { text: "নিরাপদ কেনাকাটা", bg: "#1e3a24", color: "#ffffff", stitch: "rgba(255,255,255,0.6)" },
        { text: "ক্যাশ অন ডেলিভারি সুবিধা", bg: "#e5ab37", color: "#2d1f05", width: 440 },
        "সব ধরনের পণ্যের বিশ্বস্ত",
        "বাজার",
        "Nirapod Kroy (নিরাপদ ক্রয়)",
        "মুদি ও অর্গানিক খাদ্যপণ্য, লেটেস্ট গ্যাজেট, পোশাক, রূপচর্চা থেকে",
        "গৃহস্থালি সামগ্রী — আসল পণ্যের ১০০% নিশ্চয়তা।",
        "সব পণ্য দেখুন (Shop All)"
      )}

      <!-- Right Side Wooden Board with Variety Showcase -->
      <g filter="url(#shadow-deep)">
        <rect x="1100" y="55" width="760" height="660" rx="8" fill="url(#woodPlank)" stroke="#3e2723" stroke-width="6" />
        <line x1="1100" y1="220" x2="1860" y2="220" stroke="rgba(0,0,0,0.25)" stroke-width="3" />
        <line x1="1100" y1="440" x2="1860" y2="440" stroke="rgba(0,0,0,0.25)" stroke-width="3" />

        <!-- 1. Farm Fresh Vegetables Basket (Top Left) -->
        <g transform="translate(1140, 80)" filter="url(#shadow)">
          <!-- Woven Basket -->
          <ellipse cx="140" cy="180" rx="130" ry="50" fill="#a47551" stroke="#684729" stroke-width="4" />
          <path d="M 10 180 C 20 280, 260 280, 270 180 Z" fill="#8c5836" stroke="#5a381f" stroke-width="4" />
          <!-- Red Tomatoes -->
          <circle cx="100" cy="170" r="32" fill="#ef4444" stroke="#991b1b" stroke-width="2" />
          <circle cx="150" cy="160" r="34" fill="#dc2626" stroke="#991b1b" stroke-width="2" />
          <circle cx="190" cy="175" r="30" fill="#ef4444" stroke="#991b1b" stroke-width="2" />
          <!-- Green leafy herbs -->
          <path d="M 130 140 C 110 90, 160 90, 150 135 Z" fill="#22c55e" stroke="#15803d" stroke-width="2" />
          <path d="M 160 130 C 150 80, 200 80, 180 130 Z" fill="#16a34a" stroke="#15803d" stroke-width="2" />
        </g>

        <!-- 2. Lentils / Dal Pouches (Top Right) -->
        <g transform="translate(1450, 100)" filter="url(#shadow-soft)">
          <!-- Red Lentil (মসুর ডাল) Pouch -->
          <rect x="0" y="0" width="160" height="210" rx="8" fill="#f59e0b" opacity="0.9" stroke="#b45309" stroke-width="3" />
          <rect x="25" y="40" width="110" height="120" rx="4" fill="#ef4444" stroke="#991b1b" stroke-width="1.5" />
          <text x="80" y="105" font-family="'Noto Sans Bengali', sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">মসুর ডাল</text>
        </g>

        <!-- 3. Over-Ear Headphones (Top Right Corner) -->
        <g transform="translate(1640, 100)" filter="url(#shadow-soft)">
          <path d="M 20 140 C 20 40, 160 40, 160 140" fill="none" stroke="#64748b" stroke-width="18" stroke-linecap="round" />
          <ellipse cx="20" cy="160" rx="25" ry="40" fill="#334155" />
          <ellipse cx="160" cy="160" rx="25" ry="40" fill="#334155" />
        </g>

        <!-- 4. Folded Artisan Saree Cloth (Bottom Left) -->
        <g transform="translate(1140, 400)" filter="url(#shadow)">
          <rect x="0" y="0" width="180" height="240" rx="8" fill="#fef3c7" stroke="#b45309" stroke-width="2.5" />
          <rect x="10" y="10" width="160" height="35" fill="#047857" />
          <text x="90" y="34" font-family="'Noto Sans Bengali', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">সুতি শাড়ি</text>
        </g>

        <!-- 5. Gadget: Smart Power Bank / Tablet (Bottom Center) -->
        <g transform="translate(1360, 430)" filter="url(#shadow)">
          <rect x="0" y="0" width="150" height="200" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4" />
          <rect x="15" y="15" width="120" height="170" rx="8" fill="#0f172a" />
          <circle cx="75" cy="100" r="28" fill="#38bdf8" opacity="0.8" />
        </g>

        <!-- 6. Herbal Skincare Tube (Bottom Right) -->
        <g transform="translate(1560, 390)" filter="url(#shadow)">
          <path d="M 20 20 L 70 20 L 80 180 L 10 180 Z" fill="#a7f3d0" stroke="#059669" stroke-width="3" />
          <rect x="25" y="180" width="40" height="25" rx="3" fill="#065f46" />
          <text x="45" y="100" font-family="'Noto Sans Bengali', sans-serif" font-size="16" font-weight="bold" fill="#065f46" text-anchor="middle">রূপচর্চা</text>
        </g>
      </g>
    </svg>
  `;
}

async function buildAllBanners() {
  console.log("Generating all 5 handmade/graphic banner assets...");
  
  const banners = [
    {
      name: "banner_all_products",
      userUploadName: "Gemini_Generated_Image_vxjgo9vxjgo9vxjg.jpg",
      svg: generateAllProductsBannerSvg()
    },
    {
      name: "banner_fashion_lifestyle",
      userUploadName: "AI_creating_handmade_look_design_2K_20260926100408.jpg",
      svg: generateFashionBannerSvg()
    },
    {
      name: "banner_hoodie_collection",
      userUploadName: "Gemini_Generated_Image_8nkgr78nkgr78nkg.jpg",
      svg: generateHoodieBannerSvg()
    },
    {
      name: "banner_electronics_gadgets",
      userUploadName: "Gemini_Generated_Image_b7a3agb7a3agb7a3.jpg",
      svg: generateElectronicsBannerSvg()
    },
    {
      name: "banner_groceries_essentials",
      userUploadName: "Gemini_Generated_Image_p2tss3p2tss3p2ts.jpg",
      svg: generateGroceriesBannerSvg()
    }
  ];

  const targetDirs = [
    "./public/images/banners",
    "./images/banners",
    "./docs/images/banners",
    "./dist/images/banners"
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  for (const b of banners) {
    const svgPath = `./public/images/banners/${b.name}.svg`;
    fs.writeFileSync(svgPath, b.svg, "utf-8");
    console.log(`Saved SVG: ${svgPath}`);

    // Convert SVG to High Quality JPEG with Sharp
    const jpgBuffer = await sharp(Buffer.from(b.svg))
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    for (const dir of targetDirs) {
      // 1. Save standard clean name
      fs.writeFileSync(`${dir}/${b.name}.jpg`, jpgBuffer);
      // 2. Save matching the user's exact uploaded file name
      fs.writeFileSync(`${dir}/${b.userUploadName}`, jpgBuffer);
    }

    // Also write directly in public/ and root so `/AI_creating_...` direct fetches resolve 100%
    fs.writeFileSync(`./public/${b.userUploadName}`, jpgBuffer);
    fs.writeFileSync(`./dist/${b.userUploadName}`, jpgBuffer);
    console.log(`Rendered JPG for ${b.name} and ${b.userUploadName}`);
  }

  console.log("All 5 banner designs generated successfully!");
}

buildAllBanners().catch(err => {
  console.error("Error generating banners:", err);
  process.exit(1);
});
