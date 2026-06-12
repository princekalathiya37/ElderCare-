// ============ PUSH NOTIFICATION SERVICE ============
// Frontend service to handle push notifications and browser integration

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.isSupported = this.checkSupport();
    this.token = localStorage.getItem('authToken');
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  // Check if push notifications are supported
  checkSupport() {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  // Initialize service worker and push notifications
  async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registered');

      // Request notification permission
      if (Notification.permission === 'default') {
        await this.requestPermission();
      }

      // Subscribe to push notifications
      await this.subscribeToPush();

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribeToPush() {
    try {
      if (!this.registration) {
        console.warn('Service Worker not registered');
        return null;
      }

      const subscription = await this.registration.pushManager.getSubscription();

      if (subscription) {
        console.log('Already subscribed to push');
        await this.savePushSubscriptionToBackend(subscription);
        return subscription;
      }

      // Create new subscription
      const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY || '';
      if (!vapidPublicKey) {
        console.warn('VAPID key not configured');
        return null;
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('✅ Subscribed to push notifications');
      await this.savePushSubscriptionToBackend(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  // Save subscription to backend
  async savePushSubscriptionToBackend(subscription) {
    try {
      if (!this.token) {
        console.warn('No auth token available');
        return;
      }

      const response = await fetch(`${this.apiBaseUrl}/auth/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      if (response.ok) {
        console.log('✅ Push subscription saved to backend');
      } else {
        console.error('Failed to save subscription:', response.statusText);
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeToPush() {
    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');
        return true;
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }

  // Convert VAPID key
  urlBase64ToUint8Array(base64String) {
    try {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      return outputArray;
    } catch (error) {
      console.error('Error converting VAPID key:', error);
      return null;
    }
  }

  // Handle incoming message from service worker
  setupMessageListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        const { type, data } = event.data;

        switch (type) {
          case 'medicine-reminder':
            this.handleMedicineReminder(data);
            break;
          case 'escalation-alert':
            this.handleEscalationAlert(data);
            break;
          case 'emergency-sos':
            this.handleEmergencySOS(data);
            break;
          default:
            console.log('Unknown message type:', type);
        }
      });
    }
  }

  handleMedicineReminder(data) {
    console.log('Medicine reminder received:', data);
    window.dispatchEvent(new CustomEvent('medicine-reminder', { detail: data }));
  }

  handleEscalationAlert(data) {
    console.log('Escalation alert received:', data);
    window.dispatchEvent(new CustomEvent('escalation-alert', { detail: data }));
  }

  handleEmergencySOS(data) {
    console.log('Emergency SOS received:', data);
    window.dispatchEvent(new CustomEvent('emergency-sos', { detail: data }));
  }
}

export default PushNotificationService;
