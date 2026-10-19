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
      className="border-t border-white/40 shadow-2xl"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div className="flex items-center justify-around py-1.5 px-1 sm:py-2.5 sm:px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-2.5 sm:px-3.5 rounded-2xl transition-all duration-300 min-w-[54px] ${
                isActive 
                  ? 'text-emerald-700 bg-white/50 shadow-md backdrop-blur-sm font-bold' 
                  : 'text-slate-600 hover:text-emerald-600 hover:bg-white/20 font-medium'
              }`}
            >
              <Icon className={`w-6 h-6 sm:w-7 sm:h-7 mb-0.5 transition-transform duration-300 ${isActive ? 'scale-110 text-emerald-600' : ''}`} />
              <span className={`text-[11px] sm:text-xs leading-tight tracking-tight ${isActive ? 'text-emerald-700' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </LiquidGlass>
  );
}