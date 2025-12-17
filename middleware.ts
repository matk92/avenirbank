import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest): NextResponse | undefined {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  // Skip files (e.g. /sitemap.xml, /file.svg) so auth doesn't break static assets / SEO files.
  const isFileRequest = /\.[^/]+$/.test(pathname);
  if (isFileRequest) {
    return undefined;
  }

  const authRoutes = ['/login', '/register', '/auth/login', '/auth/register'];
  const publicRoutes = ['/', ...authRoutes];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  // If user is authenticated and tries to access login/register, redirect to client dashboard
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/client', request.url));
  }

  // If user is not authenticated and tries to access protected routes, redirect to login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return undefined;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next|favicon.ico).*)',
  ],
};
