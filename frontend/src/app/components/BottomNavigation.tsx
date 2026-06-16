import React from 'react';
import { Home, Pill, Calendar, FileText, User } from 'lucide-react';
import { Screen } from '../App';

interface BottomNavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNavigation({ currentScreen, onNavigate }: BottomNavigationProps) {
  const navItems = [
    { id: 'home' as Screen, icon: Home, label: 'Home' },
    { id: 'medicines' as Screen, icon: Pill, label: 'Medicines' },
    { id: 'appointments' as Screen, icon: Calendar, label: 'Appointments' },
    { id: 'calendar' as Screen, icon: Calendar, label: 'Analytics' },
    { id: 'profile' as Screen, icon: User, label: 'Profile' },
  ];

  return (
    <div className="bg-white/95 backdrop-blur-lg border-t-2 border-emerald-100 shadow-2xl" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around py-2 px-2 sm:py-3 sm:px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <Icon className="w-8 h-8 mb-1" />
              <span className="text-sm font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}