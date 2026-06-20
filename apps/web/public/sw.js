// Avukatım — minimal service worker (PWA kurulabilirliği için)
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
// Pass-through fetch handler — kurulabilirlik kriterini karşılar, ağ davranışını değiştirmez
self.addEventListener('fetch', () => {})
