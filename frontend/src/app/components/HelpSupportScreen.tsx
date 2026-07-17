import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle,
  MessageSquare,
  Phone,
  Mail,
  Loader
} from 'lucide-react';
import { Screen } from '../App';
import apiService from '../services/apiService';
import { toast } from 'sonner';

interface HelpSupportScreenProps {
  onNavigate: (screen: Screen) => void;
}

const faqs = [
  {
    q: 'How do I add a new medicine?',
    a: 'Go to the Medicines section from the home screen or bottom navigation, then tap the "+" button to add a new medicine. Fill in the name, dosage, and schedule.'
  },
  {
    q: 'How do I mark a medicine as taken?',
    a: 'In the Medicine List screen, find the medicine you want to mark and tap the checkbox or "Mark as Taken" button next to it. The status will be updated immediately.'
  },
  {
    q: 'How do I set up emergency contacts for SOS?',
    a: 'Go to your Profile screen, then edit your profile. Emergency contacts are managed under your profile settings. In the SOS section, your saved contacts will be notified.'
  },
  {
    q: 'How does the medicine adherence percentage work?',
    a: 'The adherence % in Calendar & Analytics shows what percentage of the last 30 days you took at least one medicine. 100% means you took medicines every day this month.'
  },
  {
    q: 'Can a caretaker see my health data?',
    a: 'Only caretakers explicitly linked to your account can view your health data. You can manage caretaker access through your profile settings.'
  },
  {
    q: 'How do I change my password?',
    a: 'Go to Profile → Privacy & Security → Change Password. You\'ll need your current password to set a new one.'
  },
  {
    q: 'What happens when I trigger an SOS?',
    a: 'An emergency alert is sent to all your registered emergency contacts with your current location. The alert stays active until you or a caretaker resolves it.'
  },
  {
    q: 'How do I add or remove appointment reminders?',
    a: 'Go to Profile → Notification Settings and toggle Appointment Reminders on or off. Reminders are sent 24 hours before your scheduled appointments.'
  }
];

export function HelpSupportScreen({ onNavigate }: HelpSupportScreenProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [queryForm, setQueryForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmitQuery = async () => {
    if (!queryForm.subject.trim() || !queryForm.message.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }
    try {
      setSending(true);
      await apiService.sendSupportQuery(queryForm.subject.trim(), queryForm.message.trim());
      setSent(true);
      setQueryForm({ subject: '', message: '' });
      toast.success('Query submitted! We\'ll get back to you soon.');
    } catch {
      toast.error('Failed to send query. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 pt-6 pb-6 sm:p-8 sm:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('profile')} className="p-3 hover:bg-emerald-50">
          <ArrowLeft className="w-8 h-8" />
        </Button>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Help & Support
        </h1>
        <div className="w-10" />
      </div>

      {/* Hero Banner */}
      <Card className="mb-8 p-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-9 h-9 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">We're here to help!</h2>
            <p className="text-lg text-emerald-100">Find answers to common questions or send us a message</p>
          </div>
        </div>
      </Card>

      {/* Quick Contact */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="p-5 bg-white/80 border-2 border-emerald-100 shadow-md text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <h4 className="text-lg font-bold text-slate-800">Call Support</h4>
          <p className="text-base text-emerald-600 font-semibold mt-1">1-800-ELDERCARE</p>
          <p className="text-sm text-slate-500">Mon–Fri, 9am–6pm</p>
        </Card>
        <Card className="p-5 bg-white/80 border-2 border-emerald-100 shadow-md text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h4 className="text-lg font-bold text-slate-800">Email Us</h4>
          <p className="text-base text-blue-600 font-semibold mt-1">support@eldercare.app</p>
          <p className="text-sm text-slate-500">24-48 hour response</p>
        </Card>
      </div>

      {/* FAQs */}
      <Card className="mb-8 p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg">
        <h3 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-3">
          <MessageSquare className="w-7 h-7" />
          Frequently Asked Questions
        </h3>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-2 border-emerald-100 rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-emerald-50 transition-colors"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span className="text-lg font-semibold text-slate-800 pr-4">{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-slate-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <p className="text-lg text-slate-700 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Send Query Form */}
      <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-emerald-100 shadow-lg">
        <h3 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center gap-3">
          <Send className="w-7 h-7" />
          Send Us a Query
        </h3>

        {sent ? (
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h4 className="text-2xl font-bold text-emerald-700 mb-3">Query Submitted!</h4>
            <p className="text-lg text-slate-600 mb-6">We've received your message and will respond within 24–48 hours.</p>
            <Button
              onClick={() => setSent(false)}
              variant="outline"
              className="h-12 px-8 text-lg border-2 border-emerald-400 text-emerald-700 rounded-2xl"
            >
              Send Another Query
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-lg font-semibold text-slate-700">Subject *</Label>
              <Input
                value={queryForm.subject}
                onChange={e => setQueryForm({ ...queryForm, subject: e.target.value })}
                placeholder="What's your query about?"
                className="h-14 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-lg font-semibold text-slate-700">Message *</Label>
              <Textarea
                value={queryForm.message}
                onChange={e => setQueryForm({ ...queryForm, message: e.target.value })}
                placeholder="Describe your issue or question in detail..."
                className="min-h-32 text-lg border-2 border-slate-200 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <Button
              onClick={handleSubmitQuery}
              disabled={sending}
              className="w-full h-14 text-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl shadow-lg"
            >
              {sending ? (
                <><Loader className="w-6 h-6 animate-spin mr-3" />Sending...</>
              ) : (
                <><Send className="w-6 h-6 mr-3" />Submit Query</>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
