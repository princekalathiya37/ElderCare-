
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { BlackFireCursorTrail } from './ui/BlackFireCursorTrail';
import { GoogleLoginSection } from './GoogleLoginSection';
import {
  Mail,
  Lock,
  AlertCircle,
  User,
  Pill,
  ArrowLeft
} from 'lucide-react';
import { Screen } from '../App';

// Missing icons
function Eye({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

import apiService from '../services/apiService';
import { toast } from 'sonner';

interface LoginScreenProps {
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
}

export function LoginScreen({ onNavigate, onBack }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    
    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const result = await apiService.login(email, password);
      
      if (result.success && result.token) {
        toast.success('Login successful!');
        onNavigate('home');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BlackFireCursorTrail />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10 relative">

          <img
            src="/ChatGPT Image Jun 10, 2026, 11_31_09 AM.png"
            alt="ElderCare+ Logo"
            className="max-w-xs w-full mx-auto mb-6"
          />
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Welcome Back
          </h1>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border-2 border-emerald-100">
          <div className="p-8 space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start space-x-4">
                <AlertCircle className="w-7 h-7 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 font-semibold text-lg">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-3">
              <Label htmlFor="email" className="flex items-center space-x-3 text-lg font-semibold text-slate-700">
                <User className="w-6 h-6 text-emerald-600" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-16 text-xl border-2 border-slate-200 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all"
                autoComplete="email"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-3">
              <Label htmlFor="password" className="flex items-center space-x-3 text-lg font-semibold text-slate-700">
                <Pill className="w-6 h-6 text-emerald-600" />
                <span>Password</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-16 text-xl border-2 border-slate-200 rounded-2xl pr-20 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 p-0 hover:bg-emerald-50"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-7 h-7 text-slate-500" />
                  ) : (
                    <Eye className="w-7 h-7 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="w-6 h-6 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-teal-600 data-[state=checked]:border-transparent"
                />
                <Label
                  htmlFor="remember"
                  className="cursor-pointer text-lg font-semibold text-slate-700"
                >
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                onClick={() => alert('Password recovery would send an email here in a real app!')}
                className="text-lg font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <Button
              className="w-full h-16 text-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              onClick={handleLogin}
            >
              Sign In
            </Button>

            <GoogleLoginSection
              onSuccess={() => {
                toast.success('Signed in with Google!');
                onNavigate('home');
              }}
              onError={setError}
              setLoading={setLoading}
            />

            {/* Divider */}
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-500 font-medium">
                  New to ElderCare+?
                </span>
              </div>
            </div>

            {/* Create Account Button */}
            <Button
              variant="outline"
              className="w-full h-16 text-xl font-semibold border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 transition-all duration-300 rounded-2xl mt-4"
              onClick={() => onNavigate('register')}
            >
              Create Account
            </Button>
          </div>
        </Card>
      </div>
    </div>
    </>
  );
}
