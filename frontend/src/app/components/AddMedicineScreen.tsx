import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { ArrowLeft, Save, Pill, MessageSquare, Phone } from 'lucide-react';
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
    smsAlertEnabled: false,
    smsContactName: '',
    smsContactPhone: ''
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

    if (formData.smsAlertEnabled && !formData.smsContactPhone) {
      toast.error("Please enter a contact phone number for SMS alerts");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.medicineName,
        dosage: formData.dosage,
        frequency: formData.frequency,
        scheduledTimes: [formData.time],
        smsAlert: formData.smsAlertEnabled,
        smsContact: formData.smsContactPhone,
        pushNotification: true
      };

      const response = await apiService.addMedicine(payload);

      if (response.success) {
        if (formData.smsAlertEnabled) {
          toast.success(`Medicine saved! SMS alert will be sent to ${formData.smsContactPhone} if not taken within 30 minutes.`);
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
    <div className="min-h-screen bg-gray-50 p-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('medicines')}
          className="p-2"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h2 className="text-primary">Add Medicine</h2>
        <div className="w-10" />
      </div>

      {/* Medicine Details */}
      <Card className="shadow-sm mb-4 border border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Pill className="w-5 h-5 mr-2 text-primary" />
            Medicine Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="medicine-name">Medicine Name</Label>
            <Input
              id="medicine-name"
              placeholder="Enter medicine name"
              value={formData.medicineName}
              onChange={(e) => handleInputChange('medicineName', e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage</Label>
            <Input
              id="dosage"
              placeholder="e.g., 500mg, 1 tablet"
              value={formData.dosage}
              onChange={(e) => handleInputChange('dosage', e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
              <SelectTrigger className="h-12 text-base">
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

      {/* SMS Alert Feature */}
      <Card className="shadow-sm mb-4 border border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-primary" />
              SMS Alert
            </div>
            <Switch
              checked={formData.smsAlertEnabled}
              onCheckedChange={(checked) => handleInputChange('smsAlertEnabled', checked)}
            />
          </CardTitle>
        </CardHeader>
        {formData.smsAlertEnabled && (
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-amber-800 text-sm">
                An SMS will be sent to your caregiver automatically if this medicine is not marked as taken within <strong>30 minutes</strong> of the scheduled time.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-name" className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>Caregiver Name</span>
              </Label>
              <Input
                id="contact-name"
                placeholder="e.g., Mary (daughter)"
                value={formData.smsContactName}
                onChange={(e) => handleInputChange('smsContactName', e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone" className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>Caregiver Phone Number *</span>
              </Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.smsContactPhone}
                onChange={(e) => handleInputChange('smsContactPhone', e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
              <p className="text-muted-foreground text-sm">
                Sample SMS: <em>"[ElderCare+] John has not taken Metformin (500mg) scheduled at 8:00 AM. Please check on them."</em>
              </p>
            </div>
          </CardContent>
        )}
        {!formData.smsAlertEnabled && (
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Enable to automatically notify a caregiver via SMS if medicine is not taken on time.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Save Button */}
      <div className="space-y-3">
        <Button
          onClick={handleSave}
          className="w-full h-14 rounded-xl"
          size="lg"
          disabled={loading}
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? 'Saving...' : 'Save Medicine'}
        </Button>
        <Button
          onClick={() => onNavigate('medicines')}
          variant="outline"
          className="w-full h-12 rounded-xl"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
