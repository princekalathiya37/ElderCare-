import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Calendar as CalendarIcon,
  BarChart3,
  ArrowLeft,
  TrendingUp,
  Loader,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Screen } from '../App';
import apiService from '../services/apiService';

interface CalendarAnalyticsScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface DayStats {
  date: string;
  taken: number;
  total: number;
  percent: number;
}

interface AdherenceData {
  adherencePercent: number;
  takenDays: number;
  totalDays: number;
  dailyBreakdown: DayStats[];
}

export function CalendarAnalyticsScreen({
  onNavigate
}: CalendarAnalyticsScreenProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [adherenceData, setAdherenceData] = useState<AdherenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAdherenceStats();
        if (response.success) {
          setAdherenceData(response.data);
        }
      } catch (error) {
        console.error('Failed to load adherence stats:', error);
        // Fallback to empty data
        setAdherenceData({
          adherencePercent: 0,
          takenDays: 0,
          totalDays: 30,
          dailyBreakdown: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Build chart data from last 7 days breakdown
  const chartData = adherenceData?.dailyBreakdown.slice(-7).map(d => ({
    name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    percent: d.percent,
    taken: d.taken,
    total: d.total
  })) || [];

  // Build calendar day modifiers for taken/missed days
  const takenDays = adherenceData?.dailyBreakdown
    .filter(d => d.taken > 0)
    .map(d => new Date(d.date)) || [];
  const missedDays = adherenceData?.dailyBreakdown
    .filter(d => d.total > 0 && d.taken === 0)
    .map(d => new Date(d.date)) || [];

  const adherencePct = adherenceData?.adherencePercent ?? 0;
  const adherenceColor = adherencePct >= 80 ? '#10b981' : adherencePct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8">
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
          Calendar & Analytics
        </h1>
        <div className="w-10" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-lg text-slate-600">Loading your analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* 30-Day Adherence Hero */}
          <Card className="mb-8 p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-xl">
            <h3 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-3">
              <TrendingUp className="w-8 h-8" />
              30-Day Medicine Adherence
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Circular Progress */}
              <div className="relative flex-shrink-0">
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="68" fill="none" stroke="#e2e8f0" strokeWidth="16" />
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    fill="none"
                    stroke={adherenceColor}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 68}`}
                    strokeDashoffset={`${2 * Math.PI * 68 * (1 - adherencePct / 100)}`}
                    transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  />
                  <text x="80" y="74" textAnchor="middle" fontSize="28" fontWeight="bold" fill={adherenceColor}>
                    {adherencePct}%
                  </text>
                  <text x="80" y="98" textAnchor="middle" fontSize="12" fill="#64748b">
                    Adherence
                  </text>
                </svg>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 text-center">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-600">{adherenceData?.takenDays}</p>
                  <p className="text-lg font-semibold text-slate-600">Days Medicine Taken</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border-2 border-red-200 text-center">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-extrabold text-red-600">{(adherenceData?.totalDays || 30) - (adherenceData?.takenDays || 0)}</p>
                  <p className="text-lg font-semibold text-slate-600">Days Missed</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 text-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-extrabold text-blue-600">30</p>
                  <p className="text-lg font-semibold text-slate-600">Total Days Tracked</p>
                </div>
              </div>
            </div>

            {/* Adherence rating */}
            <div className={`mt-6 p-4 rounded-2xl text-center ${
              adherencePct >= 80 ? 'bg-emerald-50 border-2 border-emerald-200' :
              adherencePct >= 50 ? 'bg-amber-50 border-2 border-amber-200' :
              'bg-red-50 border-2 border-red-200'
            }`}>
              <p className="text-xl font-bold" style={{ color: adherenceColor }}>
                {adherencePct >= 80 ? '🌟 Excellent Adherence! Keep it up!' :
                 adherencePct >= 50 ? '⚠️ Good effort! Try not to miss doses.' :
                 '❗ Needs improvement. Please take your medicines regularly.'}
              </p>
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calendar Section */}
            <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg">
              <h3 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-3">
                <CalendarIcon className="w-8 h-8" />
                Medicine Calendar
              </h3>
              <div className="flex justify-center">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{ taken: takenDays, missed: missedDays }}
                  modifiersStyles={{
                    taken: { backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '50%', fontWeight: 'bold' },
                    missed: { backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '50%' }
                  }}
                  className="p-4"
                  classNames={{
                    months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                    month: 'space-y-4',
                    caption: 'flex justify-center pt-1 relative items-center text-xl font-bold text-emerald-700',
                    caption_label: 'text-2xl',
                    nav: 'space-x-1 flex items-center',
                    nav_button: 'h-10 w-10 bg-gradient-to-r from-emerald-100 to-teal-100 p-0 hover:opacity-100 rounded-xl',
                    nav_button_previous: 'absolute left-1',
                    nav_button_next: 'absolute right-1',
                    table: 'w-full border-collapse space-y-1',
                    head_row: 'flex',
                    head_cell: 'text-emerald-600 rounded-md w-12 font-bold text-xl pt-2 pb-2 text-center',
                    row: 'flex w-full mt-2',
                    cell: 'h-12 w-12 text-center text-lg p-0 relative',
                    day: 'h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-emerald-100 rounded-full',
                    day_selected: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full',
                    day_today: 'bg-emerald-200 text-emerald-800 font-bold rounded-full',
                    day_outside: 'text-muted-foreground opacity-50',
                    day_disabled: 'text-muted-foreground opacity-50',
                    day_hidden: 'invisible'
                  }}
                />
              </div>
              <div className="mt-4 flex gap-4 justify-center text-base">
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-emerald-200 border border-emerald-400" /> Taken</span>
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-red-200 border border-red-400" /> Missed</span>
              </div>
            </Card>

            {/* Weekly Bar Chart */}
            <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg">
              <h3 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-3">
                <BarChart3 className="w-8 h-8" />
                Last 7 Days Adherence (%)
              </h3>
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-xl">No data yet — start taking medicines to see stats!</p>
                  </div>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                      <XAxis dataKey="name" tick={{ fontSize: 14 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 14 }} tickFormatter={v => `${v}%`} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, 'Adherence']}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '2px solid #10b981',
                          fontSize: '16px'
                        }}
                      />
                      <Bar dataKey="percent" radius={[8, 8, 0, 0]} name="Adherence %">
                        {chartData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.percent >= 80 ? '#10b981' : entry.percent >= 50 ? '#f59e0b' : '#ef4444'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-4 flex gap-4 justify-center text-sm">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /> ≥80% Excellent</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400" /> 50–79%</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /> &lt;50% Needs work</span>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
