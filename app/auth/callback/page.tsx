"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('Auth callback page loaded');
      console.log('Current auth state:', { hasUser: !!user, isLoading: loading });

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
            // Don't return immediately - let the fallback auth check handle it
            console.log('Manual exchange failed, waiting for automatic session handling...');
          } else if (data.session) {
            console.log('Session established successfully via manual exchange:', data.session.user.email);
            setProcessing(false);
            router.replace('/dashboard');
            return;
          }
        } catch (error) {
          console.error('Callback processing error:', error);
          // Don't return immediately - let the fallback auth check handle it
          console.log('Manual exchange failed with error, waiting for automatic session handling...');
        }
      }

      // Fallback: wait for auth state change with session checking
      const maxWaitTime = 15000; // 15 seconds max
      const startTime = Date.now();
      let checkCount = 0;

      const checkAuth = async () => {
        checkCount++;
        const timeElapsed = Date.now() - startTime;

        console.log(`Auth check #${checkCount}:`, {
          hasUser: !!user,
          isLoading: loading,
          timeElapsed
        });

        // Also check current session directly
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          console.log(`Session check #${checkCount}:`, {
            hasSession: !!session,
            userEmail: session?.user?.email,
            error: sessionError?.message
          });

          if (session?.user) {
            console.log('Direct session found, redirecting to dashboard');
            setProcessing(false);
            router.replace('/dashboard');
            return;
          }
        } catch (sessionCheckError) {
          console.error('Error checking session:', sessionCheckError);
        }

        if (user) {
          console.log('User authenticated via auth context, redirecting to dashboard');
          setProcessing(false);
          router.replace('/dashboard');
        } else if (timeElapsed > maxWaitTime) {
          console.log(`Auth timeout after ${timeElapsed}ms (${checkCount} checks), redirecting to login`);
          setProcessing(false);
          router.replace('/login?error=auth_timeout');
        } else {
          // Check again in 1.5 seconds
          setTimeout(checkAuth, 1500);
        }
      };

      // Start checking after initial delay if no session was established
      if (!user) {
        setTimeout(checkAuth, 2000); // Start checking after 2 seconds
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

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}