// ============ UPDATED EMERGENCY SOS SCREEN WITH BACKEND ============
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertTriangle, Phone, MapPin, MessageSquare, Shield, ArrowLeft, Loader } from 'lucide-react';
import { Screen } from '../App';
import apiService from '../services/apiService';
import { toast } from 'sonner';

interface EmergencySOSScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export function EmergencySOSScreen({ onNavigate }: EmergencySOSScreenProps) {
  const [sosTriggered, setSOSTriggered] = useState(false);
  const [activeSOSId, setActiveSOSId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    fetchEmergencyContacts();
  }, []);

  // Countdown timer for cancel
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const fetchEmergencyContacts = async () => {
    try {
      const response = await apiService.getUserProfile();
      if (response.success && response.user) {
        setEmergencyContacts(response.user.emergencyContacts || []);
      }
    } catch (error) {
      console.error('Failed to fetch emergency contacts:', error);
    }
  };

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => reject(error)
      );
    });
  };

  const triggerSOS = async () => {
    try {
      setLoading(true);

      // Get location
      const loc = await getLocation();
      setLocation(loc);

      // Call backend SOS endpoint — send location directly (lat/lng at top level)
      const result = await apiService.triggerEmergencySOS({
        lat: loc.lat,
        lng: loc.lng,
        latitude: loc.lat,
        longitude: loc.lng,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        setSOSTriggered(true);
        setActiveSOSId(result.sos?._id || null);
        setCountdown(10); // 10 second cancel window

        // Check if any SMS failed to deliver
        const failedSMS = result.smsDeliveryStatus?.filter((status: any) => status.status === 'failed');
        
        if (failedSMS && failedSMS.length > 0) {
          const failedNames = failedSMS.map((c: any) => c.name).join(', ');
          const errDetail = failedSMS[0].error || 'Check Twilio configurations and phone numbers.';
          toast.error(`🚨 SOS SMS failed for ${failedNames}: ${errDetail}`, {
            duration: 15000
          });
        } else {
          toast.success('🚨 Emergency SOS Activated!', {
            description: 'Family members notified with your location'
          });
        }

        // Auto-cancel countdown after 10 seconds (keep alert active but close cancel countdown)
        setTimeout(() => {
          setCountdown(null);
        }, 10000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to trigger SOS';
      toast.error(errorMessage);
      console.error('SOS error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelSOS = async () => {
    if (!activeSOSId) {
      toast.error('No active SOS to cancel');
      return;
    }
    try {
      setLoading(true);
      await apiService.resolveSOS(activeSOSId);
      setSOSTriggered(false);
      setActiveSOSId(null);
      setCountdown(null);
      toast.info('SOS Cancelled/Resolved');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel SOS';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            className="p-3 hover:bg-red-50"
          >
            <ArrowLeft className="w-8 h-8" />
          </Button>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Emergency SOS
          </h1>
          <div className="w-10" />
        </div>

        {/* Warning Banner */}
        <Card className="p-6 bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-400 mb-8">
          <div className="flex items-center space-x-4">
            <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 animate-pulse" />
            <p className="text-lg text-red-800 font-semibold">
              Press the button below ONLY in case of emergency
            </p>
          </div>
        </Card>

        {/* Status Display */}
        {sosTriggered && (
          <Card className="p-8 bg-gradient-to-r from-red-500 to-orange-500 text-white mb-8 animate-pulse">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-16 h-16 mx-auto animate-bounce" />
              <h2 className="text-3xl font-bold">🚨 EMERGENCY SOS ACTIVE 🚨</h2>
              <p className="text-xl">Emergency contacts have been notified</p>
              {location && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <MapPin className="w-5 h-5" />
                  <p>Location shared: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                </div>
              )}
              {countdown !== null && (
                <p className="text-2xl font-bold mt-4">
                  Cancel available in: {countdown}s
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Emergency Contacts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
            <Phone className="w-6 h-6 mr-3 text-red-600" />
            Emergency Contacts
          </h2>

          {emergencyContacts.length === 0 ? (
            <Card className="p-6 bg-white/80 border-2 border-slate-200">
              <p className="text-slate-600 text-lg">
                No emergency contacts configured yet.{' '}
                <button
                  onClick={() => onNavigate('profile')}
                  className="text-red-600 font-semibold hover:underline"
                >
                  Add them now
                </button>
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {emergencyContacts.map((contact, idx) => (
                <Card key={idx} className="p-6 bg-white/80 border-2 border-slate-200 hover:border-red-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{contact.name}</h3>
                      <p className="text-slate-600">{contact.relationship}</p>
                    </div>
                    <div className="flex items-center space-x-2 text-red-600 font-mono text-lg">
                      <Phone className="w-5 h-5" />
                      {contact.phone}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* SOS Button */}
        <div className="space-y-4 mb-8">
          {sosTriggered && countdown !== null && (
            <Button
              size="lg"
              onClick={cancelSOS}
              disabled={loading}
              className="w-full h-16 text-lg font-bold bg-slate-600 hover:bg-slate-700 rounded-2xl"
            >
              {loading ? (
                <>
                  <Loader className="w-6 h-6 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  Cancel SOS
                </>
              )}
            </Button>
          )}

          {!sosTriggered && (
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={triggerSOS}
                disabled={loading}
                className="w-full h-24 text-2xl font-extrabold bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-2xl hover:shadow-3xl rounded-3xl transform hover:scale-105 transition-all"
              >
                {loading ? (
                  <>
                    <Loader className="w-8 h-8 mr-3 animate-spin" />
                    Activating SOS...
                  </>
                ) : (
                  <>
                    <Shield className="w-8 h-8 mr-3 inline" />
                    PRESS FOR EMERGENCY
                  </>
                )}
              </Button>

              {/* Tips */}
              <Card className="p-4 bg-slate-50 border-slate-200">
                <div className="space-y-2 text-sm text-slate-600">
                  <p className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Your location will be shared with emergency contacts
                  </p>
                  <p className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SMS notifications sent to all emergency contacts
                  </p>
                  <p className="flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    You will have 10 seconds to cancel if pressed by mistake
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmergencySOSScreen;