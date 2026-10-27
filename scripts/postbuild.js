const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.html');

console.log('[PWA Build] Enhancing dist/ for Progressive Web App (PWA)...');

// 1. Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 2. Write manifest.json to dist
const manifest = {
  name: 'AttendIQ - GGU Smart Attendance',
  short_name: 'AttendIQ',
  description: 'Smart Attendance Management System for Guru Ghasidas Vishwavidyalaya',
  start_url: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0F172A',
  theme_color: '#0F172A',
  icons: [
    {
      src: '/icon.png',
      sizes: '192x192 512x512',
      type: 'image/png',
      purpose: 'any maskable',
    },
  ],
};
fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('✓ Created dist/manifest.json');

// 3. Write sw.js to dist
const serviceWorker = `// AttendIQ PWA Service Worker
const CACHE_NAME = 'attendiq-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
`;
fs.writeFileSync(path.join(distDir, 'sw.js'), serviceWorker, 'utf8');
console.log('✓ Created dist/sw.js');

// 4. Copy icon.png to dist
const iconSrc = path.join(rootDir, 'assets', 'icon.png');
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, path.join(distDir, 'icon.png'));
  console.log('✓ Copied assets/icon.png -> dist/icon.png');
}

// 5. Inject PWA tags into dist/index.html
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');

  // Insert PWA meta & manifest links if not present
  if (!html.includes('rel="manifest"')) {
    const pwaHeadTags = `
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#0F172A" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="AttendIQ" />
    <link rel="apple-touch-icon" href="/icon.png" />
`;
    html = html.replace('</head>', `${pwaHeadTags}</head>`);
  }

  // Insert Service Worker registration if not present
  if (!html.includes('serviceWorker.register')) {
    const swScript = `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').catch(function() {});
      });
    }
  </script>
`;
    html = html.replace('</body>', `${swScript}</body>`);
  }

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✓ Injected PWA tags & Service Worker into dist/index.html');
}

console.log('[PWA Build] Completed successfully!');
