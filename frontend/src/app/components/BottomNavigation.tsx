import React from 'react';
import { Home, Pill, Calendar, FileText, User } from 'lucide-react';
import { Screen } from '../App';
import { LiquidGlass } from './ui/LiquidGlass';

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
    <LiquidGlass
      className="border-t border-white/30 shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
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
                  ? 'text-emerald-700 bg-white/40 shadow-lg backdrop-blur-sm' 
                  : 'text-slate-600 hover:text-emerald-600 hover:bg-white/20'
              }`}
            >
              <Icon className={`w-7 h-7 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-xs font-semibold ${isActive ? 'text-emerald-700' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </LiquidGlass>
  );
}