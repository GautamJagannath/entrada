import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Handle OAuth callback by allowing the dashboard to process the session
  if (url.pathname === '/dashboard' && url.searchParams.has('code')) {
    console.log('Middleware: OAuth callback detected, allowing dashboard access');
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};