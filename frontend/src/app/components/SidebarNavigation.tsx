
import React from 'react';
import { Home, Pill, Calendar, FileText, User, HeartPulse } from 'lucide-react';
import { Screen } from '../App';
import { LiquidGlass } from './ui/LiquidGlass';

interface SidebarNavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function SidebarNavigation({ currentScreen, onNavigate }: SidebarNavigationProps) {
  const navItems = [
    { id: 'home' as Screen, icon: Home, label: 'Home' },
    { id: 'medicines' as Screen, icon: Pill, label: 'Medicines' },
    { id: 'appointments' as Screen, icon: Calendar, label: 'Appointments' },
    { id: 'calendar' as Screen, icon: Calendar, label: 'Calendar & Analytics' },
    { id: 'profile' as Screen, icon: User, label: 'Profile' },
  ];

  return (
    <LiquidGlass
      className="h-full w-full"
      style={{ borderRight: '1px solid rgba(255,255,255,0.3)' }}
    >
      <div className="flex flex-col h-full p-4 xl:p-6 gap-2 overflow-y-auto">
        {/* Logo/Header */}
        <div className="mb-6 xl:mb-8 px-2 flex items-center gap-3 xl:gap-4">
          <div className="w-11 h-11 xl:w-14 xl:h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
            <HeartPulse className="w-6 h-6 xl:w-8 xl:h-8 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl xl:text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent truncate">
              ElderCare+
            </h1>
            <p className="text-xs text-slate-500 hidden xl:block">Care today, Comfort always</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-1.5 xl:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 xl:gap-4 px-3.5 xl:px-5 py-3 xl:py-4 rounded-2xl transition-all duration-300 w-full text-left ${
                  isActive 
                    ? 'bg-white/50 text-emerald-700 shadow-md backdrop-blur-sm border border-white/60 font-bold' 
                    : 'text-slate-600 hover:bg-white/25 hover:text-emerald-700 font-semibold'
                }`}
              >
                <Icon className={`w-6 h-6 xl:w-7 xl:h-7 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110 text-emerald-600' : ''}`} />
                <span className="text-sm xl:text-base truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </LiquidGlass>
  );
}
