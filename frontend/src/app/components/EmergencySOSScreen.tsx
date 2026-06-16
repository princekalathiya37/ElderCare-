import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AlertTriangle, Phone, MapPin, Mail, Shield, ArrowLeft, Loader, CheckCircle } from 'lucide-react';
import { Screen } from '../App';
import apiService from '../services/apiService';
import { toast } from 'sonner';

interface EmergencySOSScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface EmergencyContact {
  name: string;
  phone?: string;
  email?: string;
  relationship: string;
}

export function EmergencySOSScreen({ onNavigate }: EmergencySOSScreenProps) {
  const [sosTriggered, setSOSTriggered] = useState(false);
  const [activeSOSId, setActiveSOSId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<any[]>([]);

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
        (error) => reject(error),
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  const triggerSOS = async () => {
    try {
      setLoading(true);

      // Get location with timeout/failure handling
      let loc = null;
      try {
        loc = await getLocation();
        setLocation(loc);
      } catch (geoError) {
        console.warn('Geolocation failed or timed out:', geoError);
        toast.warning('Could not retrieve precise location. Sending SOS with unknown location.');
      }

      // Call backend SOS endpoint
      const result = await apiService.triggerEmergencySOS(loc ? {
        lat: loc.lat,
        lng: loc.lng,
        latitude: loc.lat,
        longitude: loc.lng,
        timestamp: new Date().toISOString()
      } : {
        lat: 0,
        lng: 0,
        latitude: 0,
        longitude: 0,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        setSOSTriggered(true);
        setActiveSOSId(result.sos?._id || null);
        setCountdown(10);
        setDeliveryStatus(result.smsDeliveryStatus || []);

        // Build delivery summary
        const deliveryDetails = result.smsDeliveryStatus || [];
        const emailSent = deliveryDetails.filter((d: any) => d.emailStatus === 'sent');
        const emailFailed = deliveryDetails.filter((d: any) => d.emailStatus === 'failed');
        const emailSkipped = deliveryDetails.filter((d: any) => d.emailStatus === 'skipped');
        const emailMock = deliveryDetails.filter((d: any) => d.emailStatus === 'sent' && d.isMock);

        if (emailSent.length > 0) {
          const names = emailSent.map((d: any) => d.name).join(', ');
          const isMockMode = emailMock.length > 0;
          toast.success('🚨 Emergency SOS Activated!', {
            description: isMockMode 
              ? `📧 Email alerts logged in mock mode for: ${names} (Configure GMAIL_USER in .env for real emails)`
              : `📧 Email alerts sent to: ${names}`,
            duration: 10000
          });
        }

        if (emailFailed.length > 0) {
          const names = emailFailed.map((d: any) => d.name).join(', ');
          toast.error(`⚠️ Email failed for: ${names}. If hosted on Render Free Tier (which blocks SMTP), please configure RESEND_API_KEY, BREVO_API_KEY, or SENDGRID_API_KEY on Render.`, {
            duration: 15000
          });
        }

        if (emailSkipped.length > 0 && emailSent.length === 0 && emailFailed.length === 0) {
          toast.warning('⚠️ SOS triggered but no email addresses configured for contacts. Go to Profile → Emergency Contacts to add emails.', {
            duration: 15000
          });
        }

        if (deliveryDetails.length === 0) {
          toast.success('🚨 Emergency SOS Activated!', {
            description: 'No emergency contacts configured yet. Add them in Profile.'
          });
        }

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
      setDeliveryStatus([]);
      toast.info('SOS Cancelled/Resolved');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel SOS';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const contactsWithEmail = emergencyContacts.filter(c => c.email);
  const contactsWithoutEmail = emergencyContacts.filter(c => !c.email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 px-4 pt-6 pb-8 sm:p-8">
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
              Press the button below ONLY in case of emergency. Email alerts will be sent to all emergency contacts.
            </p>
          </div>
        </Card>

        {/* Status Display */}
        {sosTriggered && (
          <Card className="p-8 bg-gradient-to-r from-red-500 to-orange-500 text-white mb-8 animate-pulse">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-16 h-16 mx-auto animate-bounce" />
              <h2 className="text-3xl font-bold">🚨 EMERGENCY SOS ACTIVE 🚨</h2>
              <p className="text-xl">Email alerts sent to emergency contacts</p>
              {location && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <MapPin className="w-5 h-5" />
                  <p>Location shared: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
                </div>
              )}
              {countdown !== null && (
                <p className="text-2xl font-bold mt-4">
                  Cancel available for: {countdown}s
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Delivery Status */}
        {deliveryStatus.length > 0 && (
          <Card className="p-6 bg-white/80 border-2 border-emerald-200 mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" /> Alert Delivery Status
            </h3>
            <div className="space-y-2">
              {deliveryStatus.map((d: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-700">{d.name}</span>
                  <div className="flex items-center gap-2">
                    {d.emailStatus === 'sent' && (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" /> {d.isMock ? 'Email Logged (Mock)' : 'Email Sent'}
                      </span>
                    )}
                    {d.emailStatus === 'failed' && (
                      <span className="text-red-500 text-sm font-semibold">❌ Email Failed</span>
                    )}
                    {d.emailStatus === 'skipped' && (
                      <span className="text-amber-500 text-sm font-semibold">⚠️ No Email Set</span>
                    )}
                  </div>
                </div>
              ))}
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
                <Card key={idx} className="p-6 bg-white/80 border-2 border-slate-200 hover:border-red-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{contact.name}</h3>
                      <p className="text-slate-500 text-sm mb-2">{contact.relationship}</p>
                      {contact.email && (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm font-medium">{contact.email}</span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Will be notified</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-slate-500 mt-1">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">{contact.phone}</span>
                        </div>
                      )}
                      {!contact.email && (
                        <div className="flex items-center gap-2 text-amber-500 mt-1">
                          <Mail className="w-4 h-4" />
                          <span className="text-xs font-medium">No email — add one in Profile to receive SOS alerts</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {contactsWithoutEmail.length > 0 && contactsWithEmail.length > 0 && (
            <p className="text-amber-600 text-sm mt-3 font-medium">
              ⚠️ {contactsWithoutEmail.length} contact(s) have no email address and will not receive SOS alerts.{' '}
              <button onClick={() => onNavigate('profile')} className="underline font-semibold">Update in Profile</button>
            </p>
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
              ) : 'Cancel SOS'}
            </Button>
          )}

          {!sosTriggered && (
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={triggerSOS}
                disabled={loading}
                className="w-full h-24 text-2xl font-extrabold bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-2xl rounded-3xl transform hover:scale-105 transition-all"
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
                    <MapPin className="w-4 h-4 mr-2 text-red-500" />
                    Your GPS location will be shared with emergency contacts
                  </p>
                  <p className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-emerald-600" />
                    Email alerts with location + medical info sent to all contacts
                  </p>
                  <p className="flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                    You have 10 seconds to cancel if pressed by mistake
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