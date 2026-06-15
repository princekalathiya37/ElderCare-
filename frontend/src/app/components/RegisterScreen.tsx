import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { BlackFireCursorTrail } from './ui/BlackFireCursorTrail';
import {
  Mail,
  Lock, 
  Eye, 
  EyeOff,
  User,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Screen } from '../App';

import apiService from '../services/apiService';
import { GoogleLoginSection } from './GoogleLoginSection';
import { toast } from 'sonner';

interface RegisterScreenProps {
  onNavigate: (screen: any) => void;

}

export function RegisterScreen({ onNavigate }: RegisterScreenProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleRegister = async () => {
    setError('');
    setSuccess(false);

    // Validation
    if (!formData.fullName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword || !formData.age) {
      setError('Please fill in all required fields (including age)');
      return;
    }

    const parsedAge = parseInt(formData.age);
    if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      setError('Please enter a valid age between 1 and 120');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setError('Please agree to Terms and Conditions');
      return;
    }

    try {
      const response = await apiService.register({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        phone: formData.phone,
        role: 'elder',
        age: formData.age ? parseInt(formData.age) : undefined
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onNavigate('login');
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <>
      <BlackFireCursorTrail />
      <div className="min-h-screen bg-background p-4 overflow-y-auto pb-20">
      <div className="w-full max-w-md mx-auto py-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/ChatGPT Image Jun 10, 2026, 11_31_09 AM.png"
            alt="ElderCare+ Logo"
            className="w-full max-w-xs mx-auto mb-4"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'w-full max-w-xs mx-auto mb-4 flex flex-col items-center';
              fallback.innerHTML = `
                <div class="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-5xl mb-2">🏥</div>
                <h1 class="text-primary text-3xl font-bold mb-1">ElderCare+</h1>
                <p class="text-muted-foreground">Create Your Account</p>
              `;
              target.parentNode?.insertBefore(fallback, target.nextSibling);
            }}
          />
        </div>

        {/* Registration Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-primary">Join ElderCare+</CardTitle>
            <CardDescription className="text-lg">
              Sign up to start managing your health
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-800 font-medium">Registration Successful!</p>
                  <p className="text-green-700 text-sm mt-1">Redirecting to login...</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-destructive">{error}</p>
              </div>
            )}

            {/* Full Name Input */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center space-x-2">
                <User className="w-5 h-5 text-primary" />
                <span>Full Name *</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="h-14 text-lg border-2"
                autoComplete="name"
              />
            </div>

            {/* Age Input */}
            <div className="space-y-2">
              <Label htmlFor="age" className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Age *</span>
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="Enter your age"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                className="h-14 text-lg border-2"
                min="1"
                max="120"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-primary" />
                <span>Email Address *</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="h-14 text-lg border-2"
                autoComplete="email"
              />
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-primary" />
                <span>Phone Number *</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="h-14 text-lg border-2"
                autoComplete="tel"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-primary" />
                <span>Password *</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password (min 6 characters)"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="h-14 text-lg border-2 pr-14"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <Eye className="w-6 h-6 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-primary" />
                <span>Confirm Password *</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="h-14 text-lg border-2 pr-14"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <Eye className="w-6 h-6 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start space-x-3 bg-accent/50 p-4 rounded-xl border border-border">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                className="w-6 h-6 mt-1"
              />
              <Label
                htmlFor="terms"
                className="cursor-pointer leading-relaxed"
              >
                I agree to the{' '}
                <Button variant="link" className="h-auto p-0 text-primary underline">
                  Terms and Conditions
                </Button>{' '}
                and{' '}
                <Button variant="link" className="h-auto p-0 text-primary underline">
                  Privacy Policy
                </Button>
              </Label>
            </div>

            {/* Register Button */}
            <Button
              className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
              onClick={handleRegister}
              disabled={success || loading}
            >
              {success ? 'Registration Successful!' : 'Create Account'}
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
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-4 text-muted-foreground">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login Button */}
            <Button
              variant="outline"
              className="w-full h-14 text-lg border-2 border-primary text-primary hover:bg-accent"
              onClick={() => onNavigate('login')}
            >
              Sign In Instead
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-muted-foreground">
          <p className="text-sm">Your health data is secure and private</p>
        </div>
      </div>
    </div>
    </>
  );
}
