import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Pill, Calendar, Phone, Clock, User, MapPin, MessageSquare, HeartPulse, Loader, Mail } from 'lucide-react';
import { Screen } from '../App';
import apiService from '../services/apiService';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Medicine {
  _id: string;
  name: string;
  dosage: string;
  times: string[];
  taken: boolean;
  emailAlert: boolean;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [userName, setUserName] = useState('User');
  const [todayMedicines, setTodayMedicines] = useState<Medicine[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        // Fetch profile to get name
        const profileRes = await apiService.getUserProfile();
        if (profileRes.success && profileRes.user) {
          setUserName(profileRes.user.name);
        }

        // Fetch today's medicines
        const medicinesRes = await apiService.getTodaysMedicines();
        if (medicinesRes.success) {
          const transformed = medicinesRes.data.map((med: any) => ({
            _id: med._id,
            name: med.name,
            dosage: med.dosage,
            times: med.scheduledTimes,
            taken: med.todaysConfirmations?.some((c: any) => c.confirmed) || false,
            emailAlert: med.emailAlert
          }));
          setTodayMedicines(transformed);
        }

        // Fetch appointments
        const appointmentsRes = await apiService.getAppointments();
        if (appointmentsRes.success && appointmentsRes.appointments) {
          const now = new Date();
          const upcoming = appointmentsRes.appointments
            .filter((apt: any) => apt.status === 'upcoming')
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          if (upcoming.length > 0) {
            setNextAppointment(upcoming[0]);
          } else {
            setNextAppointment(null);
          }
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });



  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Good Morning, {userName}!
            </h1>
            <p className="text-xl text-slate-600 mt-2">{currentDate}</p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-xl">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Email Alert Banner */}
        <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 mb-6">
          <div className="flex items-start space-x-4">
            <Mail className="w-7 h-7 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-amber-800 mb-1">Email Alert Active</h4>
              <p className="text-amber-700">Your caregiver will be notified via email if medicine is not taken within 30 minutes</p>
            </div>
          </div>
        </Card>

        {/* Emergency SOS Button */}
        <Button
          onClick={() => onNavigate('sos')}
          className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 mb-8"
        >
          <Phone className="w-7 h-7 mr-3" />
          Emergency SOS
        </Button>

        {/* Today's Medicines */}
        <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 mb-6 shadow-lg">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6 flex items-center">
            <Pill className="w-7 h-7 mr-3" />
            Today's Medicines
          </h2>
          {loading ? (
            <div className="py-12 text-center">
              <Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-slate-500">Loading medicines...</p>
            </div>
          ) : todayMedicines.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No medicines scheduled for today.
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {todayMedicines.map((medicine) => (
                <div
                  key={medicine._id}
                  className={`p-6 rounded-2xl transition-all duration-300 ${
                    medicine.taken
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                      : 'bg-gradient-to-r from-slate-50 to-emerald-50 border-2 border-emerald-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-slate-800 mb-1">{medicine.name}</h4>
                      <p className="text-lg text-slate-600 mb-2">{medicine.dosage}</p>
                      {medicine.emailAlert && !medicine.taken && (
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 text-amber-500 mr-2" />
                          <span className="text-sm font-semibold text-amber-600">Email alert in 30 min</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-slate-600 mb-2 justify-end">
                        <Clock className="w-6 h-6 mr-2" />
                        <span className="text-lg font-semibold">{medicine.times.join(', ')}</span>
                      </div>
                      <Badge
                        variant={medicine.taken ? "secondary" : "destructive"}
                        className="text-base px-4 py-2"
                      >
                        {medicine.taken ? "Taken" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            onClick={() => onNavigate('medicines')}
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-2 border-emerald-300 hover:bg-emerald-50 rounded-2xl"
          >
            View All Medicines
          </Button>
        </Card>

        {/* Next Appointment */}
        <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6 flex items-center">
            <Calendar className="w-7 h-7 mr-3" />
            Next Appointment
          </h2>
          {nextAppointment ? (
            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-slate-800 mb-1">{nextAppointment.doctorName}</h4>
                  {nextAppointment.specialty && <p className="text-lg text-slate-600 mb-4">{nextAppointment.specialty}</p>}
                  <div className="space-y-2 text-base">
                    <div className="flex items-center text-slate-700">
                      <Calendar className="w-6 h-6 mr-3 text-emerald-600" />
                      <span className="font-semibold">{new Date(nextAppointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {nextAppointment.time}</span>
                    </div>
                    {nextAppointment.location && (
                      <div className="flex items-center text-slate-700">
                        <MapPin className="w-6 h-6 mr-3 text-emerald-600" />
                        <span>{nextAppointment.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-lg italic">
              No upcoming appointments.
            </div>
          )}
          <Button
            onClick={() => onNavigate('appointments')}
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-2 border-emerald-300 hover:bg-emerald-50 rounded-2xl mt-6"
          >
            View All Appointments
          </Button>
        </Card>
      </div>
    </div>
  );
}
