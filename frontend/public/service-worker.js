// ============ SERVICE WORKER FOR ELDERCARE+ ============
// This file handles background notifications and push events

const CACHE_NAME = 'eldercare-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// ============ INSTALL EVENT ============
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(error => console.log('Cache error:', error))
  );
  self.skipWaiting();
});

// ============ ACTIVATE EVENT ============
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ============ FETCH EVENT - NETWORK FIRST STRATEGY ============
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // API requests - network only
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'application/json' })
        }))
    );
    return;
  }

  // Static assets - cache first, fallback to network
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .then(response => {
        if (!response || response.status === 404) {
          return caches.match('/index.html');
        }
        return response;
      })
      .catch(() => caches.match('/index.html'))
  );
});

// ============ PUSH NOTIFICATION EVENT ============
self.addEventListener('push', event => {
  try {
    const data = event.data ? event.data.json() : {};
    
    const options = {
      body: data.notification?.body || 'New notification from ElderCare+',
      icon: data.notification?.icon || '/icon-192x192.png',
      badge: data.notification?.badge || '/badge-72x72.png',
      tag: data.data?.type || 'notification',
      requireInteraction: data.data?.type === 'emergency-sos',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/badge-72x72.png'
        }
      ]
    };

    // Emergency SOS requires immediate user attention
    if (data.data?.type === 'emergency-sos') {
      options.requireInteraction = true;
      options.tag = 'emergency-sos';
    }

    event.waitUntil(
      self.registration.showNotification(
        data.notification?.title || 'ElderCare+',
        options
      )
    );
  } catch (error) {
    console.error('Error handling push:', error);
  }
});

// ============ NOTIFICATION CLICK EVENT ============
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const urlToOpen = '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // Check if app is already open
      for (let client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not open, open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ============ NOTIFICATION CLOSE EVENT ============
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event.notification.tag);
});

// ============ BACKGROUND SYNC FOR OFFLINE SUPPORT ============
self.addEventListener('sync', event => {
  if (event.tag === 'sync-medicine-confirmation') {
    event.waitUntil(
      syncMedicineConfirmation()
    );
  }
  if (event.tag === 'sync-push-subscription') {
    event.waitUntil(
      syncPushSubscription()
    );
  }
});

async function syncMedicineConfirmation() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(['pendingConfirmations']);
    const store = tx.objectStore('pendingConfirmations');
    const items = await store.getAll();

    for (const item of items) {
      await fetch('/api/medicines/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(item)
      });
    }

    store.clear();
  } catch (error) {
    console.error('Sync failed, will retry:', error);
    throw error;
  }
}

async function syncPushSubscription() {
  try {
    const subscription = await self.registration.pushManager.getSubscription();
    if (subscription) {
      await fetch('/api/auth/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ subscription })
      });
    }
  } catch (error) {
    console.error('Subscription sync failed:', error);
    throw error;
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ElderCareDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingConfirmations')) {
        db.createObjectStore('pendingConfirmations', { autoIncrement: true });
      }
    };
  });
}

console.log('Service Worker: Loaded and active');
