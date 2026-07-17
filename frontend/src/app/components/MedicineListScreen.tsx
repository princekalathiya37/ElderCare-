// ============ UPDATED MEDICINE LIST SCREEN WITH BACKEND ============
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Clock, Pill, ArrowLeft, MessageSquare, CheckCircle2, AlertCircle, Loader, Mail } from 'lucide-react';
import { Screen } from '../App';
import apiService from '../services/apiService';
import { toast } from 'sonner';

interface MedicineListScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Medicine {
  _id: string;
  name: string;
  dosage: string;
  times: string[];
  frequency: string;
  nextDose: string;
  taken: boolean;
  emailAlert: boolean;
  emailContact: string;
  scheduledMinutesAgo?: number;
}

export function MedicineListScreen({ onNavigate }: MedicineListScreenProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getTodaysMedicines();

      if (response.success) {
        // Transform backend data to match UI format
        const transformedMedicines = response.data.map((med: any) => ({
          _id: med._id,
          name: med.name,
          dosage: med.dosage,
          times: med.scheduledTimes,
          frequency: med.frequency,
          nextDose: med.scheduledTimes[0] || 'Not scheduled',
          taken: med.todaysConfirmations?.some((c: any) => c.confirmed) || false,
          emailAlert: med.emailAlert,
          emailContact: med.emailContact,
          scheduledMinutesAgo: 0
        }));

        setMedicines(transformedMedicines);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load medicines';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMedicines();
    setRefreshing(false);
    toast.success('Medicines updated');
  };

  const markTaken = async (medicineId: string, time: string) => {
    try {
      const result = await apiService.confirmMedicineTaken(medicineId, time);

      if (result.success) {
        // Update local state
        setMedicines(medicines.map(m =>
          m._id === medicineId ? { ...m, taken: true } : m
        ));

        toast.success('✅ Medicine marked as taken!', {
          description: `Escalation alert cancelled`
        });

        // Refresh to get latest data
        fetchMedicines();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm';
      toast.error(errorMessage);
    }
  };

  const handleAddMedicine = () => {
    onNavigate('add-medicine');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading medicines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 pt-6 pb-24 sm:p-8 sm:pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            className="p-2 sm:p-3 hover:bg-emerald-50 flex-shrink-0"
          >
            <ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </Button>
          <h1 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex-1 text-center truncate px-2">
            My Medicines
          </h1>
          <div className="w-10 sm:w-14 flex-shrink-0" />
        </div>

        {/* Info Bar */}
        <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Mail className="w-8 h-8 text-amber-600 flex-shrink-0" />
              <p className="text-lg text-amber-800 font-semibold">
                Email alerts active — caregiver notified if medicine missed by 30 min
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="p-6 bg-red-50 border-2 border-red-200 mb-8">
            <div className="flex items-center space-x-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </Card>
        )}

        {/* Medicines List */}
        {medicines.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
            <Pill className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-600 mb-4">No medicines added yet</p>
            <Button
              onClick={handleAddMedicine}
              className="bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add First Medicine
            </Button>
          </Card>
        ) : (
          <div className="space-y-6 mb-12">
            {medicines.map((medicine) => (
              <Card
                key={medicine._id}
                className="p-4 sm:p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 sm:space-x-6 flex-1 min-w-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Pill className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1 sm:mb-2 truncate">
                        {medicine.name}
                      </h3>
                      <p className="text-lg text-slate-600 mb-2">
                        {medicine.dosage} · {medicine.frequency}
                      </p>
                      <div className="flex items-center text-base text-slate-600 mb-2">
                        <Clock className="w-5 h-5 mr-2" />
                        {medicine.times.join(', ')}
                      </div>
                      {medicine.emailAlert && (
                        <div className="flex items-center mt-2 space-x-2">
                          <Mail className="w-5 h-5 text-amber-500" />
                          <span className="text-sm text-amber-600 font-semibold">
                            Email alert to {medicine.emailContact}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row justify-between items-center sm:flex-col sm:items-end sm:text-right gap-3 sm:space-y-4 sm:ml-4 w-full sm:w-auto mt-2 sm:mt-0">
                    {medicine.taken ? (
                      <Badge
                        variant="secondary"
                        className="text-base sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Taken Today
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-base sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 border-amber-300 text-amber-700 bg-amber-50">
                        Pending
                      </Badge>
                    )}
                    {!medicine.taken && (
                      <Button
                        size="lg"
                        className="h-12 sm:h-14 text-sm sm:text-base font-semibold mt-0 sm:mt-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl"
                        onClick={() => markTaken(medicine._id, medicine.times[0])}
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Mark Taken
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add Button */}
        <div className="fixed bottom-28 right-8">
          <Button
            onClick={handleAddMedicine}
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

export default MedicineListScreen;
