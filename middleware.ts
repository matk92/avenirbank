import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest): NextResponse | undefined {
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  const pathname = request.nextUrl.pathname;

  // Skip files (e.g. /sitemap.xml, /file.svg) so auth doesn't break static assets / SEO files.
  const isFileRequest = /\.[^/]+$/.test(pathname);
  if (isFileRequest) {
    return undefined;
  }

  const roleHome: Record<string, string> = {
    CLIENT: '/client',
    ADVISOR: '/advisor',
    DIRECTOR: '/director',
  };

  const roleProtectedPrefixes: Array<{ prefix: string; role: string }> = [
    { prefix: '/client', role: 'CLIENT' },
    { prefix: '/advisor', role: 'ADVISOR' },
    { prefix: '/director', role: 'DIRECTOR' },
  ];

  const authRoutes = ['/login', '/register', '/auth/login', '/auth/register'];
  const publicRoutes = ['/', ...authRoutes];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  if (token && pathname === '/') {
    const destination = (userRole && roleHome[userRole]) || '/client';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // If user is authenticated and tries to access login/register, redirect based on role
  if (token && isAuthRoute) {
    const destination = (userRole && roleHome[userRole]) || '/client';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // If user is not authenticated and tries to access protected routes, redirect to login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    const protectedRoute = roleProtectedPrefixes.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`));

    if (protectedRoute) {
      if (!userRole) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        response.cookies.delete('userRole');
        return response;
      }

      if (userRole !== protectedRoute.role) {
        const destination = roleHome[userRole] ?? '/login';
        return NextResponse.redirect(new URL(destination, request.url));
      }
    }
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
