// ============ UPDATED LOGIN SCREEN WITH BACKEND ============
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { GoogleButton } from './ui/google-button';
import apiService from '../services/apiService';
import PushNotificationService from '../services/pushNotificationService';
import { toast } from 'sonner';
import { Screen } from '../App';

interface LoginScreenProps {
  onNavigate: (screen: Screen) => void;
  onLoginSuccess: (token: string, user: any) => void;
}

export function LoginScreen({ onNavigate, onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      setLoading(true);

      // Call backend login
      const result = await apiService.login(email, password);

      if (result.success && result.token) {
        // Save token
        localStorage.setItem('authToken', result.token);
        
        // Initialize push notifications
        const pushService = new PushNotificationService();
        if (pushService.isSupported) {
          await pushService.initialize();
        }

        toast.success('Login successful! 👋');
        
        // Callback to parent with user data
        onLoginSuccess(result.token, result.user);
        onNavigate('home');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    onNavigate('register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            ElderCare+
          </h1>
          <p className="text-gray-600 mb-8">Welcome back! Login to your account</p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          {/* Google Button */}
          <div className="mt-6">
            <GoogleButton disabled={loading} />
          </div>

          {/* Register Link */}
          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={handleRegister}
              className="text-emerald-600 font-semibold hover:underline"
            >
              Register here
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default LoginScreen;
