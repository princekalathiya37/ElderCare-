import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Calendar, User, MapPin, Clock, ArrowLeft, Trash2, Loader } from 'lucide-react';
import { Screen } from '../App';
import apiService from '../services/apiService';
import { toast } from 'sonner';

interface AppointmentsScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Appointment {
  _id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes: string;
}

export function AppointmentsScreen({ onNavigate }: AppointmentsScreenProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAppointments();
      if (response.success) {
        // Auto-update status based on date
        const now = new Date();
        const updated = (response.appointments as Appointment[]).map(apt => ({
          ...apt,
          status: new Date(apt.date) < now ? 'completed' : apt.status
        }));
        setAppointments(updated);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await apiService.deleteAppointment(id);
      setAppointments(prev => prev.filter(apt => apt._id !== id));
      toast.success('Appointment deleted');
    } catch (error) {
      toast.error('Failed to delete appointment');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const upcomingAppointments = appointments.filter(apt => apt.status === 'upcoming');
  const pastAppointments = appointments.filter(apt => apt.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            className="p-3 hover:bg-emerald-50"
          >
            <ArrowLeft className="w-8 h-8" />
          </Button>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Appointments
          </h1>
          <div className="w-10" />
        </div>

        {/* Empty State */}
        {appointments.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-700 mb-3">No Appointments Yet</h3>
            <p className="text-lg text-slate-500 mb-8">Add your first doctor appointment to get started.</p>
            <Button
              onClick={() => onNavigate('add-appointment')}
              className="h-14 px-8 text-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg"
            >
              <Plus className="w-6 h-6 mr-2" />
              Add Appointment
            </Button>
          </div>
        )}

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-3">
              <Calendar className="w-7 h-7" />
              Upcoming Appointments
              <Badge className="ml-2 text-base px-3 py-1 bg-emerald-100 text-emerald-700">{upcomingAppointments.length}</Badge>
            </h3>
            <div className="space-y-6">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment._id} className="p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-2xl font-bold text-slate-800 mb-1">{appointment.doctorName}</h4>
                          {appointment.specialty && <p className="text-lg text-slate-600">{appointment.specialty}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700">
                            Upcoming
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl p-2"
                            onClick={() => handleDelete(appointment._id)}
                            disabled={deletingId === appointment._id}
                          >
                            {deletingId === appointment._id ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3 text-base">
                        <div className="flex items-center">
                          <Calendar className="w-6 h-6 mr-3 text-emerald-600" />
                          <span className="text-slate-700">{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-6 h-6 mr-3 text-emerald-600" />
                          <span className="text-slate-700">{appointment.time}</span>
                        </div>
                        {appointment.location && (
                          <div className="flex items-center">
                            <MapPin className="w-6 h-6 mr-3 text-emerald-600" />
                            <span className="text-slate-700">{appointment.location}</span>
                          </div>
                        )}
                      </div>
                      {appointment.notes && (
                        <div className="mt-5 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200">
                          <p className="text-lg text-slate-700">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-500 mb-6 flex items-center gap-3">
              <Calendar className="w-7 h-7" />
              Past Appointments
              <Badge className="ml-2 text-base px-3 py-1 bg-slate-100 text-slate-600">{pastAppointments.length}</Badge>
            </h3>
            <div className="space-y-6">
              {pastAppointments.map((appointment) => (
                <Card key={appointment._id} className="p-8 bg-white/80 backdrop-blur-sm border-2 border-slate-100 shadow-lg opacity-80">
                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-2xl font-bold text-slate-800 mb-1">{appointment.doctorName}</h4>
                          {appointment.specialty && <p className="text-lg text-slate-600">{appointment.specialty}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="text-lg px-4 py-2 bg-slate-100 text-slate-600">Completed</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-50 rounded-xl p-2"
                            onClick={() => handleDelete(appointment._id)}
                            disabled={deletingId === appointment._id}
                          >
                            {deletingId === appointment._id ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3 text-base">
                        <div className="flex items-center">
                          <Calendar className="w-6 h-6 mr-3 text-slate-500" />
                          <span className="text-slate-700">{formatDate(appointment.date)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-6 h-6 mr-3 text-slate-500" />
                          <span className="text-slate-700">{appointment.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Floating Add Button */}
        <div className="fixed bottom-28 right-8">
          <Button
            onClick={() => onNavigate('add-appointment')}
            size="lg"
            className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1"
          >
            <Plus className="w-10 h-10" />
          </Button>
        </div>
      </div>
    </div>
  );
}
