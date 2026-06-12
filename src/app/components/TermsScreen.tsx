import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, FileText, Shield, Heart, AlertTriangle, Users, Lock } from 'lucide-react';
import { Screen } from '../App';

interface TermsScreenProps {
  onNavigate: (screen: Screen) => void;
}

const sections = [
  {
    icon: FileText,
    title: '1. Acceptance of Terms',
    color: 'from-emerald-400 to-teal-500',
    content: `By downloading, installing, or using ElderCare+, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the application. These terms apply to all users including elders and caretakers.`
  },
  {
    icon: Heart,
    title: '2. Medical Disclaimer',
    color: 'from-red-400 to-rose-500',
    content: `ElderCare+ is a health management and reminder application. It is NOT a medical device and does NOT provide medical advice, diagnosis, or treatment. The information provided in this app is for informational purposes only. Always consult a qualified healthcare professional for medical advice. Emergency features (SOS) are supplementary aids and must not replace calling emergency services (911).`
  },
  {
    icon: Users,
    title: '3. User Responsibilities',
    color: 'from-blue-400 to-indigo-500',
    content: `You are responsible for:
• Providing accurate and up-to-date health information
• Maintaining the confidentiality of your account credentials
• Ensuring emergency contacts are informed and willing to respond
• Using SOS features only in genuine emergencies
• Not sharing your account with unauthorized persons
• Reporting inaccuracies in your health data promptly`
  },
  {
    icon: Shield,
    title: '4. Data Privacy & Security',
    color: 'from-purple-400 to-violet-500',
    content: `Your health data is protected under our Privacy Policy. We implement industry-standard encryption and security measures. We do not sell your personal health data to third parties. Your data is shared only with caretakers you explicitly authorize. You have the right to access, modify, or delete your data at any time by contacting support@eldercare.app.`
  },
  {
    icon: Lock,
    title: '5. Caretaker Agreement',
    color: 'from-amber-400 to-orange-500',
    content: `Caretakers using ElderCare+ agree to:
• Access only health information they are authorized to view
• Use patient health data solely for care purposes
• Respond promptly to SOS alerts when feasible
• Maintain the privacy and confidentiality of all patient information
• Not share patient data with unauthorized third parties`
  },
  {
    icon: AlertTriangle,
    title: '6. Limitation of Liability',
    color: 'from-slate-400 to-slate-600',
    content: `ElderCare+ and its developers shall not be liable for any direct, indirect, incidental, or consequential damages arising from:
• Missed medicine reminders or notification failures
• Technical failures during emergency situations
• Inaccurate health data provided by users
• Network or connectivity issues
• Decisions made based on app data
The app is provided "as is" and we make no warranties about its fitness for any particular purpose.`
  }
];

export function TermsScreen({ onNavigate }: TermsScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('profile')} className="p-3 hover:bg-emerald-50">
          <ArrowLeft className="w-8 h-8" />
        </Button>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Terms & Conditions
        </h1>
        <div className="w-10" />
      </div>

      {/* Hero */}
      <Card className="mb-8 p-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-9 h-9 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">ElderCare+ Terms & Conditions</h2>
            <p className="text-lg text-emerald-100">Last updated: June 2024 · Version 1.0</p>
          </div>
        </div>
      </Card>

      {/* Intro */}
      <Card className="mb-6 p-6 bg-blue-50 border-2 border-blue-200 shadow-md">
        <p className="text-lg text-blue-800 leading-relaxed">
          Please read these Terms and Conditions carefully before using <strong>ElderCare+</strong>. These terms govern your use of our health management platform designed to assist elderly individuals and their caretakers in managing medications, appointments, and health monitoring.
        </p>
      </Card>

      {/* Sections */}
      <div className="space-y-5 mb-8">
        {sections.map(({ icon: Icon, title, color, content }, idx) => (
          <Card key={idx} className="p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-5">
              <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center shadow-md flex-shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            </div>
            <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-line">{content}</p>
          </Card>
        ))}
      </div>

      {/* Agreement */}
      <Card className="p-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-lg">
        <h3 className="text-xl font-bold text-emerald-700 mb-4">7. Contact & Updates</h3>
        <p className="text-lg text-slate-700 mb-4">
          These terms may be updated periodically. Continued use of ElderCare+ after updates constitutes acceptance of revised terms. For questions about these terms, contact us at:
        </p>
        <div className="space-y-2 text-lg font-semibold text-emerald-700">
          <p>📧 legal@eldercare.app</p>
          <p>📞 1-800-ELDERCARE</p>
          <p>🌐 www.eldercare.app/terms</p>
        </div>
        <div className="mt-6 p-4 bg-emerald-100 rounded-2xl border border-emerald-300">
          <p className="text-base text-emerald-800 font-semibold text-center">
            By using ElderCare+, you confirm that you have read, understood, and agree to these Terms & Conditions.
          </p>
        </div>
      </Card>
    </div>
  );
}
