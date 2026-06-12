import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Droplet,
  Heart,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Edit,
  Loader,
  Save,
  X,
  FileText,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Screen } from '../App';
import apiService from '../services/apiService';
import { toast } from 'sonner';

interface ProfileScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface UserProfile {
  name: string;
  age?: number;
  email: string;
  phone?: string;
  bloodGroup?: string;
  specialization?: string;
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
  medicalConditions?: string[];
  allergies?: string[];
  notificationPreferences?: {
    medicineReminders: boolean;
    appointmentReminders: boolean;
    sosAlerts: boolean;
    dailyHealthSummary: boolean;
  };
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState<{
    name: string;
    phone: string;
    age: string;
    bloodGroup: string;
    medicalConditions: string;
    allergies: string;
    emergencyContacts: Array<{ name: string; phone: string; relationship: string; }>;
  }>({
    name: '',
    phone: '',
    age: '',
    bloodGroup: '',
    medicalConditions: '',
    allergies: '',
    emergencyContacts: []
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiService.getUserProfile();
        if (response.success && response.user) {
          setProfile(response.user);
          setEditForm({
            name: response.user.name || '',
            phone: response.user.phone || '',
            age: response.user.age?.toString() || '',
            bloodGroup: response.user.bloodGroup || '',
            medicalConditions: (response.user.medicalConditions || []).join(', '),
            allergies: (response.user.allergies || []).join(', '),
            emergencyContacts: response.user.emergencyContacts || []
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load profile details');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        age: editForm.age ? parseInt(editForm.age) : undefined,
        bloodGroup: editForm.bloodGroup.trim(),
        medicalConditions: editForm.medicalConditions
          ? editForm.medicalConditions.split(',').map(c => c.trim()).filter(Boolean)
          : [],
        allergies: editForm.allergies
          ? editForm.allergies.split(',').map(a => a.trim()).filter(Boolean)
          : []
      };
      const response = await apiService.updateProfile(payload);
      if (response.success) {
        await apiService.updateEmergencyContacts(editForm.emergencyContacts);
        const updatedProfileResponse = await apiService.getUserProfile();
        if (updatedProfileResponse.success && updatedProfileResponse.user) {
          setProfile(updatedProfileResponse.user);
        }
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    toast.success('Logged out successfully');
    onNavigate('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const user = profile || {
    name: 'User Name',
    email: 'email@example.com',
    age: 0,
    phone: 'Not provided',
    bloodGroup: 'Not set',
    emergencyContacts: [],
    medicalConditions: [],
    allergies: []
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('home')}
          className="p-3 hover:bg-emerald-50"
        >
          <ArrowLeft className="w-8 h-8" />
        </Button>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Profile
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="p-3 hover:bg-emerald-50"
          onClick={() => setIsEditing(true)}
        >
          <Edit className="w-8 h-8 text-emerald-600" />
        </Button>
      </div>

      {/* User Info */}
      <Card className="mb-8 p-10 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-xl">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-bold text-slate-800 mb-2">{user.name}</h3>
            {user.age ? <p className="text-xl text-slate-600 mb-4">{user.age} years old</p> : null}
            <div className="flex items-center space-x-3">
              <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-red-100 to-rose-100 text-red-700">
                <Droplet className="w-5 h-5 mr-2" />
                {user.bloodGroup || 'Blood Type: Not Set'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="mb-8 p-10 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg">
        <h3 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-3">
          <User className="w-7 h-7" />
          Contact Information
        </h3>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Mail className="w-7 h-7 text-emerald-600" />
            <span className="text-xl text-slate-700">{user.email}</span>
          </div>
          <div className="flex items-center space-x-4">
            <Phone className="w-7 h-7 text-emerald-600" />
            <span className="text-xl text-slate-700">{user.phone || 'Phone: Not set'}</span>
          </div>
        </div>
      </Card>

      {/* Emergency Contacts */}
      <Card className="mb-8 p-10 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg">
        <h3 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-3">
          <Phone className="w-7 h-7 text-red-600" />
          Emergency Contacts
        </h3>
        {(!user.emergencyContacts || user.emergencyContacts.length === 0) ? (
          <p className="text-lg text-slate-600 italic">No emergency contacts set yet.</p>
        ) : (
          <div className="space-y-4">
            {user.emergencyContacts.map((contact, index) => (
              <div key={index} className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-2xl border-2 border-red-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-bold text-red-700">{contact.name}</h4>
                  <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-2 border-red-300">
                    {contact.relationship}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <Phone className="w-6 h-6 text-red-600" />
                  <span className="text-xl font-semibold text-red-700">{contact.phone}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Medical Information */}
      <Card className="mb-8 p-10 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg">
        <h3 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-3">
          <Heart className="w-7 h-7" />
          Medical Information
        </h3>
        <div className="space-y-8">
          <div>
            <h4 className="text-xl font-bold text-emerald-700 mb-4">Medical Conditions</h4>
            {(!user.medicalConditions || user.medicalConditions.length === 0) ? (
              <p className="text-lg text-slate-600 italic">None listed</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {user.medicalConditions.map((condition, index) => (
                  <Badge key={index} className="text-lg px-5 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700">
                    {condition}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div>
            <h4 className="text-xl font-bold text-emerald-700 mb-4">Allergies</h4>
            {(!user.allergies || user.allergies.length === 0) ? (
              <p className="text-lg text-slate-600 italic">None listed</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {user.allergies.map((allergy, index) => (
                  <Badge key={index} className="text-lg px-5 py-2 bg-gradient-to-r from-red-100 to-rose-100 text-red-700">
                    {allergy}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Settings & Options */}
      <Card className="mb-8 p-10 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg">
        <h3 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-3">
          <Settings className="w-7 h-7" />
          Settings & Support
        </h3>
        <div className="space-y-3">
          <Button
            variant="ghost"
            className="w-full justify-between h-16 text-xl font-semibold text-slate-700 hover:bg-emerald-50 rounded-2xl"
            onClick={() => onNavigate('notifications')}
          >
            <span className="flex items-center gap-4">
              <Bell className="w-7 h-7 text-emerald-600" />
              Notification Settings
            </span>
            <ChevronRight className="w-6 h-6 text-slate-400" />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between h-16 text-xl font-semibold text-slate-700 hover:bg-emerald-50 rounded-2xl"
            onClick={() => onNavigate('privacy')}
          >
            <span className="flex items-center gap-4">
              <Shield className="w-7 h-7 text-emerald-600" />
              Privacy & Security
            </span>
            <ChevronRight className="w-6 h-6 text-slate-400" />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between h-16 text-xl font-semibold text-slate-700 hover:bg-emerald-50 rounded-2xl"
            onClick={() => onNavigate('help')}
          >
            <span className="flex items-center gap-4">
              <HelpCircle className="w-7 h-7 text-emerald-600" />
              Help & Support
            </span>
            <ChevronRight className="w-6 h-6 text-slate-400" />
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-between h-16 text-xl font-semibold text-slate-700 hover:bg-emerald-50 rounded-2xl"
            onClick={() => onNavigate('terms')}
          >
            <span className="flex items-center gap-4">
              <FileText className="w-7 h-7 text-emerald-600" />
              Terms & Conditions
            </span>
            <ChevronRight className="w-6 h-6 text-slate-400" />
          </Button>
          <div className="border-t-2 border-emerald-200 pt-6 mt-6">
            <Button
              variant="ghost"
              className="w-full justify-start h-16 text-xl font-semibold text-red-600 hover:bg-red-50 rounded-2xl"
              onClick={handleSignOut}
            >
              <LogOut className="w-7 h-7 mr-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </Card>

      {/* App Version */}
      <div className="text-center mt-6 text-lg text-slate-600">
        <p className="font-semibold">ElderCare+ v1.0.0</p>
        <p>© 2024 ElderCare+ Healthcare App</p>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <Card className="bg-white shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-3xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Edit Profile
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="hover:bg-slate-100 rounded-full p-2"
                >
                  <X className="w-7 h-7" />
                </Button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" /> Full Name *
                  </Label>
                  <Input
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-emerald-600" /> Phone Number
                  </Label>
                  <Input
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600" /> Age
                    </Label>
                    <Input
                      type="number"
                      value={editForm.age}
                      onChange={e => setEditForm({ ...editForm, age: e.target.value })}
                      className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Age"
                      min={1}
                      max={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                      <Droplet className="w-5 h-5 text-red-500" /> Blood Group
                    </Label>
                    <select
                      value={editForm.bloodGroup}
                      onChange={e => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                      className="h-14 w-full text-lg border-2 border-slate-200 rounded-2xl px-4 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 bg-white"
                    >
                      <option value="">Select</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-blue-500" /> Medical Conditions
                  </Label>
                  <Input
                    value={editForm.medicalConditions}
                    onChange={e => setEditForm({ ...editForm, medicalConditions: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Hypertension, Diabetes (comma separated)"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" /> Allergies
                  </Label>
                  <Input
                    value={editForm.allergies}
                    onChange={e => setEditForm({ ...editForm, allergies: e.target.value })}
                    className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Penicillin, Peanuts (comma separated)"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t-2 border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                      <Phone className="w-5 h-5 text-red-500" /> Emergency Contacts
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditForm({
                        ...editForm,
                        emergencyContacts: [...editForm.emergencyContacts, { name: '', phone: '', relationship: '' }]
                      })}
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Contact
                    </Button>
                  </div>
                  
                  {editForm.emergencyContacts.map((contact, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newContacts = [...editForm.emergencyContacts];
                          newContacts.splice(idx, 1);
                          setEditForm({ ...editForm, emergencyContacts: newContacts });
                        }}
                        className="absolute top-2 right-2 text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-3 pr-8">
                        <Input
                          placeholder="Name"
                          value={contact.name}
                          onChange={e => {
                            const newContacts = [...editForm.emergencyContacts];
                            newContacts[idx].name = e.target.value;
                            setEditForm({ ...editForm, emergencyContacts: newContacts });
                          }}
                          className="h-12"
                        />
                        <Input
                          placeholder="Relationship"
                          value={contact.relationship}
                          onChange={e => {
                            const newContacts = [...editForm.emergencyContacts];
                            newContacts[idx].relationship = e.target.value;
                            setEditForm({ ...editForm, emergencyContacts: newContacts });
                          }}
                          className="h-12"
                        />
                        <Input
                          placeholder="Phone"
                          value={contact.phone}
                          onChange={e => {
                            const newContacts = [...editForm.emergencyContacts];
                            newContacts[idx].phone = e.target.value;
                            setEditForm({ ...editForm, emergencyContacts: newContacts });
                          }}
                          className="col-span-2 h-12"
                        />
                      </div>
                    </div>
                  ))}
                  {editForm.emergencyContacts.length === 0 && (
                    <p className="text-slate-500 italic text-sm">No emergency contacts added yet.</p>
                  )}
                </div>

                <div className="pt-4 flex gap-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 h-14 text-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl shadow-lg"
                  >
                    {saving ? (
                      <Loader className="w-6 h-6 animate-spin mr-2" />
                    ) : (
                      <Save className="w-6 h-6 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="h-14 px-8 text-xl font-semibold border-2 border-slate-300 rounded-2xl"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
