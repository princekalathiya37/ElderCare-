import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Save, Calendar, Loader } from 'lucide-react';
import { Screen } from '../App';
import { toast } from 'sonner';
import apiService from '../services/apiService';

interface AddAppointmentScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function AddAppointmentScreen({ onNavigate }: AddAppointmentScreenProps) {
  const [formData, setFormData] = useState({
    doctorName: '',
    specialty: '',
    date: '',
    time: '',
    location: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.doctorName || !formData.date || !formData.time) {
      toast.error('Please fill in doctor name, date, and time');
      return;
    }

    try {
      setSaving(true);
      const response = await apiService.addAppointment({
        doctorName: formData.doctorName,
        specialty: formData.specialty,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        notes: formData.notes
      });
      if (response.success) {
        toast.success('Appointment added successfully!');
        onNavigate('appointments');
      }
    } catch (error) {
      toast.error('Failed to add appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('appointments')}
          className="p-3 hover:bg-emerald-50"
        >
          <ArrowLeft className="w-8 h-8" />
        </Button>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Add Appointment
        </h1>
        <div className="w-10" />
      </div>

      {/* Form */}
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-2 border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-bold text-emerald-700">
              <Calendar className="w-7 h-7 mr-3" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Doctor Name */}
            <div className="space-y-2">
              <Label htmlFor="doctor-name" className="text-lg font-semibold text-slate-700">Doctor Name *</Label>
              <Input
                id="doctor-name"
                placeholder="Enter doctor's name"
                value={formData.doctorName}
                onChange={(e) => handleInputChange('doctorName', e.target.value)}
                className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            {/* Specialty */}
            <div className="space-y-2">
              <Label htmlFor="specialty" className="text-lg font-semibold text-slate-700">Specialty</Label>
              <Select value={formData.specialty} onValueChange={(value) => handleInputChange('specialty', value)}>
                <SelectTrigger className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400">
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general-practitioner">General Practitioner</SelectItem>
                  <SelectItem value="cardiologist">Cardiologist</SelectItem>
                  <SelectItem value="endocrinologist">Endocrinologist</SelectItem>
                  <SelectItem value="neurologist">Neurologist</SelectItem>
                  <SelectItem value="orthopedist">Orthopedist</SelectItem>
                  <SelectItem value="ophthalmologist">Ophthalmologist</SelectItem>
                  <SelectItem value="dermatologist">Dermatologist</SelectItem>
                  <SelectItem value="psychiatrist">Psychiatrist</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-lg font-semibold text-slate-700">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="time" className="text-lg font-semibold text-slate-700">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-lg font-semibold text-slate-700">Location</Label>
              <Input
                id="location"
                placeholder="Hospital/Clinic address"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-lg font-semibold text-slate-700">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or reason for visit"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="min-h-24 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reminder Box */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200">
          <h4 className="text-xl font-bold text-blue-700 mb-3">📅 Appointment Reminders</h4>
          <ul className="text-lg text-slate-600 space-y-2">
            <li>• You'll receive a notification 24 hours before</li>
            <li>• Arrive 15 minutes early for check-in</li>
            <li>• Bring your insurance card and ID</li>
            <li>• Don't forget to bring current medications list</li>
          </ul>
        </div>

        {/* Save Button */}
        <div className="space-y-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-16 rounded-2xl text-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            {saving ? (
              <><Loader className="w-6 h-6 animate-spin mr-3" />Saving...</>
            ) : (
              <><Save className="w-6 h-6 mr-3" />Save Appointment</>
            )}
          </Button>

          <Button
            onClick={() => onNavigate('appointments')}
            variant="outline"
            className="w-full h-14 rounded-2xl text-xl font-semibold border-2 border-slate-300"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}