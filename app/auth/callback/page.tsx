"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('Auth callback page loaded');

      // Check for OAuth parameters
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      console.log('Callback params:', {
        hasCode: !!code,
        error,
        fullUrl: window.location.href
      });

      if (error) {
        console.error('OAuth error:', error);
        router.replace('/login?error=oauth_error');
        return;
      }

      if (code) {
        try {
          // Try to exchange the code for a session
          console.log('Exchanging code for session...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            router.replace('/login?error=session_error');
            return;
          }

          if (data.session) {
            console.log('Session established successfully:', data.session.user.email);
            setProcessing(false);
            router.replace('/dashboard');
            return;
          }
        } catch (error) {
          console.error('Callback processing error:', error);
          router.replace('/login?error=callback_error');
          return;
        }
      }

      // Fallback: wait for auth state change
      const maxWaitTime = 5000; // 5 seconds max
      const startTime = Date.now();

      const checkAuth = () => {
        if (user) {
          console.log('User authenticated via auth state, redirecting to dashboard');
          setProcessing(false);
          router.replace('/dashboard');
        } else if (Date.now() - startTime > maxWaitTime) {
          console.log('Auth timeout, redirecting to login');
          setProcessing(false);
          router.replace('/login?error=auth_timeout');
        } else if (!loading) {
          // Still loading, check again in 500ms
          setTimeout(checkAuth, 500);
        }
      };

      if (!user && !loading) {
        checkAuth();
      }
    };

    handleCallback();
  }, [searchParams, router, user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">
          {processing ? 'Processing authentication...' : 'Completing sign in...'}
        </p>
        <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
      </div>
    </div>
  );
}