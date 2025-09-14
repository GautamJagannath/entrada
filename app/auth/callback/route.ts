import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }
  }

  // Redirect to dashboard or specified next URL
  return NextResponse.redirect(new URL(next, request.url));
}