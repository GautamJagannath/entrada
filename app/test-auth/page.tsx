"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export default function TestAuth() {
  const [status, setStatus] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const testGoogleAuth = async () => {
    try {
      setStatus('Starting OAuth...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/test-auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      console.log('OAuth result:', { data, error });

      if (error) {
        setStatus(`Error: ${error.message}`);
      } else if (data.url) {
        setStatus(`Redirecting to: ${data.url}`);
      } else {
        setStatus('No URL received from OAuth');
      }
    } catch (err) {
      console.error('OAuth test error:', err);
      setStatus(`Exception: ${err}`);
    }
  };

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Current session:', { session, error });

      if (session?.user) {
        setStatus(`Logged in as: ${session.user.email}`);
      } else {
        setStatus('No active session');
      }
    } catch (err) {
      console.error('Session check error:', err);
      setStatus(`Session check failed: ${err}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Auth Test Page</h1>

        <div className="space-y-2">
          <Button onClick={testGoogleAuth} className="w-full">
            Test Google OAuth
          </Button>

          <Button onClick={checkSession} className="w-full" variant="outline">
            Check Session
          </Button>
        </div>

        {status && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm">{status}</p>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>Current URL: {mounted ? window.location.href : 'Loading...'}</p>
          <p>Origin: {mounted ? window.location.origin : 'Loading...'}</p>
        </div>
      </div>
    </div>
  );
}