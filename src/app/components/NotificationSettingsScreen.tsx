import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Bell, BellOff, Pill, Calendar, AlertTriangle, BarChart3, Loader, Save } from 'lucide-react';
import { Screen } from '../App';
import apiService from '../services/apiService';
import { toast } from 'sonner';

interface NotificationSettingsScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Prefs {
  medicineReminders: boolean;
  appointmentReminders: boolean;
  sosAlerts: boolean;
  dailyHealthSummary: boolean;
}

export function NotificationSettingsScreen({ onNavigate }: NotificationSettingsScreenProps) {
  const [prefs, setPrefs] = useState<Prefs>({
    medicineReminders: true,
    appointmentReminders: true,
    sosAlerts: true,
    dailyHealthSummary: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiService.getUserProfile();
        if (response.success && response.user?.notificationPreferences) {
          setPrefs(response.user.notificationPreferences);
        }
      } catch (e) {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = (key: keyof Prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateNotificationPreferences(prefs);
      toast.success('Notification preferences saved!');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const settings = [
    {
      key: 'medicineReminders' as keyof Prefs,
      icon: Pill,
      title: 'Medicine Reminders',
      description: 'Get notified when it\'s time to take your medicines',
      color: 'from-emerald-400 to-teal-500',
      bg: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200'
    },
    {
      key: 'appointmentReminders' as keyof Prefs,
      icon: Calendar,
      title: 'Appointment Reminders',
      description: 'Receive reminders 24 hours before your doctor appointments',
      color: 'from-blue-400 to-indigo-500',
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-200'
    },
    {
      key: 'sosAlerts' as keyof Prefs,
      icon: AlertTriangle,
      title: 'SOS Alerts',
      description: 'Emergency alerts and notifications from caretakers',
      color: 'from-red-400 to-rose-500',
      bg: 'from-red-50 to-rose-50',
      border: 'border-red-200'
    },
    {
      key: 'dailyHealthSummary' as keyof Prefs,
      icon: BarChart3,
      title: 'Daily Health Summary',
      description: 'Receive a daily summary of your medicine adherence',
      color: 'from-purple-400 to-violet-500',
      bg: 'from-purple-50 to-violet-50',
      border: 'border-purple-200'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('profile')} className="p-3 hover:bg-emerald-50">
          <ArrowLeft className="w-8 h-8" />
        </Button>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Notifications
        </h1>
        <div className="w-10" />
      </div>

      {/* Info Banner */}
      <Card className="mb-8 p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Notification Settings</h2>
            <p className="text-lg text-emerald-100">Manage how and when you receive health alerts</p>
          </div>
        </div>
      </Card>

      {/* Toggle Settings */}
      <div className="space-y-4 mb-8">
        {settings.map(({ key, icon: Icon, title, description, color, bg, border }) => (
          <Card
            key={key}
            className={`p-6 bg-white/80 backdrop-blur-sm border-2 ${border} shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer`}
            onClick={() => toggle(key)}
          >
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                <p className="text-base text-slate-500 mt-1">{description}</p>
              </div>
              {/* Toggle Switch */}
              <div
                className={`relative w-16 h-8 rounded-full transition-all duration-300 flex-shrink-0 ${
                  prefs[key] ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                    prefs[key] ? 'left-9' : 'left-1'
                  }`}
                />
              </div>
            </div>
            <div className={`mt-4 px-4 py-2 rounded-xl bg-gradient-to-r ${bg} border ${border} inline-flex items-center gap-2`}>
              {prefs[key] ? (
                <><Bell className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold text-emerald-700">Enabled</span></>
              ) : (
                <><BellOff className="w-4 h-4 text-slate-500" /><span className="text-sm font-semibold text-slate-500">Disabled</span></>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
      >
        {saving ? (
          <><Loader className="w-6 h-6 animate-spin mr-3" />Saving...</>
        ) : (
          <><Save className="w-6 h-6 mr-3" />Save Preferences</>
        )}
      </Button>
    </div>
  );
}
