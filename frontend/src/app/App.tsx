
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID, IS_GOOGLE_AUTH_ENABLED } from './config';
import { GoogleLoginSection } from './components/GoogleLoginSection';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { HomeScreen } from './components/HomeScreen';
import { MedicineListScreen } from './components/MedicineListScreen';
import { AddMedicineScreen } from './components/AddMedicineScreen';
import { AppointmentsScreen } from './components/AppointmentsScreen';
import { AddAppointmentScreen } from './components/AddAppointmentScreen';
import { MedicalRecordsScreen } from './components/MedicalRecordsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { EmergencySOSScreen } from './components/EmergencySOSScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { SidebarNavigation } from './components/SidebarNavigation';
import { CalendarAnalyticsScreen } from './components/CalendarAnalyticsScreen';
import { NotificationSettingsScreen } from './components/NotificationSettingsScreen';
import { HelpSupportScreen } from './components/HelpSupportScreen';
import { PrivacySecurityScreen } from './components/PrivacySecurityScreen';
import { TermsScreen } from './components/TermsScreen';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Checkbox } from './components/ui/checkbox';
import { BlackFireCursorTrail } from './components/ui/BlackFireCursorTrail';
import apiService from './services/apiService';
import {
  AlertCircle,
  CheckCircle,
  HeartPulse,
  UserRound,
  Home,
  Pill,
  Calendar,
  User,
  LogOut,
  Settings,
  Activity,
  X,
  ArrowLeft,
} from 'lucide-react';

export type Screen =
  | 'login'
  | 'register'
  | 'home'
  | 'medicines'
  | 'add-medicine'
  | 'appointments'
  | 'add-appointment'
  | 'records'
  | 'profile'
  | 'sos'
  | 'calendar'
  | 'notifications'
  | 'help'
  | 'privacy'
  | 'terms';

