import { NextResponse } from 'next/server';

/**
 * Handle GET requests for email verification with token in URL path
 * Used when clicking on verification link in email
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const apiBase =
    process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const { token } = await params;

  if (!token) {
    return NextResponse.json({ message: 'Token is required' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${apiBase}/auth/verify-email/${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const payload = await upstream.json().catch(() => null);

    // Special case for "Email already confirmed" - treat as success
    if (!upstream.ok && payload?.message === 'Email already confirmed') {
      return NextResponse.json({ message: 'Email already confirmed', success: true }, { status: 200 });
    }

    if (!upstream.ok) {
      return NextResponse.json(payload ?? { message: 'Email verification failed' }, { status: upstream.status });
    }

    return NextResponse.json(payload ?? { message: 'Email verified successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error connecting to backend:', error);
    return NextResponse.json({ message: 'Unable to connect to backend API' }, { status: 502 });
  }
}
