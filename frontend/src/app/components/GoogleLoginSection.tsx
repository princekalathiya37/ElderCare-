import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleButton } from './ui/google-button';
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
  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
    try {
      setLoading(true);
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      }).then((r) => r.json());
      const result = await apiService.googleLogin({
        email: userInfo.email,
        name: userInfo.name,
        googleId: userInfo.sub,
        role: 'elder',
      });
      if (result.success) {
        onSuccess();
      }
    } catch {
      onError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => onError('Google sign-in was cancelled or failed'),
    onNonOAuthError: (err) => {
      console.error('Google Auth Non-OAuth Error:', err);
      onError(`Google Sign-in failed (${err.type}). Ensure your domain is added to "Authorized JavaScript origins" in Google Cloud Console.`);
    }
  });

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
      <GoogleButton onClick={googleLogin} />
    </>
  );
}

export function GoogleLoginSection(props: GoogleLoginSectionProps) {
  if (!IS_GOOGLE_AUTH_ENABLED) {
    return null;
  }

  return <GoogleLoginOption {...props} />;
}