// Missing icons
function Eye({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function ElderApp({ onLogout, onBack, isRegister = false }: { onLogout: () => void; onBack: () => void; isRegister?: boolean }) {
  const getInitialScreen = (): Screen => {
    const token = localStorage.getItem('authToken');
    const hash = window.location.hash.replace('#', '') as Screen;
    const validScreens: Screen[] = [
      'login', 'register', 'home', 'medicines', 'add-medicine', 
      'appointments', 'add-appointment', 'records', 'profile', 
      'sos', 'calendar', 'notifications', 'help', 'privacy', 'terms'
    ];
    const hashScreen = validScreens.includes(hash) ? hash : null;

    if (token) {
      if (hashScreen && hashScreen !== 'login' && hashScreen !== 'register') {
        return hashScreen;
      }
      return 'home';
    } else {
      if (hashScreen === 'register') {
        return 'register';
      }
      return 'login';
    }
  };

  const [currentScreen, setCurrentScreen] = useState<Screen>(getInitialScreen);
  const [transitionKey, setTransitionKey] = useState(0);
  const [isAgeMissing, setIsAgeMissing] = useState(false);

  useEffect(() => {
    // Set initial hash
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = currentScreen;
    }

    const handleHashChange = () => {
      const token = localStorage.getItem('authToken');
      const hash = window.location.hash.replace('#', '') as Screen;
      const validScreens: Screen[] = [
        'login', 'register', 'home', 'medicines', 'add-medicine', 
        'appointments', 'add-appointment', 'records', 'profile', 
        'sos', 'calendar', 'notifications', 'help', 'privacy', 'terms'
      ];
      
      const targetScreen = validScreens.includes(hash) ? hash : (token ? 'home' : 'login');
      
      if (token) {
        if (targetScreen === 'login' || targetScreen === 'register') {
          // Keep user logged in, redirect away from login/register
          setCurrentScreen('home');
          window.location.hash = 'home';
        } else {
          setCurrentScreen(targetScreen);
        }
      } else {
        if (targetScreen !== 'login' && targetScreen !== 'register') {
          // Non-logged-in users must be on login or register screen
          setCurrentScreen('login');
          window.location.hash = 'login';
        } else {
          setCurrentScreen(targetScreen);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Sync if URL is loaded directly with hash mismatch
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && currentScreen !== 'login' && currentScreen !== 'register') {
      apiService.getUserProfile()
        .then(res => {
          if (res.success && res.user) {
            if (!res.user.age || res.user.age === 0) {
              setIsAgeMissing(true);
              if (currentScreen !== 'profile') {
                toast.error('Please complete your profile by entering your age.');
                setCurrentScreen('profile');
                window.location.hash = 'profile';
              }
            } else {
              setIsAgeMissing(false);
            }
          }
        })
        .catch(err => {
          console.error('Failed to verify profile age:', err);
          // Only force logout for genuine auth errors (expired/invalid token),
          // NOT for transient network errors or backend cold starts
          const errorMsg = err?.message?.toLowerCase() || '';
          if (errorMsg.includes('invalid token') || errorMsg.includes('no token') || errorMsg.includes('unauthorized') || errorMsg.includes('jwt') || errorMsg.includes('401')) {
            localStorage.removeItem('authToken');
            apiService.token = null;
            handleNavigate('login');
            toast.error('Session expired or invalid. Please sign in again.');
          } else {
            console.warn('Profile check failed (non-auth error), keeping session:', err.message);
          }
        });
    } else {
      setIsAgeMissing(false);
    }
  }, [currentScreen]);

  const handleNavigate = (screen: Screen) => {
    setTransitionKey(prev => prev + 1);
    setCurrentScreen(screen);
    window.location.hash = screen;
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onNavigate={handleNavigate} onBack={onBack} />;
      case 'register':
        return <RegisterScreen onNavigate={handleNavigate} />;
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'medicines':
        return <MedicineListScreen onNavigate={handleNavigate} />;
      case 'add-medicine':
        return <AddMedicineScreen onNavigate={handleNavigate} />;
      case 'appointments':
        return <AppointmentsScreen onNavigate={handleNavigate} />;
      case 'add-appointment':
        return <AddAppointmentScreen onNavigate={handleNavigate} />;
      case 'records':
        return <MedicalRecordsScreen onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} />;
      case 'sos':
        return <EmergencySOSScreen onNavigate={handleNavigate} />;
      case 'calendar':
        return <CalendarAnalyticsScreen onNavigate={handleNavigate} />;
      case 'notifications':
        return <NotificationSettingsScreen onNavigate={handleNavigate} />;
      case 'help':
        return <HelpSupportScreen onNavigate={handleNavigate} />;
      case 'privacy':
        return <PrivacySecurityScreen onNavigate={handleNavigate} />;
      case 'terms':
        return <TermsScreen onNavigate={handleNavigate} />;
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  const showNav =
    !isAgeMissing &&
    currentScreen !== 'login' &&
    currentScreen !== 'register' &&
    currentScreen !== 'sos' &&
    currentScreen !== 'add-medicine' &&
    currentScreen !== 'add-appointment' &&
    currentScreen !== 'notifications' &&
    currentScreen !== 'help' &&
    currentScreen !== 'privacy' &&
    currentScreen !== 'terms';

  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex mx-auto relative w-full max-w-none" style={{ width: '100%', maxWidth: '1920px' }}>
      {showNav && (
        <div className="hidden lg:flex w-80 flex-col">
          <SidebarNavigation currentScreen={currentScreen} onNavigate={handleNavigate} />
        </div>
      )}

      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div key={transitionKey} className="page-transition h-full">{renderScreen()}</div>
        </div>
        {showNav && (
          <div className="lg:hidden">
            <BottomNavigation currentScreen={currentScreen} onNavigate={handleNavigate} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const content = (
    <>
      <ElderApp onLogout={() => {}} onBack={() => {}} />
      <Toaster position="top-center" richColors />
    </>
  );

  if (IS_GOOGLE_AUTH_ENABLED) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}
