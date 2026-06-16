import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ArrowLeft, FileText, Search, Download, Eye, Upload } from 'lucide-react';
import { Screen } from '../App';

interface MedicalRecordsScreenProps {
  onNavigate: (screen: Screen) => void;
}

// Mock data for medical records
const medicalRecords = [
  {
    id: 1,
    title: 'Blood Test Results',
    date: '2024-12-01',
    doctor: 'Dr. Emily Rodriguez',
    type: 'Lab Report',
    fileSize: '245 KB',
    category: 'lab'
  },
  {
    id: 3,
    title: 'Prescription - Metformin',
    date: '2024-11-25',
    doctor: 'Dr. Michael Chen',
    type: 'Prescription',
    fileSize: '180 KB',
    category: 'prescription'
  },
  {
    id: 4,
    title: 'X-Ray - Chest',
    date: '2024-11-20',
    doctor: 'Dr. James Wilson',
    type: 'Imaging',
    fileSize: '3.4 MB',
    category: 'imaging'
  }
];

const categoryColors = {
  lab: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800',
  prescription: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800',
  imaging: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800'
};

export function MedicalRecordsScreen({ onNavigate }: MedicalRecordsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || record.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const categories = [
    { id: 'all', label: 'All Records' },
    { id: 'lab', label: 'Lab Reports' },
    { id: 'prescription', label: 'Prescriptions' },
    { id: 'imaging', label: 'Imaging' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 pt-6 pb-24 sm:p-8 sm:pb-20">
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
          Medical Records
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="p-3 hover:bg-emerald-50"
        >
          <Upload className="w-8 h-8" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 w-7 h-7" />
        <Input
          placeholder="Search records..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-16 h-16 text-xl border-2 border-emerald-200 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map((category) => (
          <Button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl text-lg font-semibold transition-all duration-300 ${
              selectedCategory === category.id 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700' 
                : 'border-2 border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Records Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{record.title}</h3>
                    <p className="text-lg text-slate-600 mb-1">{record.doctor}</p>
                    <p className="text-base text-slate-500">{formatDate(record.date)} • {record.fileSize}</p>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={`text-base px-4 py-2 ${categoryColors[record.category as keyof typeof categoryColors]}`}
                  >
                    {record.type}
                  </Badge>
                </div>
                <div className="flex space-x-4 mt-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 h-14 text-lg font-semibold border-2 border-emerald-300 hover:bg-emerald-50 rounded-2xl"
                  >
                    <Eye className="w-6 h-6 mr-2" />
                    View
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 h-14 text-lg font-semibold border-2 border-emerald-300 hover:bg-emerald-50 rounded-2xl"
                  >
                    <Download className="w-6 h-6 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-16 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 rounded-3xl">
          <FileText className="w-24 h-24 text-slate-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-slate-700 mb-3">No records found</h3>
          <p className="text-lg text-slate-600">
            {searchQuery ? 'Try adjusting your search' : 'Upload your first medical record'}
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg">
        <h4 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">
          Storage Summary
        </h4>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl">
            <p className="text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">3</p>
            <p className="text-lg text-slate-600 font-semibold">Total Records</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl">
            <p className="text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">3.8 MB</p>
            <p className="text-lg text-slate-600 font-semibold">Used Storage</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl">
            <p className="text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">1</p>
            <p className="text-lg text-slate-600 font-semibold">This Month</p>
          </div>
        </div>
      </Card>
    </div>
  );
}