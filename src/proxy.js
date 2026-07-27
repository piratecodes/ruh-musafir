import { NextResponse } from 'next/server';

// This function runs on every single request that matches the config below
export function proxy(request) {
  // 1. Grab the current URL path (e.g., /profile, /login, /about)
  const { pathname } = request.nextUrl;

  // 2. Securely check for your NestJS HttpOnly cookie
  // We use optional chaining (?.) just in case the cookie doesn't exist at all
  const token = request.cookies.get('ruh_auth_token')?.value;

  // -----------------------------------------------------------------------
  // ROUTE CONFIGURATION (Easy to add more later!)
  // -----------------------------------------------------------------------
  
  // Routes that require the user to be LOGGED IN
  const protectedRoutes = ['/profile', '/bookings'];
  
  // Routes that require the user to be LOGGED OUT (Guests only)
  const authRoutes = ['/login', '/signup'];

  // -----------------------------------------------------------------------
  // SECURITY LOGIC & REDIRECTS
  // -----------------------------------------------------------------------

  // CHECK A: Is the user trying to access a PROTECTED route without a token?
  // We use .some() and .startsWith() so that sub-routes are also protected automatically.
  // Example: if '/bookings' is protected, '/bookings/123' is also protected!
  const isTryingToAccessProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  
  if (isTryingToAccessProtectedRoute && !token) {
    // SECURITY BRAINSTORM 1: The "Smart Redirect"
    // Instead of just sending them to /login, we append where they were trying to go.
    // When they finish logging in, your login page can read this and send them right back!
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    
    return NextResponse.redirect(redirectUrl);
  }

  // CHECK B: Is a LOGGED-IN user trying to access the login/signup pages?
  const isTryingToAccessAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  
  if (isTryingToAccessAuthRoute && token) {
    // Bounce them back to the dashboard. They have no business on the login page.
    return NextResponse.redirect(new URL('/', request.url));
  }

  // CHECK C: Let them pass!
  // If they aren't triggering any of the security checks above, render the page normally.
  return NextResponse.next();
}

// -----------------------------------------------------------------------
// MIDDLEWARE MATCHER
// -----------------------------------------------------------------------
// This tells Next.js which routes to run this middleware on. 
// We exclude static files, images, and Next.js internal files to keep your app lightning fast.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};