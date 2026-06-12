// ============ UPDATED APP.TSX FOR PUSH NOTIFICATIONS ============
// Add this import at the top
import PushNotificationService from './services/pushNotificationService';
import apiService from './services/apiService';

// Add this useEffect in your App component
useEffect(() => {
  const initializePushNotifications = async () => {
    try {
      const pushService = new PushNotificationService();
      
      // Initialize push notifications
      if (pushService.isSupported) {
        const initialized = await pushService.initialize();
        if (initialized) {
          console.log('✅ Push notifications initialized');
          
          // Setup message listeners
          pushService.setupMessageListener();
          
          // Listen for custom events
          window.addEventListener('medicine-reminder', (event) => {
            console.log('Medicine reminder:', event.detail);
            // Show toast or update UI
          });
          
          window.addEventListener('escalation-alert', (event) => {
            console.log('Escalation alert:', event.detail);
          });
          
          window.addEventListener('emergency-sos', (event) => {
            console.log('Emergency SOS:', event.detail);
          });
        }
      } else {
        console.warn('Push notifications not supported on this device');
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  };

  if (authToken) {
    initializePushNotifications();
  }
}, [authToken]);

// ============ UPDATE MEDICINE LIST SCREEN ============
// Modify MedicineListScreen.tsx to use backend API

import apiService from '../services/apiService';

export function MedicineListScreen({ onNavigate }: MedicineListScreenProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTodaysMedicines();
      if (data.success) {
        setMedicines(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const markTaken = async (medicineId: number, time: string) => {
    try {
      const result = await apiService.confirmMedicineTaken(medicineId, time);
      if (result.success) {
        toast.success('Medicine marked as taken!');
        fetchMedicines();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm');
    }
  };

  // ... rest of the component
}

// ============ UPDATE EMERGENCY SOS SCREEN ============
// Modify EmergencySOSScreen.tsx to use backend API

export function EmergencySOSScreen({ onNavigate }: EmergencySOSScreenProps) {
  const [isActivated, setIsActivated] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [location, setLocation] = useState('Getting location...');
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          resolve({ latitude, longitude, address: 'Current Location' });
        },
        (error) => {
          console.error('Location error:', error);
          reject(error);
        }
      );
    });
  };

  const handleSOSPress = async () => {
    setLoading(true);
    try {
      const location = await getLocation();
      
      // Call backend API
      const result = await apiService.triggerEmergencySOS(location);
      
      if (result.success) {
        setIsActivated(true);
        setCountdown(5);
        toast.success(`Emergency SOS triggered! ${result.notifiedContacts} contacts notified`);
      }
    } catch (error) {
      toast.error('Failed to trigger SOS');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component
}

// ============ UPDATE LOGIN SCREEN ============
// Add token saving after login

export function LoginScreen({ onNavigate }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await apiService.login(email, password);
      
      if (result.success && result.token) {
        // Token is saved in apiService
        localStorage.setItem('authToken', result.token);
        
        // Initialize push notifications
        const pushService = new PushNotificationService();
        await pushService.initialize();
        
        toast.success('Login successful!');
        onNavigate('home');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component
}

// ============ MANIFEST.JSON (Web App Config) ============
// Add this file in public/manifest.json

export const manifestJson = {
  "name": "ElderCare+ - Medicine & Health Companion",
  "short_name": "ElderCare+",
  "description": "Daily medicine reminders, emergency SOS, and caregiver alerts",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#059669",
  "icons": [
    {
      "src": "/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/badge-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "badge"
    }
  ],
  "categories": ["health", "medical"],
  "screenshots": [
    {
      "src": "/screenshot1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot2.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
};
