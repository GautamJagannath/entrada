"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { Chrome, Loader2, AlertCircle } from 'lucide-react';

function getErrorMessage(error: string | null): string {
  switch (error) {
    case 'auth_failed':
      return 'Authentication failed. Please try again.';
    case 'oauth_error':
      return 'There was an error with Google authentication.';
    case 'session_error':
      return 'Failed to establish session. Please try again.';
    case 'callback_error':
      return 'Authentication callback failed. Please try again.';
    case 'auth_timeout':
      return 'Authentication timed out. Please try again.';
    default:
      return 'An unknown error occurred. Please try again.';
  }
}

export default function LoginPage() {
  const { signInWithGoogle, user, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user && !loading) {
      console.log('Login: User authenticated, redirecting to dashboard:', user.email);
      router.replace('/dashboard');
    } else if (!loading) {
      console.log('Login: No user, showing login form');
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Login error:', error.message);
        setIsSigningIn(false);
      }
      // Success will be handled by the auth state change listener
    } catch (error) {
      console.error('Login error:', error);
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">
            Welcome to Entrada
          </CardTitle>
          <CardDescription className="text-lg">
            California SIJS guardianship forms made simple
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Display */}
          {searchParams.get('error') && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Sign in failed</h4>
                <p className="text-sm text-red-600">
                  {getErrorMessage(searchParams.get('error'))}
                </p>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Sign in with your Google account to get started
            </p>

            <Button
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSigningIn ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Chrome className="h-5 w-5 mr-2" />
              )}
              {isSigningIn ? 'Signing in...' : 'Continue with Google'}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>
              Secure authentication powered by Supabase
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}