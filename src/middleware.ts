import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData, defaultSession } from './lib/session';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(request, res, sessionOptions);

  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');

  // Let API auth routes pass through
  if (isApiAuthRoute) {
    return res;
  }

  // Redirect to login if not logged in and not on login page
  if (!session.isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if logged in and trying to access login page
  if (session.isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
