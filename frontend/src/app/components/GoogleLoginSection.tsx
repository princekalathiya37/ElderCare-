import React, { useEffect, useState } from 'react';
import apiService from '../services/apiService';
import { IS_GOOGLE_AUTH_ENABLED, GOOGLE_CLIENT_ID } from '../config';

interface GoogleLoginSectionProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Decode a Google JWT (ID token) without a library.
 */
function decodeGoogleJWT(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Google Sign-In using redirect flow (ux_mode=redirect).
 * 
 * Flow:
 *  1. User clicks "Sign in with Google"
 *  2. Page navigates to Google's auth page (no popup)
 *  3. Google redirects back to our page with credential in URL hash/fragment
 *  4. On page load, we check for the credential and call the backend
 * 
 * This is immune to popup blockers and doesn't require specific COOP headers.
 */
function GoogleRedirectButton({
  onSuccess,
  onError,
  setLoading,
}: GoogleLoginSectionProps) {
  const [gsiReady, setGsiReady] = useState(false);

  // Load the Google Identity Services script
  useEffect(() => {
    // Check if already loaded
    if ((window as any).google?.accounts?.id) {
      setGsiReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGsiReady(true);
    };
    script.onerror = () => {
      console.error('Failed to load Google Identity Services script');
    };
    document.body.appendChild(script);
  }, []);

  // On mount, check if Google redirected back with a credential
  useEffect(() => {
    const handleGoogleCredential = async (credential: string) => {
      try {
        setLoading(true);
        const userInfo = decodeGoogleJWT(credential);
        if (!userInfo || !userInfo.email || !userInfo.sub) {
          onError('Google sign-in failed: Invalid credential');
          return;
        }

        const result = await apiService.googleLogin({
          email: userInfo.email,
          name: userInfo.name || userInfo.email.split('@')[0],
          googleId: userInfo.sub,
          role: 'elder',
        });

        if (result.success) {
          // Clear the credential from URL
          window.history.replaceState({}, document.title, window.location.pathname);
          onSuccess();
        } else {
          onError(result.error || 'Google sign-in failed');
        }
      } catch (err: any) {
        onError(err.message || 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
    };

    // Check URL hash for Google One Tap credential response (redirect mode)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const credential = params.get('credential');

    if (credential) {
      handleGoogleCredential(credential);
      return;
    }

    // Also check query params (alternative redirect)
    const searchParams = new URLSearchParams(window.location.search);
    const queryCredential = searchParams.get('credential');
    if (queryCredential) {
      handleGoogleCredential(queryCredential);
    }
  }, []);

  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      onError('Google Client ID is not configured');
      return;
    }

    const gsi = (window as any).google?.accounts?.oauth2;
    const gsiId = (window as any).google?.accounts?.id;

    if (gsiId) {
      // Use One Tap with redirect UX mode
      gsiId.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          if (response.credential) {
            try {
              setLoading(true);
              const userInfo = decodeGoogleJWT(response.credential);
              if (!userInfo) {
                onError('Google sign-in failed: Invalid token');
                return;
              }

              const result = await apiService.googleLogin({
                email: userInfo.email,
                name: userInfo.name || userInfo.email.split('@')[0],
                googleId: userInfo.sub,
                role: 'elder',
              });

              if (result.success) {
                onSuccess();
              } else {
                onError(result.error || 'Google sign-in failed');
              }
            } catch (err: any) {
              onError(err.message || 'Google sign-in failed');
            } finally {
              setLoading(false);
            }
          } else {
            onError('Google sign-in cancelled');
          }
        },
        ux_mode: 'popup',
        auto_select: false,
      });
      gsiId.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Popup was blocked or dismissed — fall back to redirect
          const redirectUrl = buildOAuthRedirectUrl();
          window.location.href = redirectUrl;
        }
      });
    } else {
      // GSI not loaded yet, fall back to manual OAuth redirect
      const redirectUrl = buildOAuthRedirectUrl();
      window.location.href = redirectUrl;
    }
  };

  const buildOAuthRedirectUrl = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'token id_token',
      scope: 'openid email profile',
      nonce: Math.random().toString(36).slice(2),
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
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
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full h-16 text-xl font-semibold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl flex items-center justify-center gap-3 bg-white transition-all hover:shadow-md hover:border-slate-300"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1,0,0,1,-2.4545,-3.1818)">
            <path
              d="M 26.999,14.755 C 26.999,13.823 26.923,12.909 26.782,12.034 L 14.5,12.034 L 14.5,15.19 L 21.881,15.19 C 21.618,16.65 20.829,17.946 19.635,18.867 L 19.635,21.896 L 23.375,21.896 C 25.65,19.789 26.999,17.476 26.999,14.755 Z"
              fill="#4285F4"
            />
            <path
              d="M 14.5,26 C 17.978,26 20.856,24.841 23.375,22.76 L 19.635,19.731 C 18.347,20.611 16.635,21.128 14.5,21.128 C 10.958,21.128 7.981,18.78 6.774,15.548 L 2.907,15.548 L 2.907,18.673 C 5.452,23.691 9.669,27 14.5,27 Z"
              fill="#34A853"
            />
            <path
              d="M 6.774,15.548 C 6.386,14.43 6.172,13.224 6.172,12 C 6.172,10.776 6.386,9.57 6.753,8.452 L 6.753,5.327 L 2.887,5.327 C 1.569,7.936 0.8,10.887 0.8,14 C 0.8,17.113 1.569,20.064 2.887,22.673 L 6.753,19.548 L 6.774,15.548 Z"
              fill="#FBBC05"
            />
            <path
              d="M 14.5,5.221 C 16.983,5.221 19.19,6.089 20.829,7.696 L 24.218,4.307 C 21.611,1.893 18.264,0.5 14.5,0.5 C 9.669,0.5 5.452,3.809 2.907,8.827 L 6.774,11.952 C 7.981,8.72 10.958,6.372 14.5,6.372 Z"
              fill="#EA4335"
            />
          </g>
        </svg>
        Sign in with Google
      </button>
    </>
  );
}

export function GoogleLoginSection(props: GoogleLoginSectionProps) {
  if (!IS_GOOGLE_AUTH_ENABLED) {
    return null;
  }

  return <GoogleRedirectButton {...props} />;
}
