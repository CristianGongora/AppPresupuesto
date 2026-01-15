const CACHE_NAME = 'finanzas-v1';
const ASSETS = [
    './',
    './index.html',
    './styles/styles.css',
    './js/app.js',
    './js/ui.js',
    './js/state.js',
    './analytics.js', // (Si existe archivo suelto)
    './icon.svg',
    './js/charts.js',
    'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
