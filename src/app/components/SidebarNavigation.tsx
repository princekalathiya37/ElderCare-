
import React from 'react';
import { Home, Pill, Calendar, FileText, User, HeartPulse } from 'lucide-react';
import { Screen } from '../App';

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
    <div className="flex flex-col h-full p-6 gap-2 bg-gradient-to-b from-emerald-50 to-white border-r-2 border-emerald-100">
      {/* Logo/Header */}
      <div className="mb-8 px-2 flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
          <HeartPulse className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          ElderCare+
        </h1>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 w-full text-left ${
                isActive 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' 
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <Icon className="w-7 h-7" />
              <span className="text-lg font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
