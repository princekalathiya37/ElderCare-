import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Server,
  Users,
  Trash2,
  KeyRound,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Loader
} from 'lucide-react';
import { Screen } from '../App';
import apiService from '../services/apiService';
import { toast } from 'sonner';

interface PrivacySecurityScreenProps {
  onNavigate: (screen: Screen) => void;
}

const privacySections = [
  {
    icon: Server,
    title: 'Data We Collect',
    color: 'from-blue-400 to-indigo-500',
    content: 'ElderCare+ collects your name, email, health information (medicines, appointments, medical conditions), emergency contact details, and usage data to provide our services. All data is stored securely and encrypted at rest.'
  },
  {
    icon: Lock,
    title: 'How We Protect Your Data',
    color: 'from-emerald-400 to-teal-500',
    content: 'Your data is protected using AES-256 encryption and stored on secure servers with industry-standard firewalls. We use JWT tokens for authentication and all API communications are over HTTPS.'
  },
  {
    icon: Users,
    title: 'Data Sharing',
    color: 'from-purple-400 to-violet-500',
    content: 'We never sell your personal data. Your health data is shared only with caretakers you explicitly authorize. Emergency contacts receive alerts only during SOS events you trigger.'
  },
  {
    icon: Eye,
    title: 'Your Rights',
    color: 'from-amber-400 to-orange-500',
    content: 'You have the right to access, correct, or delete your personal data at any time. You may also export your health data. To exercise these rights, contact support@eldercare.app.'
  }
];

export function PrivacySecurityScreen({ onNavigate }: PrivacySecurityScreenProps) {
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      toast.error('All password fields are required');
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPw.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      setSaving(true);
      // Call change password endpoint (profile update with password field)
      await apiService.updateProfile({ password: pwForm.newPw, currentPassword: pwForm.current });
      toast.success('Password changed successfully!');
      setChangingPassword(false);
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch {
      toast.error('Failed to change password. Check your current password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 pt-6 pb-24 sm:p-8 sm:pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('profile')} className="p-3 hover:bg-emerald-50">
          <ArrowLeft className="w-8 h-8" />
        </Button>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Privacy & Security
        </h1>
        <div className="w-10" />
      </div>

      {/* Hero */}
      <Card className="mb-8 p-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Your Privacy Matters</h2>
            <p className="text-lg text-emerald-100">ElderCare+ is committed to keeping your health data safe and private</p>
          </div>
        </div>
      </Card>

      {/* Privacy Policy Sections */}
      <Card className="mb-8 p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg">
        <h3 className="text-2xl font-bold text-emerald-700 mb-6">Privacy Policy</h3>
        <div className="space-y-3">
          {privacySections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="border-2 border-emerald-100 rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-emerald-50 transition-colors"
                  onClick={() => setOpenSection(openSection === idx ? null : idx)}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-slate-800 flex-1">{section.title}</span>
                  {openSection === idx ? (
                    <ChevronUp className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {openSection === idx && (
                  <div className="px-5 pb-5 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <p className="text-lg text-slate-700 leading-relaxed">{section.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="mb-8 p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg">
        <h3 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-3">
          <Lock className="w-7 h-7" />
          Security Settings
        </h3>

        {/* Change Password */}
        <div className="mb-6">
          <div
            className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 cursor-pointer hover:shadow-md transition-all"
            onClick={() => setChangingPassword(!changingPassword)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">Change Password</h4>
                <p className="text-base text-slate-500">Update your account password</p>
              </div>
            </div>
            {changingPassword ? (
              <ChevronUp className="w-6 h-6 text-emerald-600" />
            ) : (
              <ChevronDown className="w-6 h-6 text-slate-400" />
            )}
          </div>

          {changingPassword && (
            <div className="mt-4 p-6 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-4">
              <div className="space-y-2">
                <Label className="text-lg font-semibold text-slate-700">Current Password</Label>
                <Input
                  type="password"
                  value={pwForm.current}
                  onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                  className="h-14 text-lg border-2 border-slate-200 rounded-2xl"
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-lg font-semibold text-slate-700">New Password</Label>
                <Input
                  type="password"
                  value={pwForm.newPw}
                  onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                  className="h-14 text-lg border-2 border-slate-200 rounded-2xl"
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-lg font-semibold text-slate-700">Confirm New Password</Label>
                <Input
                  type="password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                  className="h-14 text-lg border-2 border-slate-200 rounded-2xl"
                  placeholder="Confirm new password"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={saving}
                className="w-full h-14 text-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl"
              >
                {saving ? <Loader className="w-6 h-6 animate-spin mr-2" /> : <CheckCircle className="w-6 h-6 mr-2" />}
                {saving ? 'Saving...' : 'Update Password'}
              </Button>
            </div>
          )}
        </div>

        {/* Active Session Info */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-800">Session Security</h4>
              <p className="text-base text-slate-600">Your session uses a secure JWT token. Tokens expire after 7 days for your safety.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone — Delete Account */}
      <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-red-200 shadow-lg">
        <h3 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-3">
          <Trash2 className="w-7 h-7" />
          Danger Zone
        </h3>
        <p className="text-lg text-slate-600 mb-4">
          Deleting your account will permanently remove all your health data, medicines, appointments, and medical records. This action <strong>cannot be undone</strong>.
        </p>
        {!showDelete ? (
          <Button
            variant="outline"
            className="h-14 px-8 text-lg font-semibold border-2 border-red-400 text-red-600 hover:bg-red-50 rounded-2xl"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Delete My Account
          </Button>
        ) : (
          <div className="p-5 bg-red-50 rounded-2xl border-2 border-red-300">
            <p className="text-lg font-semibold text-red-700 mb-4">Are you absolutely sure? This cannot be reversed.</p>
            <div className="flex gap-4">
              <Button
                className="h-12 px-6 text-lg bg-red-500 hover:bg-red-600 text-white rounded-2xl"
                onClick={() => { toast.error('Account deletion requires contacting support@eldercare.app'); setShowDelete(false); }}
              >
                Yes, Delete
              </Button>
              <Button
                variant="outline"
                className="h-12 px-6 text-lg border-2 border-slate-300 rounded-2xl"
                onClick={() => setShowDelete(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
