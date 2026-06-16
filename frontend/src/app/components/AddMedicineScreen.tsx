import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { ArrowLeft, Save, Pill, Mail } from 'lucide-react';
import { Screen } from '../App';
import { toast } from "sonner";
import apiService from '../services/apiService';

interface AddMedicineScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function AddMedicineScreen({ onNavigate }: AddMedicineScreenProps) {
  const [formData, setFormData] = useState({
    medicineName: '',
    dosage: '',
    time: '',
    frequency: '',
    emailAlertEnabled: false,
    emailContactName: '',
    emailContactEmail: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.medicineName || !formData.dosage || !formData.time || !formData.frequency) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.emailAlertEnabled && !formData.emailContactEmail) {
      toast.error("Please enter an email address for email alerts");
      return;
    }

    if (formData.emailAlertEnabled && formData.emailContactEmail && !formData.emailContactEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.medicineName,
        dosage: formData.dosage,
        frequency: formData.frequency,
        scheduledTimes: [formData.time],
        emailAlert: formData.emailAlertEnabled,
        emailContact: formData.emailContactEmail,
        pushNotification: true
      };

      const response = await apiService.addMedicine(payload);

      if (response.success) {
        if (formData.emailAlertEnabled) {
          toast.success(`Medicine saved! Email alert will be sent to ${formData.emailContactEmail} if not taken within 30 minutes.`);
        } else {
          toast.success("Medicine added successfully!");
        }
        onNavigate('medicines');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 pt-6 pb-8 sm:p-6 sm:pb-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('medicines')}
            className="p-3 hover:bg-emerald-50"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Add Medicine
          </h1>
          <div className="w-10" />
        </div>

        {/* Medicine Details */}
        <Card className="shadow-sm mb-6 border-2 border-emerald-100 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-700 text-xl">
              <Pill className="w-6 h-6 mr-3 text-emerald-600" />
              Medicine Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="medicine-name" className="text-base font-semibold text-slate-700">Medicine Name *</Label>
              <Input
                id="medicine-name"
                placeholder="e.g., Metformin, Aspirin"
                value={formData.medicineName}
                onChange={(e) => handleInputChange('medicineName', e.target.value)}
                className="h-13 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage" className="text-base font-semibold text-slate-700">Dosage *</Label>
              <Input
                id="dosage"
                placeholder="e.g., 500mg, 1 tablet"
                value={formData.dosage}
                onChange={(e) => handleInputChange('dosage', e.target.value)}
                className="h-13 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-base font-semibold text-slate-700">Scheduled Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                className="h-13 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-base font-semibold text-slate-700">Frequency *</Label>
              <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
                <SelectTrigger className="h-13 text-base border-2 border-slate-200 rounded-xl">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once-daily">Once daily</SelectItem>
                  <SelectItem value="twice-daily">Twice daily</SelectItem>
                  <SelectItem value="three-times-daily">Three times daily</SelectItem>
                  <SelectItem value="four-times-daily">Four times daily</SelectItem>
                  <SelectItem value="as-needed">As needed</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Email Alert Feature */}
        <Card className="shadow-sm mb-6 border-2 border-emerald-100 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-emerald-700 text-xl">
              <div className="flex items-center">
                <Mail className="w-6 h-6 mr-3 text-emerald-600" />
                Email Alert to Caretaker
              </div>
              <Switch
                checked={formData.emailAlertEnabled}
                onCheckedChange={(checked) => handleInputChange('emailAlertEnabled', checked)}
              />
            </CardTitle>
          </CardHeader>
          {formData.emailAlertEnabled && (
            <CardContent className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-emerald-800 text-sm font-medium">
                  📧 An email will be automatically sent to your caretaker if this medicine is not marked as taken within <strong>30 minutes</strong> of the scheduled time.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-name" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                  Caretaker Name
                </Label>
                <Input
                  id="contact-name"
                  placeholder="e.g., Mary (daughter)"
                  value={formData.emailContactName}
                  onChange={(e) => handleInputChange('emailContactName', e.target.value)}
                  className="h-12 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  Caretaker Email Address *
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="caretaker@example.com"
                  value={formData.emailContactEmail}
                  onChange={(e) => handleInputChange('emailContactEmail', e.target.value)}
                  className="h-12 text-base border-2 border-slate-200 rounded-xl focus:border-emerald-400"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-slate-600 text-sm">
                  📬 <strong>Sample email subject:</strong> <em>"⚠️ Medicine Alert: [Your name] hasn't taken [Medicine name]"</em>
                </p>
              </div>
            </CardContent>
          )}
          {!formData.emailAlertEnabled && (
            <CardContent>
              <p className="text-slate-500 text-sm">
                Enable to automatically notify your caretaker via email if you miss your medicine dose by more than 30 minutes.
              </p>
            </CardContent>
          )}
        </Card>

        {/* Save Button */}
        <div className="space-y-3">
          <Button
            onClick={handleSave}
            className="w-full h-14 rounded-2xl text-lg font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
            size="lg"
            disabled={loading}
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Saving...' : 'Save Medicine'}
          </Button>
          <Button
            onClick={() => onNavigate('medicines')}
            variant="outline"
            className="w-full h-12 rounded-2xl text-base font-semibold border-2 border-slate-200"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
