import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import apiService from '../services/apiService';
import { IS_GOOGLE_AUTH_ENABLED } from '../config';

interface GoogleLoginSectionProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  setLoading: (loading: boolean) => void;
}

function GoogleLoginOption({
  onSuccess,
  onError,
  setLoading,
}: GoogleLoginSectionProps) {
  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode JWT:', e);
      return null;
    }
  };

  const handleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      if (!credentialResponse.credential) {
        onError('Google sign-in failed: No credential returned');
        return;
      }

      const userInfo = decodeJWT(credentialResponse.credential);
      if (!userInfo) {
        onError('Google sign-in failed: Invalid token payload');
        return;
      }

      const result = await apiService.googleLogin({
        email: userInfo.email,
        name: userInfo.name,
        googleId: userInfo.sub,
        role: 'elder',
      });
      if (result.success) {
        onSuccess();
      } else {
        onError(result.error || 'Google sign-in failed. Please try again.');
      }
    } catch (err: any) {
      onError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative flex items-center justify-center py-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-slate-200" />
        </div>
        <div className="relative bg-white/90 px-4">
          <span className="text-lg font-semibold text-slate-500">or</span>
        </div>
      </div>
      <div className="w-full flex justify-center [&>div]:w-full [&_iframe]:!w-full [&_iframe]:!max-w-full">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => onError('Google sign-in was cancelled or failed')}
          useOneTap={false}
          theme="outline"
          size="large"
          shape="rectangular"
          width="100%"
        />
      </div>
    </>
  );
}

export function GoogleLoginSection(props: GoogleLoginSectionProps) {
  if (!IS_GOOGLE_AUTH_ENABLED) {
    return null;
  }

  return <GoogleLoginOption {...props} />;
}
