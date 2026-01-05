import { NextResponse } from 'next/server';

/**
 * Type definition for email verification request body
 */
type VerifyEmailBody = { token: string };

/**
 * Handle POST requests for email verification
 * Used when verifying email from the verification page
 */
export async function POST(request: Request) {
  const apiBase =
    process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let body: VerifyEmailBody;
  try {
    body = (await request.json()) as VerifyEmailBody;
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  return await verifyEmailToken(apiBase, body.token);
}

/**
 * Handle GET requests for email verification
 * Used when clicking on verification link in email
 */
export async function GET(request: Request) {
  const apiBase =
    process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  
  // Get token from URL query parameter
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ message: 'Token is required' }, { status: 400 });
  }

  return await verifyEmailToken(apiBase, token);
}

/**
 * Helper function to verify email token with backend API
 * @param apiBase Base URL for the backend API
 * @param token Email verification token
 */
async function verifyEmailToken(apiBase: string, token: string): Promise<NextResponse> {
  let upstream: Response;
  try {
    // Use the token directly in the URL path for GET request
    upstream = await fetch(`${apiBase}/auth/verify-email/${token}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Error connecting to backend:', error);
    return NextResponse.json({ message: "Unable to connect to backend API" }, { status: 502 });
  }

  const payload = await upstream.json().catch(() => null);
  
  // Special case for "Email already confirmed" - treat as success
  if (!upstream.ok && payload?.message === 'Email already confirmed') {
    return NextResponse.json({ message: 'Email already confirmed', success: true }, { status: 200 });
  }
  
  if (!upstream.ok) {
    return NextResponse.json(payload ?? { message: 'Email verification failed' }, { status: upstream.status });
  }

  return NextResponse.json(payload ?? { message: 'Email verified successfully' }, { status: 200 });
}
