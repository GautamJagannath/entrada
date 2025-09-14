"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('Auth callback page loaded');

    // Wait for auth to settle, then redirect
    const timer = setTimeout(() => {
      if (user) {
        console.log('User authenticated in callback, redirecting to dashboard');
        router.replace('/dashboard');
      } else if (!loading) {
        console.log('No user in callback, redirecting to login');
        router.replace('/login?error=auth_failed');
      }
    }, 2000); // Give auth 2 seconds to process

    return () => clearTimeout(timer);
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}